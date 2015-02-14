'use strict';

/**
 * Forbidden error
 *
 * @author      riteshsangwan
 * @version     0.0.1
 */

var HTTP_FORBIDDEN = 403;
var NAME = 'ForbiddenError';

/**
 * Constructor
 
 * @param {String}      message       The authentication error message
 */
function ForbiddenError(message) {
  // capture stack trace
  Error.call(this);
  Error.captureStackTrace(this);
  this.name = NAME;
  this.message = message;
  this.code = HTTP_FORBIDDEN;
}

require('util').inherits(ForbiddenError, Error);
ForbiddenError.prototype.name = 'ForbiddenError';

/**
 * Module exports
 */
module.exports = ForbiddenError;