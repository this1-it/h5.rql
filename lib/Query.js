'use strict';

var Term = require('./Term');
var stringSerializer = require('./serializers/stringSerializer');

module.exports = Query;

/**
 * @name h5.rql.Query
 * @constructor
 */
function Query()
{
  /**
   * @type {h5.rql.Term}
   */
  this.selector = new Term('and');

  /**
   * @type {object.<string, boolean>}
   */
  this.fields = {};

  /**
   * @type {number}
   */
  this.skip = 0;

  /**
   * @type {number}
   */
  this.limit = -1;

  /**
   * @type {object.<string, number>}
   */
  this.sort = {};
}

/**
 * @return {string}
 */
Query.prototype.toString = function()
{
  return stringSerializer.fromQuery(this);
};
