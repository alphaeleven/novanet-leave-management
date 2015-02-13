/* jshint unused:false */
'use strict';

/**
 * Global application level error handler middleware
 */


/**
 * Insantiating different instance of winston. It removes the dependency with application logger file.
 */
var winston = require('winston');
var HTTP_INTERNAL_SERVER_ERROR = 500;
var MESSAGE = 'Internal Server Error';

/**
 * Express standard error middleware
 *
 * @param  {Error}      err     error object
 * @param  {Object}     req     express request object
 * @param  {Object}     res     express response object
 * @param  {Function}   next    express next function
 */
var middleware = function(err, req, res, next) {
  // log the stack trace
  winston.error(err.stack);
  res.status(err.code || HTTP_INTERNAL_SERVER_ERROR).json({error: err.message || MESSAGE});
};

/**
 * Module exports
 */
module.exports = function() {
  return middleware;
};