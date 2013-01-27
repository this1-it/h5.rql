var rql = require('../lib');
var parse = rql.parse;
var Query = require('../lib/Query');

describe("parse", function()
{
  beforeEach(function()
  {
    rql.parser = null;
  });

  it("should use the Parser assigned to h5.rql.parser", function()
  {
    var calls = 0;

    rql.parser = new rql.Parser();
    rql.parser.parse = function()
    {
      ++calls;

      return rql.Parser.prototype.parse.apply(this, arguments);
    };

    parse('foo&bar');

    calls.should.be.eql(1);
  });

  it("should assign the Parser's result to Query's selector", function()
  {
    var selector = new rql.Term('or');

    rql.parser = new rql.Parser();
    rql.parser.parse = function() { return selector; };

    parse('a|b').selector.should.be.equal(selector);
  });

  it("should return an instance of Query", function()
  {
    var query = parse('foo');

    query.should.be.an.instanceOf(Query);
  });

  it("should set fields specified in the select() term to true", function()
  {
    parse('select(a,b,c)').fields.should.eql({
      a: true,
      b: true,
      c: true
    });
  });

  it("should set fields specified in the exclude() term to false", function()
  {
    parse('exclude(a,b,c)').fields.should.eql({
      a: false,
      b: false,
      c: false
    });
  });

  it("should replace select() and exclude() fields with the last select()", function()
  {
    parse('select(a,b,c)&exclude(d,e)&select(f,g)').fields.should.eql({
      f: true,
      g: true
    });
  });

  it("should replace exclude() and select() fields with the last exclude()", function()
  {
    parse('exclude(a,b,c)&select(d,e)&exclude(f,g)').fields.should.eql({
      f: false,
      g: false
    });
  });

  it("should replace previously set fields if multiple select() or exclude() terms are used", function()
  {
    parse('select(a,b,c)&exclude(d,e)&select(f,g)&exclude(h,i)').fields.should.eql({
      h: false,
      i: false
    });
  });

  it("should set sort fields specified in the sort() term", function()
  {
    parse('sort(a,+b,-c)').sort.should.eql({
      a: 1,
      b: 1,
      c: -1
    });
  });

  it("should use only the last sort() term", function()
  {
    parse('sort(a,+b,-c)&sort(-d,e,-f)').sort.should.eql({
      d: -1,
      e: 1,
      f: -1
    });
  });

  it("should set the limit specified in the limit(limit) term", function()
  {
    parse('limit(10)').limit.should.be.eql(10);
  });

  it("should set skip to 0 if it is not specified in the limit() term", function()
  {
    parse('limit(15)').skip.should.be.eql(0);
  });

  it("should set the limit and skip specified in the limit(limit,skip) term", function()
  {
    var query = parse('limit(10,100)');

    query.limit.should.be.eql(10);
    query.skip.should.be.eql(100);
  });

  it("should use only the last limit() term", function()
  {
    var query = parse('limit(10)&limit(20,20)&limit(30,30)');

    query.limit.should.be.eql(30);
    query.skip.should.be.eql(30);
  });

  it("should set the limit to -1 if the specified limit value is not a number", function()
  {
    parse('limit(a)').limit.should.be.eql(-1);
  });

  it("should set the limit to -1 if the specified limit value is a number less than 1", function()
  {
    parse('limit(0)').limit.should.be.eql(-1);
    parse('limit(-1)').limit.should.be.eql(-1);
    parse('limit(-15)').limit.should.be.eql(-1);
  });

  it("should set the skip to 0 if the specified skip value is not a number", function()
  {
    parse('limit(10,a)').skip.should.be.eql(0);
  });

  it("should set the skip to 0 if the specified skip value is a number less than 0", function()
  {
    parse('limit(10,-1)').skip.should.be.eql(0);
    parse('limit(10,-20)').skip.should.be.eql(0);
  });

  it("should join the field names specified as arrays in the select() term", function()
  {
    parse('select((a,b,c),(d,$,f))').fields.should.be.eql({
      'a.b.c': true,
      'd.$.f': true
    });
  });

  it("should join the field names specified as arrays in the sort() term", function()
  {
    parse('sort((a,b,c),(d,$,f))').sort.should.be.eql({
      'a.b.c': 1,
      'd.$.f': 1
    });
  });
});
