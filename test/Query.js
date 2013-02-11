/*global describe:false,it:false*/

'use strict';

require('should');

var Query = require((process.env.LIB_FOR_TESTS_DIR || '../lib') + '/Query');

describe('Query', function()
{
  describe('toString', function()
  {
    it('should return a string', function()
    {
      new Query().toString().should.be.a('string');
    });
  });
});
