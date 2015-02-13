'use strict';

/**
 * Validation error.
 * The Default HTTP STATUS CODE for ValidationError is 400 (HTTP BAD REQUEST)
 *
 * @author      spanhawk
 * @version     0.0.1
 */

/* Globals */
var HTTP_BAD_REQUEST = 400;
var NAME = 'ValidationError';

/**
 * Constructor
 *
 * @param {String}      message       The validation error message
 */
function ValidationError(message) {
  // capture stack trace
  Error.call(this);
  Error.captureStackTrace(this);
  this.name = NAME;
  this.message = message;
  this.code = HTTP_BAD_REQUEST;
}
require('util').inherits(ValidationError, Error);
ValidationError.prototype.name = 'ValidationError';

/**
 * Module exports
 */
module.exports = ValidationError;