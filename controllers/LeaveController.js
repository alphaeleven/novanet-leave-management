'use strict';

/**
 * LeaveController
 * This controller exposes REST actions for leaves
 */

/* Globals */
var config, options,
  ValidationError = require('../errors/ValidationError'),
  async = require('async'),
  _ = require('lodash'),
  controllerHelper = require('./controllerHelper'),
  NotFoundError = require('../errors/NotFoundError'),
  userService = require('../services/userService'),
  moment = require('moment'),
  leaveService = require('../services/leaveService');

var statuses = {
  NEW: 'NEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
};
var logger = require('../logger').getLogger();
var day = {
  SATURDAY: 6,
  SUNDAY: 7
};

var monthNames = [ 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December' ];

var nationalHolidays = {
  2015: {
    January: [
      26
    ],
    February: [
      3, 5, 7, 8, 9, 21, 23
    ],
    March: [
      4, 6, 8
    ],
    April: [
      1, 2, 6
    ],
    May: [
      1, 5, 6
    ],
    June: [
      13, 18, 21
    ],
    July: [
      8, 14
    ],
    August: [
      15, 26
    ],
    September: [
      29, 21, 17
    ],
    October: [
      5, 6, 8
    ],
    November: [
      10, 14, 17, 21
    ],
    December: [
      1, 10
    ]
  }
};

/**
 * Controller init method.
 * This method performs some controller level initialization tasks
 * This method will be called once while app start
 *
 * @param  {Object}     options         Controller options as defined in configuration
 * @param  {Object}     config          Global application configuration object
 */
exports.init = function(controllerOptions, globalConfig) {
  config = globalConfig;
  options = controllerOptions;
};

/**
 * Create a leave resource
 *
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.create = function(req, res, next) {
  // this logic is necessary, an employee leave can also be requested by his/her colleague
  var currentUser = req.user;
  var userId = req.params.userId,
    entity = req.body;
  
  async.waterfall([
    // get user by id
    function(cb) {
      userService.get(userId, cb);
    },
    function(user, cb) {
      if(user) {
        var leave = {
          reason: entity.reason,
          startDate: entity.startDate,
          endDate: entity.endDate,
          requester: userId,
          resolver: user.reportingManager,
          status: statuses.NEW,
          createdBy: currentUser.id,
          updatedBy: currentUser.id
        };
        cb(null, leave);
      } else {
        cb(new NotFoundError('Employee not found for id ' + userId));
      }
    },
    function(leave, cb) {
      // create
      leaveService.create(leave, cb);
    }
  ], function(err, leave) {
    if(err) {
      return next(err);
    }
    req.data = {
      status: controllerHelper.HTTP_CREATED,
      content: leave
    };
    next();
  });
};

/**
 * Accept a leave request
 *
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.approve = function(req, res, next) {
  var leaveId = req.params.id, reason = req.body.reason;
  // reason is mandatory
  var error = controllerHelper.checkString(reason, 'reason');
  if(error) {
    return next(error);
  }
  async.waterfall([
    function(cb) {
      leaveService.get(leaveId, cb);
    },
    function(leave, cb) {
      if(!leave) {
        return cb(new NotFoundError('Leave not found'));
      }
      var startDate = moment(leave.startDate);
      var endDate = moment(leave.endDate);
      var days = endDate.diff(startDate, 'days');
      logger.info('Total No of Leave days ' + days);
      // compute no of days and it no of days is greater than 15 then don't approve the leave
      for(var date = startDate; date.isBefore(endDate); date.add(1, 'days')) {
        // check if the date is not of weekend
        if(date.isoWeekday() === day.SATURDAY || date.isoWeekday() === day.SUNDAY) {
          // this is a weekend day exclude it
          days = days - 1;
        } else {
          // check if the date is not national holiday
          var year = date.year();
          var month = monthNames[date.month()];
          var monthDate = date.date();
          var holidays = nationalHolidays[year][month];
          if(nationalHolidays[year] && nationalHolidays[year][month] && holidays.indexOf(monthDate) !== -1) {
            // this date is a national holiday exclude it
            days = days - 1;
          }
        }
      }
      logger.info('Total No of Leave days (excluding weekends and national holidays) ' + days);
      if(days > config.MAXIMUM_LEAVE_DURATION) {
        // don't allow holidays greater than 15 days
        cb(new ValidationError('Maximum leave duration is 15 days excluding national holidays and weekends'));
        if(error) {
          return next(error);
        }
      } else {
        // everything ok, approve leave
        cb(null, leave);
      }
    },
    function(leave, cb){
      logger.info('Approving leave');
      _.extend(leave, {status: statuses.APPROVED, reason: reason});
      leave.save().success(function(updatedLeave) {
        cb(null, updatedLeave);
      }).error(cb);
    }
  ], function(err, leave) {
    if(err) {
      return next(err);
    }
    req.data = {
      status: controllerHelper.HTTP_CREATED,
      content: leave
    };
    next();
  });
};

/**
 * Delete a leave request
 *
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.delete = function(req, res, next) {
  leaveService.delete(req.params.id, function(err) {
    if(err) {
      return next(err);
    }
    req.data = {
      status: controllerHelper.HTTP_NO_CONTENT
    };
    next();
  });
};

/**
 * Reject a leave request
 *
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.reject = function(req, res, next) {
  var leaveId = req.params.id, reason = req.body.reason;
  // reason is mandatory
  var error = controllerHelper.checkString(reason, 'reason');
  if(error) {
    return next(error);
  }
  async.waterfall([
    function(cb) {
      leaveService.get(leaveId, cb);
    },
    function(leave, cb){
      if(leave) {
        _.extend(leave, {status: statuses.REJECTED, reason: reason});
        leaveService.update(leaveId, leave, cb);
      } else {
        cb(new NotFoundError('Leave not found'));
      }
    }
  ], function(err, leave) {
    if(err) {
      return next(err);
    }
    req.data = {
      status: controllerHelper.HTTP_CREATED,
      content: leave
    };
    next();
  });
};

/**
 * Update a leave request
 *
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.update = function(req, res, next) {
  var leaveId = req.params.id;
  var entity = req.body;
  async.waterfall([
    function(cb) {
      leaveService.update(leaveId, entity, cb);
    }
  ], function(err, leave) {
    if(err) {
      return next(err);
    }
    req.data = {
      status: controllerHelper.HTTP_OK,
      content: leave
    };
    next();
  });
};

/**
 * Get all leaves of a user.
 * The result object will have two arrays requested leaves and leaves he has to approve of his/her junior employees
 *
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.searchLeaves = function(req, res, next) {
  var userId = req.params.id;
  var error = controllerHelper.checkPositiveNumber(userId, 'user Id');
  if(error) {
    return next(error);
  }
  async.waterfall([
    function(cb) {
      leaveService.findByFilterCriteria({requester: userId}, cb);
    },
    function(requested, cb) {
      leaveService.findByFilterCriteria({resolver: userId}, function(err, handler) {
        cb(err, requested, handler);
      });
    },
    function(requested, handler, cb) {
      var result = {
        requested: requested,
        handler: handler
      };
      cb(null, result);
    }
  ], function(err, result) {
    if(err) {
      return next(err);
    }
    req.data = {
      status: controllerHelper.HTTP_OK,
      content: result
    };
    next();
  });
};