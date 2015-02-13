'use strict';

/**
 * Application responser middleware.
 * This middleware sends data to client
 */

/**
 * Insantiating different instance of winston. It removes the dependency with application logger file.
 */
var winston = require('winston');

var middleware = function(req, res, next) {
  if(!req.data) {
    // if no data is available call next.
    return next();
  }
  winston.info('DATA sent to client ' + JSON.stringify(req.data) );
  if(req.data.content) {
    res.status(req.data.status).json(req.data.content);
  } else {
    res.status(req.data.status).send();
  }
};

module.exports = function() {
  return middleware;
};