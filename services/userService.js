'use strict';

/**
 * userService
 * This class exports the contract methods between User Model and controllers
 */

/* Globals */
var datasource = require('./../datasource').getDataSource(),
  User = datasource.User;
var async = require('async');

var securityService = require('./securityService'),
  _ = require('lodash'),
  NotFoundError = require('../errors/NotFoundError');

/**
 * Create a user document in database
 *
 * @param  {Object}     user        user entity to create
 * @param  {Function}     callback         callback function
 */
exports.create = function(user, callback) {
  // use security service generateHash method to generate hash
  securityService.generateHash(user.password, function(err, hash) {
    if(err) {
      callback(err);
    } else {
      // save user
      _.extend(user,{passwordHash: hash});
      // delete password property
      delete user.password;
      User.create(user).success(function(createdUser) {
        callback(null, createdUser);
      }).error(callback);
    }
  });
};

/**
 * Fetch a user by given user ID
 *
 * @param  {UUID}       id          id of the user to fetch
 * @param  {Function}     callback         callback function
 */
var _get = exports.get = function(id, callback) {
  User.find(id).success(function(user) {
    callback(null, user);
  }).error(function(err) {
    callback(err);
  });
};

/**
 * Fetch a user by given email address
 *
 * @param  {String}     email       email address of user to fetch
 * @param  {Function}     callback         callback function
 */
exports.getByEmail = function(email, callback) {
  User.find({ where: {email: email} }).success(function(user) {
    callback(null, user);
  }).error(callback);
};

/**
 * Update a user
 *
 * @param  {int}       userId       id of the user to update
 * @param  {Object}     entity      user entity to persist
 * @param  {Function}     callback         callback function
 */
exports.update = function(userId, user, callback) {
  async.waterfall([
    function(cb) {
      _get(userId, cb);
    },
    function(existingUser, cb) {
      if(existingUser) {
        _.extend(existingUser, user);
        existingUser.save().success(function(updatedUser) {
          cb(null, updatedUser);
        }).error(cb);
      } else {
        cb(new NotFoundError('User not found'));
      }
    }
  ], callback);
};

/**
 * Delete a user
 *
 * @param  {UUID}       id          id of the giftCardOffer to fetch
 * @param  {Function}     callback         callback function
 */
exports.delete = function(id, callback) {
  async.waterfall([
    function(cb) {
      _get(id, cb);
    },
    function(existingUser, cb) {
      if(existingUser) {
        existingUser.destroy().success(function() {
          cb();
        }).error(cb);
      } else {
        cb(new NotFoundError('User not found'));
      }
    }
  ], callback);
};

/**
 * Find all users by filter criteria
 * @param  {Object}     criteria    filter criteria
 * @param  {Function}   callback    callback function
 */
exports.findByFilterCriteria = function(criteria, callback) {
  User.findAll({where: criteria}).success(function(users) {
    callback(null, users);
  }).error(callback);
};