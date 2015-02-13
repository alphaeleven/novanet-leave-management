'use strict';

/* Globals */
var datasource = require('./../datasource').getDataSource(),
  Leave = datasource.Leave;
var async = require('async');
var NotFoundError = require('../errors/NotFoundError');
var _ = require('lodash');

/**
 * Fetch a leave by given leave ID
 *
 * @param  {int}        id          id of the leave to fetch
 * @param  {Function}   callback    callback function<error, result>
 */
var _get = exports.get = function(id, callback) {
  Leave.find(id).success(function(leave) {
    callback(null, leave);
  }).error(function(err) {
    callback(err);
  });
};

/**
 * Update a leave
 *
 * @param  {id}         leaveId       id of the leave to update
 * @param  {Object}     entity        leave entity to persist
 * @param  {Function}   callback      callback function<error, result>
 */
exports.update = function(leaveId, leave, callback) {
  async.waterfall([
    function(cb) {
      _get(leaveId, cb);
    },
    function(existingLeave, cb) {
      if(existingLeave) {
        _.extend(existingLeave, leave);
        existingLeave.save().success(function(updatedLeave) {
          cb(null, updatedLeave);
        }).error(cb);
      } else {
        cb(new NotFoundError('Leave not found'));
      }
    }
  ], callback);
};

/**
 * Delete a leave
 *
 * @param  {int}        id          id of the leave to delete
 * @param  {Function}   callback    callback function<error, result>
 */
exports.delete = function(id, callback) {
  async.waterfall([
    function(cb) {
      _get(id, cb);
    },
    function(existingLeave, cb) {
      if(existingLeave) {
        existingLeave.destroy().success(function() {
          cb();
        }).error(cb);
      } else {
        cb(new NotFoundError('leave not found'));
      }
    }
  ], callback);
};

exports.findByFilterCriteria = function(criteria, callback) {
  Leave.findAll({where: criteria}).success(function(leaves) {
    callback(null, leaves);
  }).error(callback);
};

exports.create = function(entity, callback) {
  Leave.create(entity).success(function(leave) {
    callback(null, leave);
  }).error(callback);
};