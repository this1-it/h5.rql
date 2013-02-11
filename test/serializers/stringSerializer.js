/*jshint maxlen:999*/
/*global describe:false,it:false*/

'use strict';

require('should');

var LIB_DIR = process.env.LIB_FOR_TESTS_DIR || '../lib';
var stringSerializer = require(LIB_DIR + '/serializers/stringSerializer');
var valueConverters = require(LIB_DIR + '/valueConverters');
var parse = require(LIB_DIR).parse;
var Query = require(LIB_DIR + '/Query');

function getTime(dateString)
{
  return new Date(dateString).getTime();
}

var tests = {
  'a': 1,
  'a()': 1,
  'a(1)': 1,
  'a(1,2,3)': 1,
  'a(one,2,three)': 1,
  'a&b&c': 1,
  'a,b,c': 'a&b&c',
  'a&b()&1.2': 1,
  'a(b)': 1,
  'a(b(c(d)))': 1,
  'a(1,b(c,d(),e),3)': 1,
  'a(1,b(c,d(),e),3)&f(g)&h': 1,
  'a|b|c': 'or(a,b,c)',
  'a&(c|d)&e': 1,
  'a|(b|(c&d)|e)|f': 'or(a,(b|(c&d)|e),f)',
  'a&(b&(c|d)&e)&f': 1,
  'a=1': 1,
  'a==1': 'a=1',
  'a=eq=1': 'a=1',
  'a!=1': 1,
  'a=ne=1': 'a!=1',
  'a<=1': 1,
  'a=le=1': 'a<=1',
  'a>=1': 1,
  'a=ge=1': 'a>=1',
  'a<1': 1,
  'a=lt=1': 'a<1',
  'a>1': 1,
  'a=gt=1': 'a>1',
  'a=op=1': 'op(a,1)',
  '(1,2,3)': 1,
  '(1,(2,3,(4),5),6)': 1,
  '(1,2)&(3,4)': 1,
  '(1,a(),b(1,2,(3,4)))': 1,
  '()': 1,
  'a((1,2),b(),c(3,((),4),5))': 1,
  'foo=null': 1,
  'foo=undefined': 1,
  'foo=123456': 1,
  'foo=123.45': 1,
  'foo=true': 1,
  'foo=false': 1,
  'foo=string:false': 1,
  'foo=(1,2,3)': 1,
  'foo=in=(1,2,3)': 1,
  '(a,b,c)=in=(1,2,3)': 1,
  'foo=nin=(1,2,3)': 1,
  '(a,b,c)=nin=(1,2,3)': 1,
  'a=hello%20world': 1,
  'a=Hell%28%29': 1,
  'a(string)': 1,
  'a(string:)': 1,
  'a(string:123)': 1,
  'a(string:null)': 1,
  'a(boolean:1)': 'a(true)',
  'a(boolean:)': 'a(false)',
  'a(number:123)': 'a(123)',
  'a(number:0xFF)': 'a(255)',
  'a(number:123.456)': 'a(123.456)',
  'a(epoch:12385674)': 1,
  'a(isodate:2012)': 'a(epoch:1325376000000)',
  'a(isodate:2012-12-22)': 'a(epoch:1356134400000)',
  'a(isodate:2012-12-22T18%3A48%3A00Z)': 'a(epoch:1356202080000)',
  'a(date:2012)': 'a(epoch:' + getTime('2012') + ')',
  'a(date:2012-12-22)': 'a(epoch:' + getTime('2012-12-22') + ')',
  'a(date:2012-12-22T18%3A48%3A00Z)': 'a(epoch:1356202080000)',
  'a(date:Dec%2025%2C%201995)': 'a(epoch:' + getTime('Dec 25 1995') + ')',
  'a(date:Mon%2C%2025%20Dec%201995%2013%3A30%3A00%20GMT%2B0430)': 'a(epoch:' + getTime('Mon, 25 Dec 1995 13:30:00 GMT+0430') + ')',
  'a(re:simple)': 1,
  'a(re:%5Efoo%2Bba%28r%7Cz%29%24)': 1,
  'a(re:%2Fsimple%2F)': 'a(re:simple)',
  'a(re:%2Ffoo%2Fi)': 1,
  'a(glob:simple)': 'a(re:%2F%5Esimple%24%2Fi)',
  'a(glob:*foo%3Fbar*)': 'a(re:%2Ffoo.%3Fbar%2Fi)',
  'foo(a=1,(b=2|b>10),c=in=(1,2))&bar&baz(a(b,123,d()))': 1,
  'select(a,b,c)': 1,
  'exclude(a,b,c)': 1,
  'sort(a,b,c)': 1,
  'sort(a,+b,-c)': 'sort(a,b,-c)',
  'limit(10)': 1,
  'limit(10,20)': 1,
  'select(a,b,c)&sort(+a,-c)&limit(5,35)': 'select(a,b,c)&sort(a,-c)&limit(5,35)',
  'sort(a)&limit(10)&exclude(x,y)': 'exclude(x,y)&sort(a)&limit(10)',
  'a=b&c=in=(1,2,3)&select(a,b,c)&limit(10)&b!=null': 'select(a,b,c)&limit(10)&a=b&c=in=(1,2,3)&b!=null',
  'select(a,b)&select(c,d)': 'select(c,d)',
  'sort(+a,-b)&sort(-a,+b)': 'sort(-a,b)',
  'limit(5)&limit(10,20)': 'limit(10,20)',
  'limit(10,20)&exclude(a,b)&limit(5)&sort(a,b)&select(c,d)': 'select(c,d)&sort(a,b)&limit(5)',
  'select(a,b)&a(select(c,d))': 'select(c,d)&a(select(c,d))',
  'a(sort(a,b))&sort(c,d)&b(sort(-e,-f))': 'sort(-e,-f)&a(sort(a,b))&b(sort(-e,-f))'
};

describe("stringSerializer", function()
{
  it("should return a string", function()
  {
    stringSerializer.fromQuery(new Query()).should.be.a('string');
  });

  Object.keys(tests).forEach(function(input)
  {
    var query = parse(input);
    var expectedString = tests[input];

    if (expectedString === 1)
    {
      expectedString = input;
    }

    it("should serialize to " + expectedString, function()
    {
      stringSerializer.fromQuery(query).should.be.equal(expectedString);
    });
  });

  it("should serialize the custom value converter object", function()
  {
    function Foo(value)
    {
      this.value = value;
    }

    Foo.prototype.toString = function()
    {
      return this.value.toUpperCase();
    };

    valueConverters.foo = function(value)
    {
      return new Foo(value);
    };

    var query = parse('a(foo:bar)');

    stringSerializer.fromQuery(query).should.be.equal('a(BAR)');

    delete valueConverters.foo;
  });

  it("should use the convertToRqlValue() method if available", function()
  {
    function Foo(value)
    {
      this.value = value;
    }

    Foo.prototype.convertToRqlValue = function(encodeString)
    {
      return 'foo:' + encodeString(this.value);
    };

    valueConverters.foo = function(value)
    {
      return new Foo(value);
    };

    var query = parse('a(foo:bar)');

    stringSerializer.fromQuery(query).should.be.equal('a(foo:bar)');

    delete valueConverters.foo;
  });
});
