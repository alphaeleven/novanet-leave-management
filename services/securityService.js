/* jshint camelcase: false */
'use strict';

/**
 * This service exports application security functionality
 */

/* Globals */

var config = require('config');

var datasource = require('./../datasource').getDataSource(),
  SessionToken = datasource.SessionToken;

var userService = require('./userService'),
  async = require('async');

var bcrypt = require('bcrypt-nodejs'),
  jwt = require('jwt-simple'),
  config = require('config'),
  _ = require('lodash'),
  ForbiddenError = require('../errors/ForbiddenError'), expirationDate,
  NotFoundError = require('../errors/NotFoundError');

/**
 * Implements the basic email/password based authentication
 *
 * @param  {String}       email         email address of user
 * @param  {String}       password      password of user
 * @param  {Function}     callback      callback function
 */
exports.authenticate = function(email, password, callback) {
  async.waterfall([
    function(cb) {
      userService.getByEmail(email, cb);
    },
    function(user, cb) {
      if(user) {
        bcrypt.compare(password, user.passwordHash, function(err, result) {
          if(err) {
            cb(err);
          } else if(result) {
            cb(null, user);
          } else {
            cb(new ForbiddenError('user is not authenticated'));
          }
        });
      } else {
        cb(new NotFoundError('User not found'));
      }
    }
  ], callback);
};

/**
 * Authenticate the user based on the bearer session token
 *
 * @param  {String}       token             session access token
 * @param  {Function}     callback          callback function
 */
exports.authenticateWithSessionToken = function(token, callback) {
  async.waterfall([
    function(cb) {
      SessionToken.find({where: {token: token}}).success(function(sessionToken) {
        cb(null, sessionToken);
      }).error(cb);
    },
    function(sessionToken, cb) {
      if(!sessionToken) {
        return cb(new ForbiddenError('Session Token not found'));
      }
      var decoded = jwt.decode(sessionToken.token, config.JWT_SECRET);
      if(decoded.expiration > Date.now()) {
        // get user by id
        userService.get(sessionToken.userId, function(err, user) {
          expirationDate = decoded.expiration;
          cb(err, user);
        });
      } else {
        // token expired
        cb(new ForbiddenError('Session Token Expired'));
      }
    }
  ], function(err, user) {
    callback(err, user, expirationDate);
  });
};

/**
 * Generate the session token to be returned to client in case of login request
 *
 * @param  {String}       userId            userId of user to generate token for
 * @param  {Function}     callback          callback function
 */
exports.generateSessionToken = function(userId, callback) {
  var dateObj = new Date();
  var millis = dateObj.getTime() + config.SESSION_TOKEN_DURATION;
  var token = jwt.encode({
    expiration: millis
  }, config.JWT_SECRET);
  SessionToken.create({
    userId: userId,
    token: token,
    expirationDate: new Date(millis)
  }).success(function(created) {
    callback(null, created.token);
  }).error(callback);
};

/**
 * Determine whether a user is authorized to access a particular resource or not
 *
 * @param  {String}       userId            userId of user to generate token for
 * @param  {String}       action            action requested
 * @param  {Function}     callback          callback function
 */
exports.isAuthorized = function(userId, action, callback) {
  async.waterfall([
    function(cb) {
      userService.get(userId, cb);
    },
    function(user, cb) {
      // if user exists
      if(user) {
        var authorized = false;
        var actions = config['ACTIONS_' + user.role].split(',');
        if(_.indexOf(actions, action) !== -1) {
          authorized = true;
        }      
        cb(null, authorized);
      } else {
        cb(new NotFoundError('User not found'));
      }
    }
  ], callback);
};

/**
 * Update a forgotten user password
 *
 * @param  {String}       token            reset password token
 * @param  {String}       password         new password to set
 * @param  {Function}     callback         callback function
 */
exports.updateForgottenPassword = function(token, password, callback) {
  async.waterfall([
    function(cb) {
      // search user by resetPasswordToken and resetPasswordToken should not be expired
      userService.findByFilterCriteria({resetPasswordToken : token, resetPasswordExpired: false}, cb);
    },
    function(user, cb) {
      if(user) {
        // generate the salt
        bcrypt.genSalt(config.SALT_WORK_FACTOR, function(err, salt) {
          cb(err, user, salt);
        });
      } else {
        cb(new NotFoundError('User not found'));
      }
    },
    function(user, salt, cb) {
      // hash password
      bcrypt.hash(password, salt, null, function(err, hash) {
        cb(err, user, hash);
      });
    },
    function(user, hash, cb) {
      // update user
      _.extend(user, {passwordHash: hash, resetPasswordExpired: true, resetPasswordToken: undefined});
      user.save().success(function() {
        cb();
      }).error(cb);
    }
  ], callback);
};

/**
 * Get all the allowed actions for a user
 *
 * @param  {String}       userId           userId of user
 * @param  {Function}     callback         callback function
 */
exports.getAllowedActions = function(userId, callback) {
  async.waterfall([
    function(cb) {
      userService.get(userId, cb);
    },
    function(user, cb) {
      if(user) {
        var actions = config['ACTIONS_' + user.role].split(',');
        cb(null, actions);
      } else {
        // user not found
        cb(new NotFoundError('User not found'));
      }
    }
  ], callback);
};

/**
 * Revoke a session token
 *
 * @param  {String}       userId           userId of user
 * @param  {String}       token            session token to revoke
 * @param  {Function}     callback         callback function
 */
exports.revokeSessionToken = function(userId, token, callback) {
  SessionToken.find({where: {userId: userId, token: token}}).success(function(sessionToken) {
    if(!sessionToken) {
      return callback(new NotFoundError('Session Token not found'));
    } else {
      sessionToken.destroy().success(function() {
        callback();
      }).error(callback);
    }
  }).error(callback);
};

/**
 * Generate a hash of the given plainText string
 *
 * @param  {String}       plainText        plainText string
 * @param  {Function}     callback         callback function
 */
exports.generateHash = function(plainText, callback) {
  async.waterfall([
    function(cb) {
      bcrypt.genSalt(config.SALT_WORK_FACTOR, cb);
    },
    function(salt, cb) {
      bcrypt.hash(plainText, salt, null, cb);
    }
  ], callback);
};