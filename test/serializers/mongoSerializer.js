/*jshint maxlen:999*/
/*global describe:false,it:false*/

'use strict';

require('should');

var LIB_DIR = process.env.LIB_FOR_TESTS_DIR || '../../lib';
var mongoSerializer = require(LIB_DIR + '/serializers/mongoSerializer');
var parse = require(LIB_DIR).parse;
var Query = require(LIB_DIR + '/Query');

function q()
{
  var mongoQuery = {
    selector: {},
    fields: {},
    sort: {},
    limit: 0,
    skip: 0
  };

  if (arguments.length === 1)
  {
    mongoQuery.selector = arguments[0];
  }
  else
  {
    for (var i = 0; i < arguments.length; i += 2)
    {
      mongoQuery[arguments[i]] = arguments[i + 1];
    }
  }

  return mongoQuery;
}

var tests = {
  'a': q(),
  'a(one,2,three)': q(),
  'a&b&c': q(),
  'select(a,b,c)': q('fields', {a: true, b: true, c: true}),
  'exclude(a,b,c)': q('fields', {a: false, b: false, c: false}),
  'sort(a,-b,+c)': q('sort', {a: 1, b: -1, c: 1}),
  'limit(5)': q('limit', 5),
  'limit(10,30)': q('limit', 10, 'skip', 30),
  'a=b': q({a: 'b'}),
  'a!=b': q({a: {$ne: 'b'}}),
  'a>1': q({a: {$gt: 1}}),
  'a>=1': q({a: {$gte: 1}}),
  'a<1': q({a: {$lt: 1}}),
  'a<=1': q({a: {$lte: 1}}),
  'a=in=(1,2,3)': q({a: {$in: [1, 2, 3]}}),
  'a=in=()': q(),
  'a=nin=(1,2,3)': q({a: {$nin: [1, 2, 3]}}),
  'a=nin=()': q(),
  'a=all=(1,2,3)': q({a: {$all: [1, 2, 3]}}),
  'a=all=()': q(),
  'and()': q(),
  'a=1&b=2': q({a: 1, b: 2}),
  'or()': q(),
  'a=1|b=2': q({$or: [{a: 1}, {b: 2}]}),
  'or(a=1,b=2)': q({$or: [{a: 1}, {b: 2}]}),
  'a=1|(b=1&c=d)': q({$or: [{a: 1}, {$and: [{b: 1}, {c: 'd'}]}]}),
  'and(a=1,b=2)': q({a: 1, b: 2}),
  'nor(a=1,b=2)': q({$nor: [{a: 1}, {b: 2}]}),
  'not(a=b)': q({a: {$ne: 'b'}}),
  'not(a>1)': q({a: {$not: {$gt: 1}}}),
  'not((a=b|c>d))': q(),
  'not(a=b,c>d)': q({a: {$ne: 'b'}, c: {$not: {$gt: 'd'}}}),
  'not(a=1,a>10)': q({a: {$ne: 1, $not: {$gt: 10}}}),
  'not(a(),b(c,d))': q(),
  'a=re:simple': q({a: /simple/}),
  'exists(qty,true)&nin(qty,(5,15))': q({qty: {$exists: true, $nin: [5, 15]}}),
  'qty=exists=1': q(),
  'type(qty,16)': q({qty: {$type: 16}}),
  'qty=type=int': q(),
  'mod(qty,4,0)': q({qty: {$mod: [4, 0]}}),
  'qty=mod=(4,0)': q({qty: {$mod: [4, 0]}}),
  'qty=mod=foo': q(),
  'mod(qty,a,b)': q(),
  'mod((q,t,y),1,2)': q({'q.t.y': {$mod: [1, 2]}}),
  'where(this.credits%20%3D%3D%20this.debits)': q(),
  'eq(a)': q(),
  'eq(a,1,2,3)': q({a: 1}),
  'eq((a,b,c),1)': q({'a.b.c': 1}),
  'regex(foo,simple)': q({foo: {$regex: 'simple'}}),
  'regex(foo,simple,im)': q({foo: {$regex: 'simple', $options: 'im'}}),
  'regex(foo,re:simple,i)': q({foo: {$regex: /simple/, $options: 'i'}}),
  'regex((a,b,c),simple)': q({'a.b.c': {$regex: 'simple'}}),
  'foo=regex=re:%2Facme.*corp%2Fi': q({foo: {$regex: /acme.*corp/i}}),
  'regex(foo)': q(),
  'size()': q(),
  'size(foo)': q(),
  'size(foo,bar)': q(),
  'size(foo,10)': q({foo: {$size: 10}}),
  'elemMatch()': q(),
  'elemMatch(foo)': q(),
  'elemMatch(foo,a>1,a<10)': q({foo: {$elemMatch: {a: {$gt: 1, $lt: 10}}}}),
  'elemMatch(foo,a=1,(b=0|b>10))': q({foo: {$elemMatch: {a: 1, $or: [{b: 0}, {b: {$gt: 10}}]}}}),
  'elemMatch((a,b,c),a=1,b=2)': q({'a.b.c': {$elemMatch: {a: 1, b: 2}}}),
  'elemMatch(foo,bar,baz)': q(),
  'select(a,b,c)&sort(+a,-b)&limit(5,15)&a=1&b>10&(c>10|d<10)': {
    fields: {a: true, b: true, c: true},
    sort: {a: 1, b: -1},
    limit: 5,
    skip: 15,
    selector: {a: 1, b: {$gt: 10}, $or: [{c: {$gt: 10}}, {d: {$lt: 10}}]}
  }
};

describe("mongoSerializer", function()
{
  it("should return an object with selector, fields, sort, limit and skip properties", function()
  {
    var mongoQuery = mongoSerializer.fromQuery(new Query());

    mongoQuery.should.have.property('selector').and.be.a('object');
    mongoQuery.should.have.property('fields').and.be.a('object');
    mongoQuery.should.have.property('sort').and.be.a('object');
    mongoQuery.should.have.property('limit').and.be.a('number');
    mongoQuery.should.have.property('skip').and.be.a('number');
  });

  Object.keys(tests).forEach(function(input)
  {
    var query = parse(input);
    var expectedObject = tests[input];

    it("should serialize from " + input, function()
    {
      mongoSerializer.fromQuery(query).should.be.eql(expectedObject);
    });
  });

  it("should allow $where if specified in options", function()
  {
    var query = parse('where(this.credits%20%3D%3D%20this.debits)');
    var expectedObject = q({$where: 'this.credits == this.debits'});
    var actualObject= mongoSerializer.fromQuery(query, {
      compactAnd: true,
      allowWhere: true
    });

    actualObject.should.be.eql(expectedObject);
  });

  it("should use hasOwnProperty() while looping over object properties", function()
  {
    Object.prototype.__TEST__ = '__TEST__';

    var query = parse('select(a,b,c)&a=1&b=in=(1,2,3)&(c=d|(c>0&c<10))');
    var expectedObject = q(
      'fields', {a: true, b: true, c: true},
      'selector', {
        a: 1,
        b: {$in: [1, 2, 3]},
        $or: [
          {c: 'd'},
          {$and: [
            {c: {$gt: 0}},
            {c: {$lt: 10}}
          ]}
        ]
      }
    );
    var actualObject = mongoSerializer.fromQuery(query);

    actualObject.should.be.eql(expectedObject);

    delete Object.prototype.__TEST__;
  });

  it("should ignore not allowed properties", function()
  {
    var query = parse('a=1&_a=1&b>10&_b>10&(c=1|_c=1|size(d,10)|size(_d,10))&regex(e,simple)&regex(_e,simple)&elemMatch(f,a=1)&elemMatch(_f,a=1)');
    var expectedObject = q({
      a: 1,
      b: {$gt: 10},
      $or: [{c: 1}, {d: {$size: 10}}],
      e: {$regex: 'simple'},
      f: {$elemMatch: {a: 1}}
    });
    var actualObject = mongoSerializer.fromQuery(query, {
      isPropertyAllowed: function(property)
      {
        return property[0] !== '_';
      }
    });

    actualObject.should.be.eql(expectedObject);
  });

  it('should ignore properties not on the whitelist', function()
  {
    var query = parse('a=1&_a=1&b>10&_b>10&(c=1|_c=1|size(d,10)|size(_d,10))&regex(e,simple)&regex(_e,simple)&elemMatch(f,a=1)&elemMatch(_f,a=1)');
    var expectedObject = q({
      a: 1,
      _a: 1,
      $or: [{c: 1}, {d: {$size: 10}}],
      e: {$regex: 'simple'},
      f: {$elemMatch: {a: 1}}
    });
    var actualObject = mongoSerializer.fromQuery(query, {
      whitelist: ['a', '_a', 'c', 'd', 'e', 'f']
    });

    actualObject.should.be.eql(expectedObject);
  });

  it('should ignore properties on the blacklist', function()
  {
    var query = parse('a=1&_a=1&b>10&_b>10&(c=1|_c=1|size(d,10)|size(_d,10))&regex(e,simple)&regex(_e,simple)&elemMatch(f,a=1)&elemMatch(_f,a=1)');
    var expectedObject = q({
      a: 1,
      _a: 1,
      $or: [{c: 1}, {d: {$size: 10}}],
      e: {$regex: 'simple'},
      f: {$elemMatch: {a: 1}}
    });
    var actualObject = mongoSerializer.fromQuery(query, {
      blacklist: ['b', '_b', '_c', '_d', '_e', '_f']
    });

    actualObject.should.be.eql(expectedObject);
  });
});
