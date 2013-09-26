/*jshint maxlen:999*/
/*global describe:false,it:false*/

'use strict';

require('should');

var Query = require((process.env.LIB_FOR_TESTS_DIR || '../lib') + '/Query');

describe("Query", function()
{
  describe("fromObject", function()
  {
    it("should return the specified object if it is an instance of Query", function()
    {
      var query = new Query();

      Query.fromObject(query).should.be.equal(query);
    });

    it("should return an empty Query if no object is specified", function()
    {
      Query.fromObject(null).should.be.eql(new Query());
    });

    it("should copy the specified properties", function()
    {
      var queryObj = {
        selector: {name: 'and', args: [{name: 'eq', args: ['a', '1']}]},
        fields: {a: true},
        sort: {a: -1},
        skip: 10,
        limit: 10
      };

      var expected = new Query();
      expected.selector = queryObj.selector;
      expected.fields = queryObj.fields;
      expected.sort = queryObj.sort;
      expected.skip = queryObj.limit;
      expected.limit = queryObj.limit;

      Query.fromObject(queryObj).should.be.eql(expected);
    });
  });

  describe("toString", function()
  {
    it("should return a string", function()
    {
      new Query().toString().should.be.a('string');
    });

    it("should pass the specified options to the serializer", function()
    {
      var queryObj = {
        selector: {
          name: 'and',
          args: [
            {name: 'eq', args: ['test', '(^.^)']}
          ]
        }
      };

      new Query.fromObject(queryObj).toString({doubleEncode: true}).should.be.eql('test=%2528%255E.%255E%2529');
    });
  });

  describe("isEmpty", function()
  {
    it("should return false if the skip property is not 0", function()
    {
      Query.fromObject({skip: 10}).isEmpty().should.be.equal(false);
    });

    it("should return false if the limit property is not -1", function()
    {
      Query.fromObject({limit: 10}).isEmpty().should.be.equal(false);
    });

    it("should return false if the fields object is not empty", function()
    {
      Query.fromObject({fields: {a: true}}).isEmpty().should.be.equal(false);
    });

    it("should return false if the sort object is not empty", function()
    {
      Query.fromObject({sort: {a: -1}}).isEmpty().should.be.equal(false);
    });

    it("should return false if the root selector Term has any args", function()
    {
      Query.fromObject(
        {selector: {name: 'and', args: [{name: 'eq', args: ['a', 1]}]}}
      ).isEmpty().should.be.equal(false);
    });

    it("should return true if the Query is empty", function()
    {
      new Query().isEmpty().should.be.equal(true);
    });
  });
});
