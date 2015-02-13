'use strict';

/**
 * Internal Server error
 *
 * @author      spanhawk
 * @version     0.0.1
 */

var HTTP_INTERNAL_SERVER_ERROR = 500;
var NAME = 'InternalServerError';

/**
 * Constructor
 *
 * @param {String}      message       The error message
 */
function InternalServerError(message) {
  // capture stack trace
  Error.call(this);
  Error.captureStackTrace(this);
  this.name = NAME;
  this.message = message;
  this.code = HTTP_INTERNAL_SERVER_ERROR;
}

require('util').inherits(InternalServerError, Error);
InternalServerError.prototype.name = 'InternalServerError';

/**
 * Module exports
 */
module.exports = InternalServerError;