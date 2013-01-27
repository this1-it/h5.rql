var Query = require('../lib/Query');

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
