/*jshint maxlen:999,maxstatements:999*/
/*global describe:false,it:false*/

'use strict';

require('should');

var LIB_DIR = process.env.LIB_FOR_TESTS_DIR || '../lib';
var Parser = require(LIB_DIR + '/Parser');
var valueConverters = require(LIB_DIR + '/valueConverters');

var allTests = {
  "arrays": [
    {"a": {name: "and", args: ["a"]}},
    {"(a)": {name: "and", args: [["a"]]}},
    {"a,b,c": {name: "and", args: ["a", "b", "c"]}},
    {"(a,b,c)": {name: "and", args: [["a", "b", "c"]]}},
    {"a(b)": {name: "and", "args": [{"name": "a", "args": ["b"]}]}},
    {"a(b,c)": {name: "and", args: [{name: "a", args: ["b", "c"]}]}},
    {"a((b),c)": {"name": "and", args: [{name: "a", args: [["b"], "c"]}]}},
    {"a((b,c),d)": {name: "and", args: [{name: "a", args: [["b", "c"], "d"]}]}},
    {"a(b/c,d)": {name: "and", args: [{name: "a", args: [["b", "c"], "d"]}]}},
    {"a(b)&c(d(e))": {name: "and", args: [
      {name: "a", args: ["b"]},
      {name: "c", args: [{name: "d", args: ["e"]}]}
    ]}}
  ],
  "dot comparison": [
    {"foo.bar=3": {name: "and", args: [{name: "eq", args: ["foo.bar", 3]}]}},
    {"select(sub.name)": {name: "and", args: [{name: "select", args: ["sub.name"]}]}}
  ],
  "equality": [
    {"eq(a,b)": {name: "and", args: [{name: "eq", args: ["a", "b"]}]}},
    {"a=eq=b": "eq(a,b)"},
    {"a=b": "eq(a,b)"},
    {"a==b": "eq(a,b)"}
  ],
  "inequality": [
    {"ne(a,b)": {name: "and", args: [{name: "ne", args: ["a", "b"]}]}},
    {"a=ne=b": "ne(a,b)"},
    {"a!=b": "ne(a,b)"}
  ],
  "less than": [
    {"lt(a,b)": {name: "and", args: [{name: "lt", args: ["a", "b"]}]}},
    {"a=lt=b": "lt(a,b)"},
    {"a<b": "lt(a,b)"}
  ],
  "less than equals": [
    {"le(a,b)": {name: "and", args: [{name: "le", args: ["a", "b"]}]}},
    {"a=le=b": "le(a,b)"},
    {"a<=b": "le(a,b)"}
  ],
  "greater than": [
    {"gt(a,b)": {name: "and", args: [{name: "gt", args: ["a", "b"]}]}},
    {"a=gt=b": "gt(a,b)"},
    {"a>b": "gt(a,b)"}
  ],
  "greater than equals": [
    {"ge(a,b)": {name: "and", args: [{name: "ge", args: ["a", "b"]}]}},
    {"a=ge=b": "ge(a,b)"},
    {"a>=b": "ge(a,b)"}
  ],
  "nested comparisons": [
    {"a(b(le(c,d)))": {name: "and", args: [{name: "a", args: [{name: "b", args: [{name: "le", args: ["c", "d"]}]}]}]}},
    {"a(b(c=le=d))": "a(b(le(c,d)))"},
    {"a(b(c<=d))": "a(b(le(c,d)))"}
  ],
  "arbitrary FIQL desugaring": [
    {"a=b=c": {name: "and", args: [{name: "b", args: ["a", "c"]}]}},
    {"a(b=cd=e)": {name: "and", args: [{name: "a", args: [{name: "cd", args: ["b", "e"]}]}]}}
  ],
  "and grouping": [
    {"a&b&c": {name: "and", args: ["a", "b", "c"]}},
    {"a(b)&c": {name: "and", args: [{name: "a", args: ["b"]}, "c"]}},
    {"a&(b&c)": {"name": "and", "args": ["a",{"name": "and", "args": ["b", "c"]}]}}
  ],
  "or grouping": [
    {"(a|b|c)": {name: "and", args: [{name: "or", args: ["a", "b", "c"]}]}},
    {"(a(b)|c)": {name: "and", args: [{name: "or", args: [{name: "a", args: ["b"]}, "c"]}]}}
  ],
  "complex grouping": [
    {"a&(b|c)": {name: "and", args: ["a", {name: "or", args: ["b", "c"]}]}},
    {"a|(b&c)": {name: "or", args: ["a", {name: "and", args: ["b", "c"]}]}},
    {"a(b(c<d,e(f=g)))": {name: "and", args: [
      {name: "a", args: [
        {name: "b", args: [
          {name: "lt", args: ["c", "d"]},
          {name: "e", args: [
            {name: "eq", args: ["f", "g"]}
          ]}
        ]}
      ]}
    ]}}
  ],
  "auto converter": [
    {"a(a%20string)": {name: "and", args: [{name: "a", args: ["a string"]}]}},
    {"a(123)": {name: "and", args: [{name: "a", args: [123]}]}},
    {"a(123.456)": {name: "and", args: [{name: "a", args: [123.456]}]}},
    {"a(%27abc%27)": {name: "and", args: [{name: "a", args: ["abc"]}]}}
  ],
  "string coercion": [
    {"a(string)": {name: "and", args: [{name: "a", args: ["string"]}]}},
    {"a(string:b)": {name: "and", args: [{name: "a", args: ["b"]}]}},
    {"a(string:1)": {name: "and", args: [{name: "a", args: ["1"]}]}}
  ],
  "number coercion": [
    {"a(number)": {name: "and", args: [{name: "a", args: ["number"]}]}},
    {"a(number:1)": {name: "and", args: [{name: "a", args: [1]}]}},
    {"a(number:foo)": Error}
  ],
  "boolean coercion": [
    {"a(true)": {name: "and", args: [{name: "a", args: [true]}]}},
    {"a(false)": {name: "and", args: [{name: "a", args: [false]}]}},
    {"a(boolean:true)": {name: "and", args: [{name: "a", args: [true]}]}}
  ],
  "null coercion": [
    {"a(null)": {name: "and", args: [{name: "a", args: [null]}]}},
    {"a(auto:null)": {name: "and", args: [{name: "a", args: [null]}]}},
    {"a(string:null)": {name: "and", args: [{name: "a", args: ["null"]}]}}
  ],
  "epoch coercion": [
    {"a(epoch)": {name: "and", args: [{name: "a", args: ["epoch"]}]}},
    {"a(epoch:0)": {name: "and", args: [{name: "a", args: [new Date(0)]}]}},
    {"a(epoch:1355674543236)": {name: "and", args: [{name: "a", args: [new Date(1355674543236)]}]}},
    {"a(epoch:foo)": Error}
  ],
  "isodate coercion": [
    {"a(isodate)": {name: "and", args: [{name: "a", args: ["isodate"]}]}},
    {"a(isodate:2012)": {name: "and", args: [{name: "a", args: [new Date(Date.UTC(2012, 0))]}]}},
    {"a(isodate:2012-05)": {name: "and", args: [{name: "a", args: [new Date(Date.UTC(2012, 4))]}]}},
    {"a(isodate:2012-08-13T13)": {name: "and", args: [{name: "a", args: [new Date(Date.UTC(2012, 7, 13, 13))]}]}},
    {"a(isodate:2012-12-18T10:26:59Z)": {name: "and", args: [{name: "a", args: [new Date(Date.UTC(2012, 11, 18, 10, 26, 59))]}]}},
    {"a(isodate:2012-12-18T10%3A26%3A59Z)": "a(isodate:2012-12-18T10:26:59Z)"},
    {"a(isodate:INVALID_ISODATE)": Error}
  ],
  "date coercion": [
    {"a(date)": {name: "and", args: [{name: "a", args: ["date"]}]}},
    {"a(date:2012-12-18T10:26:59Z)": {name: "and", args: [{name: "a", args: [new Date(Date.UTC(2012, 11, 18, 10, 26, 59))]}]}},
    {"a(date:2012-12)": {name: "and", args: [{name: "a", args: [new Date("2012-12")]}]}},
    {"a(date:2012-12-18%2002:50)": {name: "and", args: [{name: "a", args: [new Date("2012-12-18 02:50")]}]}},
    {"a(date:INVALID_DATE)": Error},
    {"a(data:2012-12-18%2010)": Error}
  ],
  "re coercion": [
    {"a(re)": {name: "and", args: [{name: "a", args: ["re"]}]}},
    {"a(re:simple)": {name: "and", args: [{name: "a", args: [new RegExp('simple')]}]}},
    {"a(re:%2Fsimple%2F)": {name: "and", args: [{name: "a", args: [new RegExp('simple')]}]}},
    {"a(re:%2Fsimple%2Fim)": {name: "and", args: [{name: "a", args: [new RegExp('simple', 'im')]}]}},
    {"a(re:%5E%28Foo%28%3F%3ABar%29%29Baz-%5B0-9%5D%7B2%2C%7D%24)": {name: "and", args: [{name: "a", args: [new RegExp('^(Foo(?:Bar))Baz-[0-9]{2,}$')]}]}},
    {"a(re:%2F%5E%28Foo%28%3F%3ABar%29%29Baz-%5B0-9%5D%7B2%2C%7D%24%2Fi)": {name: "and", args: [{name: "a", args: [new RegExp('^(Foo(?:Bar))Baz-[0-9]{2,}$', 'i')]}]}}
  ],
  "glob coercion": [
    {"a(glob)": {name: "and", args: [{name: "a", args: ["glob"]}]}},
    {"a(glob:simple)": {name: "and", args: [{name: "a", args: [new RegExp('^simple$', 'i')]}]}},
    {"a(glob:*simple)": {name: "and", args: [{name: "a", args: [new RegExp('simple$', 'i')]}]}},
    {"a(glob:simple*)": {name: "and", args: [{name: "a", args: [new RegExp('^simple', 'i')]}]}},
    {"a(glob:*simple*)": {name: "and", args: [{name: "a", args: [new RegExp('simple', 'i')]}]}},
    {"a(glob:wi*ld%3Fca*rd)": {name: "and", args: [{name: "a", args: [new RegExp('^wi.*ld.?ca.*rd$', 'i')]}]}},
    {"a(glob:*%28$var%20%5C*%2010%29+%5Bhello%5D)": {name: "and", args: [{name: "a", args: [/\(\$var \\.* 10\)\+\[hello\]$/i]}]}}
  ],
  "complex coercion": [
    {"(a=b|c=d)&(e=f|g=1)": {"name": "and", "args": [
      {"name": "or", "args": [
        {"name": "eq", "args": ["a", "b"]},
        {"name": "eq", "args": ["c", "d"]}
      ]},
      {"name": "or", "args": [
        {"name": "eq", "args": ["e", "f"]},
        {"name": "eq", "args": ["g", 1]}
      ]}
    ]}}
  ],
  "errors": [
    // Mixed conjunctions
    {"a=b|c=d&e=f": Error},
    // Invalid character (not URL-encoded)
    {"a=@": Error},
    // Empty value
    {"a=b,,c=d": Error}
  ]
};

if (typeof RegExp.prototype.toJSON !== 'function')
{
  RegExp.prototype.toJSON = function() { return this.toString(); };
}

describe("Parser", function()
{
  it("should use the specified instance of Parser.Options", function()
  {
    var options = new Parser.Options({allowEmptyValues: true});
    var parser = new Parser(options);

    parser.parse('a,,b').should.be.eql({
      name: 'and',
      args: ['a', options.emptyValue, 'b']
    });
  });

  it("should have proper default options", function()
  {
    var options = new Parser.Options();

    options.jsonQueryCompatible.should.be.eql(false);
    options.fiqlCompatible.should.be.eql(true);
    options.allowSlashedArrays.should.be.eql(false);
    options.allowEmptyValues.should.be.eql(false);
    options.defaultValueConverter.should.be.eql(valueConverters.default);
    options.specialTerms.should.be.eql([]);
    options.emptyValue.should.be.eql('');
  });

  it("should use the specified options", function()
  {
    var expectedOptions = {
      jsonQueryCompatible: true,
      fiqlCompatible: false,
      allowSlashedArrays: true,
      allowEmptyValues: true,
      defaultValueConverter: function(val) { return val; },
      specialTerms: ['a', 'b', 'c'],
      emptyValue: 'EMPTY_VALUE'
    };
    var actualOptions = new Parser.Options(expectedOptions);

    Object.keys(expectedOptions).forEach(function(option)
    {
      actualOptions[option].should.be.equal(expectedOptions[option]);
    });
  });

  describe("parse", function()
  {
    Object.keys(allTests).forEach(function(group)
    {
      var tests = allTests[group];

      describe(group, function()
      {
        tests.forEach(function(test)
        {
          var parser = new Parser({
            allowSlashedArrays: true,
            jsonQueryCompatible: true
          });

          var input = Object.keys(test)[0];
          var expected = test[input];

          if (typeof expected === 'string')
          {
            expected = parser.parse(expected);
          }

          it(input, function()
          {
            if (expected === Error)
            {
              parser.parse.bind(parser, input).should.throw(expected);
            }
            else
            {
              parser.parse(input).should.be.eql(expected);
            }
          });
        });
      });
    });

    it("should use empty string as a default empty value", function()
    {
      var parser = new Parser({
        allowEmptyValues: true
      });

      parser.parse("a,,b").should.be.eql({
        name: 'and',
        args: ['a', '', 'b']
      });
    });

    it("should use the specified empty value", function()
    {
      var emptyValue = 'EMPTY_VALUE';

      var parser = new Parser({
        allowEmptyValues: true,
        emptyValue: emptyValue
      });

      parser.parse("a,,b").should.be.eql({
        name: 'and',
        args: ['a', emptyValue, 'b']
      });
    });

    it("should remove the top and() term if its only argument is an and() term", function()
    {
      var parser = new Parser();

      parser.parse("and(a,b,c)").should.be.eql({
        name: 'and',
        args: ['a', 'b', 'c']
      });
    });
  });
});
