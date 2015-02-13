'use strict';

/**
 * Not Found error.
 * The Default HTTP STATUS CODE for NotFoundError is 404 (HTTP NOT FOUND)
 *
 * @author      spanhawk
 * @version     0.0.1
 */

/* Globals */
var HTTP_NOT_FOUND = 404;
var NAME = 'NotFoundError';

/**
 * Constructor
 *
 * @param {String}      message       The error message
 */
function NotFoundError(message) {
  // capture stack trace
  Error.call(this);
  Error.captureStackTrace(this);
  this.name = NAME;
  this.message = message;
  this.code = HTTP_NOT_FOUND;
}

require('util').inherits(NotFoundError, Error);
NotFoundError.prototype.name = 'NotFoundError';

/**
 * Module exports
 */
module.exports = NotFoundError;