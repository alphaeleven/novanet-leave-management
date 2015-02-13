'use strict';

/**
 * Unauthorized error
 *
 * @author      spanhawk
 * @version     0.0.1
 */

var HTTP_UNAUTHORIZED = 401;
var NAME = 'UnauthorizedError';

/**
 * Constructor
 
 * @param {String}      message       The authorization error message
 */
function UnauthorizedError(message) {
  // capture stack trace
  Error.call(this);
  Error.captureStackTrace(this);
  this.name = NAME;
  this.message = message;
  this.code = HTTP_UNAUTHORIZED;
}

require('util').inherits(UnauthorizedError, Error);
UnauthorizedError.prototype.name = 'UnauthorizedError';

/**
 * Module exports
 */
module.exports = UnauthorizedError;