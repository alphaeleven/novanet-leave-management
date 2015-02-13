'use strict';

/**
 * UserController
 * This controller exposes REST actions for user
 */

/* Globals */
var config, options,
  ValidationError = require('../errors/ValidationError'),
  UnauthorizedError = require('../errors/UnauthorizedError'),
  async = require('async'),
  _ = require('lodash'),
  controllerHelper = require('./controllerHelper'),
  userService = require('../services/userService'),
  crypto = require('crypto'),
  NotFoundError = require('../errors/NotFoundError'),
  securityService = require('../services/securityService');

var userRoles  = {
  MANAGER: 'MANAGER',
  INDIVIDUAL_USER: 'INDIVIDUAL_USER'
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
 * Route handler for POST /login
 * Login function.
 * 
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.login = function(req, res, next) {
  var auth = req.auth, error;
  if(!auth) {
    // if authorization header not present, respond with HTTP 401 status code
    error = new UnauthorizedError('User is not authorized');
    return next(error);
  }
  async.waterfall([
    function(callback) {
      securityService.authenticate(auth.credentials.username, auth.credentials.password, callback);
    },
    function(user, callback) {
      securityService.generateSessionToken(user.id, callback);
    }
  ], function(err, response) {
    if(err) {
      return next(err);
    }
    // wrap the response in req.data
    req.data = {
      status: controllerHelper.HTTP_OK,
      content: {
        sessionToken: response
      }
    };
    next();
  });
};

/**
 * Helper method to validate registration resource
 * @return {Error}    If validation failed otherwise undefined
 */
var validateRegistration = function(registration) {
  var error = controllerHelper.checkString(registration.firstName, 'First Name') || controllerHelper.checkString(registration.lastName, 'Last Name') ||
              controllerHelper.checkEmail(registration.email, 'Email') || controllerHelper.checkString(registration.password, 'Password');
  return error;
};

/**
 * Route handler for POST /register
 * Register function.
 * It creates the user resource
 * 
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.registerUser = function(req, res, next) {
  var registration = req.body;
  if(!userRoles[registration.role]) {
    return next(new ValidationError('User role must either be ' + userRoles.MANAGER + ' or ' + userRoles.INDIVIDUAL_USER));
  }
  var error = validateRegistration(registration);
  if(error) {
    return next(error);
  }
  async.waterfall([
    function(cb) {
      userService.getByEmail(registration.email, cb);
    },
    function(user, cb) {
      if(user) {
        cb(new ValidationError('This email address is already registered'));
      } else {
        _.extend(registration, {
          isFirstNamePublic: true,
          isLastNamePublic: true,
          isEmailPublic: true
        });
        userService.create(registration, cb);
      }
    }
  ], function(err, user) {
    if(err) {
      return next(err);
    }
    var transformed = controllerHelper.filterUsers(user);
    req.data = {
      status: controllerHelper.HTTP_OK,
      content: transformed
    };
    next();
  });
};

/**
 * Route handler for GET /users/me/actions
 * This function returns the allowed actions for the user
 * 
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.getAllowedActions = function(req, res, next) {
  // process request
  // The auth middleware will do the authentication and set the user
  async.waterfall([
    function(callback) {
      securityService.getAllowedActions(req.user.id, callback);
    }
  ], function(err, response) {
    if(err) {
      return next(err);
    }
    req.data = {
      status: controllerHelper.HTTP_OK,
      content: response
    };
    next();
  });
};

/**
 * Route handler for POST /forgotPassword
 * 
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.recoverPassword = function(req, res, next) {
  // generate a reset password token
  var email = req.query.email;
  async.waterfall([
    function(cb) {
      crypto.randomBytes(config.DEFAULT_TOKEN_SIZE, cb);
    },
    function(buffer, cb) {
      var token = buffer.toString('hex');
      userService.getByEmail(email, function(err, user) {
        cb(err, token, user);
      });
    },
    function(token, user, cb) {
      if(user) {
        var updatedUser = _.extend(user, {resetPasswordToken: token, resetPasswordExpired: false});
        updatedUser.save(cb);
      } else {
        cb(new NotFoundError('User not found'));
      }
    }
  ], function(err) {
    if(err) {
      return next(err);
    }
    req.data = {
      status: controllerHelper.HTTP_OK
    };
    next();
  });
};

/**
 * Route handler for POST /resetForgottenPassword
 * 
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.resetForgottenPassword = function(req, res, next) {
  var resetPasswordToken = req.query.token,
    newPassword = req.query.newPassword;

  securityService.updateForgottenPassword(resetPasswordToken, newPassword, function(err) {
    if(err) {
      return next(err);
    }
    req.data = {
      status: controllerHelper.HTTP_OK
    };
    next();
  });
};

/**
 * Route handler for GET /users/:id
 * 
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
var getUserProfile = function(req, res, next) {
  var id = req.params.id;
  userService.get(id, function(err, user) {
    if(err) {
      return next(err);
    } else if(!user) {
      // user doesn't exist return 404
      req.data = {
        status: controllerHelper.HTTP_NOT_FOUND
      };
      return next();
    }
    // if user exists
    var transformed = controllerHelper.filterUsers(user);
    req.data = {
      status: controllerHelper.HTTP_OK,
      content: transformed
    };
    next();
  });
};

/**
 * Route handler for GET /users/me
 * 
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
var getMyUserProfile = function(req, res, next) {
  var id = req.user.id;
  userService.get(id, function(err, user) {
    if(err) {
      return next(err);
    } else if(!user) {
      // user doesn't exist return 404
      req.data = {
        code: controllerHelper.HTTP_NOT_FOUND
      };
      return next();
    }
    // if user exists
    var transformed = controllerHelper.filterUsers(user);
    req.data = {
      status: controllerHelper.HTTP_OK,
      content: transformed
    };
    next();
  });
};

/**
 * Route handler for POST /revokeToken
 * 
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.revokeAccessToken = function(req, res, next) {
  // auth middleware perform the authentication
  securityService.revokeSessionToken(req.user.id, req.auth.token, function(err) {
    if(err) {
      return next(err);
    }
    req.data = {
      status: controllerHelper.HTTP_OK
    };
    next();
  });
};

/**
 * Route handler for PUT /users/me
 * 
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.updateCurrentUserProfile = function(req, res, next) {
  var user = req.body;
  userService.update(req.user.id, user, function(err, user) {
    if(err) {
      return next(err);
    }
    var transformed = controllerHelper.filterUsers(user);
    req.data = {
      status: controllerHelper.HTTP_OK,
      content: transformed
    };
    next();
  });
};

/**
 * Proxies the request to either getMyUserProfile or getUserProfile
 *
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.getProfile = function(req, res, next) {
  if(req.params.id === 'me') {
    getMyUserProfile(req, res, next);
  } else {
    getUserProfile(req, res, next);
  }
};

/**
 * Route handler for POST /refreshToken
 * This method invalidates the current sessionToken and generates a new one and return to client
 * 
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.refreshAccessToken = function(req, res, next) {
  async.waterfall([
    function(cb) {
      securityService.revokeSessionToken(req.user.id, req.auth.token, function(err) {
        cb(err);
      });
    },
    function(cb) {
      securityService.generateSessionToken(req.user.id, cb);
    }
  ], function(err, sessionToken) {
    if(err) {
      return next(err);
    }
    req.data = {
      status: controllerHelper.HTTP_OK,
      content: {
        sessionToken: sessionToken
      }
    };
    next();
  });
};

/**
 * Route handler for GET /users/:managerId/employees
 * 
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.searchEmployees = function(req, res, next) {
  var managerId = req.params.managerId;
  var error = controllerHelper.checkPositiveNumber(managerId, 'managerId');
  if(error) {
    return next(error);
  }
  userService.findByFilterCriteria({reportingManager: managerId}, function(err, users) {
    if(err) {
      return next(err);
    }
    var transformed = controllerHelper.filterUsers(users);
    req.data = {
      status: controllerHelper.HTTP_OK,
      content: transformed
    };
    next();
  });
};

/**
 * Get all users who have a manager role
 *
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.getAllManagers = function(req, res, next) {
  userService.findByFilterCriteria({role: userRoles.MANAGER}, function(err, users) {
    if(err) {
      return next(err);
    }
    var transformed = controllerHelper.filterUsers(users);
    req.data = {
      status: controllerHelper.HTTP_OK,
      content: transformed
    };
    next();
  });
};

/**
 * Get all users who have a individual user role
 * What individual user role mean is they are the employees of the organization who are not reporting manager to any other employee
 *
 * @param  {Object}     req         express request instance
 * @param  {Object}     res         express response instance
 * @param  {Function}   next        next function
 */
exports.getAllEmployees = function(req, res, next) {
  userService.findByFilterCriteria({role: userRoles.INDIVIDUAL_USER}, function(err, users) {
    if(err) {
      return next(err);
    }
    var transformed = controllerHelper.filterUsers(users);
    req.data = {
      status: controllerHelper.HTTP_OK,
      content: transformed
    };
    next();
  });
};