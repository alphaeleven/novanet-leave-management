'use strict';

/**
 * Logger module for application.
 * This module abstracts the winston so that each of the controller or services don't have to use "require('winston')" in each file
 * This enables central logging configuration
 */

var logger = {};

/**
 * Return the winston instance. If winston is not yet instantiated will create an instance and return that instance
 * @return {Object}         winston logger instance
 */
logger.getLogger = function() {
  if(!this.winston) {
    this.winston = require('winston');
  }
  return this.winston;
};

module.exports = logger;