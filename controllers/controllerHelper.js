'use strict';

/**
 * Helper utility class for all the controllers
 * This class exports some common validation functions as well as filtering functions
 */

/* Globals */
var _ = require('lodash');
var ValidationError = require('../errors/ValidationError');
var tester = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;

/**
 * Export HTTP STATUS CODES
 */
exports.HTTP_OK = 200;
exports.HTTP_CREATED = 201;
exports.HTTP_INTERNAL_SERVER_ERROR = 500;
exports.HTTP_BAD_REQUEST = 400;
exports.HTTP_UNAUTHORIZED = 401;
exports.HTTP_FORBIDDEN = 403;
exports.HTTP_NOT_FOUND = 404;
exports.HTTP_NO_CONTENT = 204;

/**
 * Validate that given value is a valid String
 *
 * @param  {String}           val      String to validate
 * @param  {String}           name     name of the string property
 * @return {Error/Undefined}           Error if val is not a valid String otherwise undefined
 */
exports.checkString = function(val, name) {
  if(!_.isString(val)) {
    return new ValidationError(name + ' should be a valid string');
  }
};

/**
 * Validate that given value is a valid Date
 *
 * @param  {Date/String}           val      Date to validate
 * @param  {String}                name     name of the Date property
 * @return {Error/Undefined}                Error if val is not a valid String otherwise undefined
 */
exports.checkDate = function(val, name) {
  // string representation of date
  if(_.isString(val)) {
    var date = new Date(val);
    if(!_.isDate(date)) {
      return new ValidationError(name + ' should be a valid String representation of Date');
    }
  } else {
    if(!_.isDate(val)) {
      return new ValidationError(name + ' should be a valid Date');
    }
  }
};

/**
 * Validate that given value is a valid positive number
 *
 * @param  {Number}                val      Number to validate
 * @param  {String}                name     name of the Date property
 * @return {Error/Undefined}                Error if val is not a valid String otherwise undefined
 */
exports.checkPositiveNumber = function(val, name) {
  val = parseInt(val);
  if(!_.isNumber(val) || isNaN(val)) {
    return new ValidationError(name + ' should be a valid number');
  } else if(val < 0) {
    return new ValidationError(name + ' should be a valid positive number');
  }
};

/**
 * Validate that given obj is defined
 *
 * @param  {Object}                val      Object to validate
 * @param  {String}                name     name of the Date property
 * @return {Error/Undefined}                Error if val is not a valid String otherwise undefined
 */
exports.checkDefined = function(obj, name) {
  if(_.isUndefined(obj)) {
    return new ValidationError(name + ' should be defined');
  }
};

/**
 * Helper method for filterObject
 *
 * @param  {Object}   obj           Object to filter
 * @param  {Array}    exclusions    obj properties to exclude
 * @return {Object}                 filtered object
 */
var doFilter = function(obj, exclusions) {
  var result;
  if(obj.toObject) {
    result = obj.toObject();
  } else {
    result = obj;
  }
  if(exclusions) {
    _.omit(result, exclusions);
  }
  return result;
};

/**
 * Filter the object based on the exclusions array
 *
 * @param  {Object}   obj           Object to filter
 * @param  {Array}    exclusions    obj properties to exclude
 * @return {Object}                 filtered object
 */
exports.filterObject = function(obj, exclusions) {
  var transformed = [];
  if(_.isArray(obj)) {
    _.forEach(obj, function(object) {
      transformed.push(doFilter(object, exclusions));
    });
    return transformed;
  } else {
    return doFilter(obj, exclusions);
  }
};

/**
 * Helper method for filterUsers
 *
 * @param  {Object}   user          user object to filter
 * @return {Object}                 filtered object
 */
var doFilterUser = function(user) {
  var transformed = {}, plainObject;
  if(user.toObject) {
    plainObject = user.toObject();
  } else {
    plainObject = user;
  }
  if(plainObject._id) {
    transformed.id = plainObject._id;
  }
  if(plainObject.isFirstNamePublic) {
    transformed.firstName = plainObject.firstName;
  }
  if(plainObject.isLastNamePublic) {
    transformed.lastName = plainObject.lastName;
  }
  if(plainObject.isEmailPublic) {
    transformed.email = plainObject.email;
  }
  transformed.role = plainObject.role;
  transformed.id = plainObject.id;
  transformed.reportingManager = plainObject.reportingManager;
  return transformed;
};

/**
 * Filter the user object based on the REST API SPECIFICATION
 * Only those properties that have isxxxPublic will be returned to client
 *
 * @param  {Object}   user    user to filter
 * @return {Object}           filtered user
 */
exports.filterUsers = function(user) {
  var transformed = [];
  if(_.isArray(user)) {
    _.forEach(user, function(obj) {
      transformed.push(doFilterUser(obj));
    });
    return transformed;
  } else {
    return doFilterUser(user);
  }
};

/**
 * Validate the given is a valid email address
 * @param {String}    email         email to validate
 * @param {String}    name          name of the email property field
 */
exports.checkEmail = function(email, name) {
  if(!_.isString(email)) {
    return new ValidationError(name + ' is invalid');
  }
  if(email.length>254) {
    return new ValidationError(name + ' cannot be greater than 254 characters');
  } else if(!tester.test(email)) {
    return new ValidationError(name + ' is invalid');
  }
};