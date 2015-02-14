'use strict';
/**
 * Angularjs services
 */

var appServices = angular.module('leaveManagementApp.services', []);

/**
 * Application configuration.
 * Application configuration is exposed to the controllers as well as dependent services in the form of a config service
 * Any controller or service needs to access global configuration must inject this service.
 * Use standard angular injection
 */
appServices.factory('config', [function() {
  return {
    SESSION_TOKEN_REFRESH_PERIOD: 1800,
    userRoles: {
      MANAGER: 'MANAGER',
      INDIVIDUAL_USER: 'INDIVIDUAL_USER'
    },
    publicRoutes: [
      '/register'
    ]
  };
}]);

/**
 * Angular service that abstracts the sessionToken storage and retrieval
 */
appServices.factory('storage', [function() {
  var service = {};
  /**
   * Returns the stored sessionToken
   * This method first checks in sessionStorage if sessionToken is not found in sessionStorage
   * this method checks in localStorage, if sessionToken still not found in localStorage, then it will return null or undefined
   * The controllers has to implement the logic that if sessionToken is null/undefined then user is not authorized
   */
  service.getSessionToken = function() {
    var token = sessionStorage.getItem('novanet.leavemanagement.application.auth.token');
    if (!token) {
      token = localStorage.getItem('novanet.leavemanagement.application.auth.token');
    }
    return token;
  };
  /**
   * Store the session token in sessionStorage
   * A boolean flag is passed which when true indicate that user chose remember me option and data should also be stored in localStorage
   */
  service.storeSessionToken = function(sessionToken, flag) {
    sessionStorage.setItem('novanet.leavemanagement.application.auth.token', sessionToken);
    if (flag) {
      localStorage.setItem('novanet.leavemanagement.application.auth.token', sessionToken);
    }
  };

  /**
   * Get current user profile stored in sessionStorage or localStorage
   */
  service.getCurrentUserProfile = function() {
    var profile = sessionStorage.getItem('novanet.leavemanagement.application.auth.profile');
    if (!profile) {
      profile = localStorage.getItem('novanet.leavemanagement.application.auth.profile');
    }
    return angular.fromJson(profile);
  };

  /**
   * Store the current user profile in sessionStorage
   * A boolean flag is passed which when true indicate that user chose remember me option and data should also be stored in localStorage
   */
  service.storeCurrentUserProfile = function(profile, flag) {
    profile = angular.toJson(profile);
    sessionStorage.setItem('novanet.leavemanagement.application.auth.profile', profile);
    if (flag) {
      localStorage.setItem('novanet.leavemanagement.application.auth.profile', profile);
    }
  };

  /**
   * Get current user allowed actions stored in sessionStorage or localStorage
   */
  service.getAllowedActions = function() {
    var actions = sessionStorage.getItem('novanet.leavemanagement.application.auth.actions');
    if (!actions) {
      actions = localStorage.getItem('novanet.leavemanagement.application.auth.actions');
    }
    return angular.fromJson(actions);
  };

  /**
   * Store the allowed actions in sessionStorage
   * A boolean flag is passed which when true indicate that user chose remember me option and data should also be stored in localStorage
   */
  service.storeAllowedActions = function(actions, flag) {
    actions = angular.toJson(actions);
    sessionStorage.setItem('novanet.leavemanagement.application.auth.actions', actions);
    if (flag) {
      localStorage.setItem('novanet.leavemanagement.application.auth.actions', actions);
    }
  };

  /**
   * Utility method to clear the sessionStorage
   */
  service.clear = function() {
    sessionStorage.removeItem('novanet.leavemanagement.application.auth.token');
    sessionStorage.removeItem('novanet.leavemanagement.application.auth.actions');
    sessionStorage.removeItem('novanet.leavemanagement.application.auth.profile');

    localStorage.removeItem('novanet.leavemanagement.application.auth.token');
    localStorage.removeItem('novanet.leavemanagement.application.auth.actions');
    localStorage.removeItem('novanet.leavemanagement.application.auth.profile');
  };
  return service;
}]);

/**
 * This service encapsulates the btoa() and atob() javascript functions for binary to base64 encode/decode
 */
appServices.factory('base64', [function() {
  var service = {};
  /**
   * Encode a binary string data into base64 string
   */
  service.encode = function(data) {
    return btoa(data);
  };
  /**
   * Decodes a base64 string data into binary string data.
   */
  service.decode = function(data) {
    return atob(data);
  };
  return service;
}]);


/**
 * Application utility service
 */
appServices.factory('util', ['$log', 'SecurityService', 'UserService', 'storage', function($log, SecurityService, UserService, storage) {
  var service = {};

  /**
   * This function is called in interval to refresh the session token
   */
  service.refreshToken = function() {
    $log.info('Refreshing sessionToken');
    var token = localStorage.getItem('novanet.leavemanagement.application.auth.token');
    if (token) {
      SecurityService.refreshToken(token).then(function(loginResult) {
        storage.storeSessionToken(loginResult.sessionToken, true);
        // get user profile
        UserService.getMyUserProfile().then(function(user) {
          storage.storeCurrentUserProfile(user, true);
          // get allowed actions
          SecurityService.getAllowedActions().then(function(actions) {
            storage.storeAllowedActions(actions, true);
          }, function(actionReason) {
            $log.error('Error fetching current user actions. HTTP STATUS CODE [' + actionReason.status + '], Error message [' + angular.toJson(actionReason.data) + ']');
          });
        }, function(userReason) {
          $log.error('Error fetching current user profile. HTTP STATUS CODE [' + userReason.status + '], Error message [' + angular.toJson(userReason.data) + ']');
        });
      }, function(reason) {
        // some error occurred
        $log.error('Session Token Refresh Error. HTTP STATUS CODE [' + reason.status + '], Error message [' + angular.toJson(reason.data) + ']');
      });
    }
  };

  /**
   * Function to check if any user is currently logged in
   */
  service.isLoggedIn = function() {
    var profile = storage.getCurrentUserProfile();
    var actions = storage.getAllowedActions();
    var sessionToken = storage.getSessionToken();
    if (profile && actions && sessionToken) {
      return true;
    }
    return false;
  };

  return service;
}]);

/**
 * Application SecurityService.
 * This service is responsible for all the application security.
 * All the methods in this service returns a promise.
 * When async opeartion finishes that promise would be resolved or rejected.
 * The promise would be resolved with actual response from Backend API and would be rejected be the reason
 */
appServices.factory('SecurityService', ['config', 'base64', 'storage', '$http', '$q', function(config, base64, storage, $http, $q) {
  var service = {};
  /**
   * Authenticate the user using password type.
   */
  service.authenticate = function(email, password) {
    var deferred = $q.defer();
    var credentials = base64.encode(email + ':' + password);
    // prepare http request object
    var req = {
      method: 'POST',
      url: '/login',
      headers: {
        'Authorization': 'Basic ' + credentials
      }
    };
    $http(req).then(function(payload) {
      deferred.resolve(payload.data);
    }, function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };
  /**
   * Refresh the current sessionToken.
   * This service method internally sets the localStorage and session storage to new sessionToken
   */
  service.refreshToken = function(sessionToken) {
    var deferred = $q.defer();
    // prepare http request object
    var req = {
      method: 'POST',
      url: '/refreshToken',
      headers: {
        'Authorization': 'Bearer ' + sessionToken
      }
    };
    $http(req).then(function(payload) {
      deferred.resolve(payload.data);
    }, function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  /**
   * Get allowed actions for current user
   */
  service.getAllowedActions = function() {
    var deferred = $q.defer();
    var accessToken = storage.getSessionToken();
    // prepare http request object
    var req = {
      method: 'GET',
      url: '/users/me/actions',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    };
    $http(req).then(function(payload) {
      deferred.resolve(payload.data);
    }, function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  /**
   * Recover the forgotten password
   */
  service.recoverPassword = function(email) {
    var deferred = $q.defer();
    // prepare http request object
    var req = {
      method: 'POST',
      url: '/forgotPassword?email=' + email
    };
    $http(req).then(function(payload) {
      deferred.resolve(payload.data);
    }, function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  /**
   * Reset forgotten password. Reset password token is mandatory
   */
  service.resetForgottenPassword = function(token, password) {
    var deferred = $q.defer();
    // prepare http request object
    var req = {
      method: 'POST',
      url: '/resetForgottenPassword?token=' + token + '&newPassword=' + password
    };
    $http(req).then(function(payload) {
      deferred.resolve(payload.data);
    }, function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  /**
   * Revoke the current session token
   */
  service.revokeSessionToken = function() {
    var deferred = $q.defer();
    var accessToken = storage.getSessionToken();
    // prepare http request object
    var req = {
      method: 'POST',
      url: '/revokeToken',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    };
    $http(req).then(function(payload) {
      deferred.resolve(payload.data);
    }, function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  return service;
}]);

/**
 * Application UserService.
 * This service exposes user actions like getUserProfile, getMyUserProfile etc
 * All the methods in this service returns a promise.
 * When async opeartion finishes that promise would be resolved or rejected.
 * The promise would be resolved with actual response from Backend API and would be rejected be the reason
 */
appServices.factory('UserService', ['config', 'storage', '$http', '$q', function(config, storage, $http, $q) {
  var service = {};

  /**
   * Register the user on mom and pop platform
   * registration is registration entity object which would be converted to json string
   * userProfile and businessProfile are optional
   */
  service.register = function(registration) {
    var deferred = $q.defer();
    // prepare request object
    var req = {
      method: 'POST',
      url: '/register',
      data: registration
    };
    $http(req).then(function(payload) {
      deferred.resolve(payload.data);
    }, function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  /**
   * Get user profile uniquely identified by id
   */
  service.getUserProfile = function(id) {
    var deferred = $q.defer();
    var accessToken = storage.getSessionToken();
    // prepare http request object
    var req = {
      method: 'GET',
      url: '/users/' + id,
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    };
    $http(req).then(function(payload) {
      deferred.resolve(payload.data);
    }, function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  /**
   * Get my user profile
   */
  service.getMyUserProfile = function() {
    var deferred = $q.defer();
    var accessToken = storage.getSessionToken();
    // prepare http request object
    var req = {
      method: 'GET',
      url: '/users/me',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    };
    $http(req).then(function(payload) {
      deferred.resolve(payload.data);
    }, function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  /**
   * Update current user profile
   */
  service.updateMyUserProfile = function(user) {
    var deferred = $q.defer();
    var accessToken = storage.getSessionToken();
    // prepare request object
    var req = {
      method: 'PUT',
      url: '/users/me',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
      },
      data: user
    };
    $http(req).then(function(payload) {
      deferred.resolve(payload.data);
    }, function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  /**
   * GET all managers in the organization
   */
  service.getAllManagers = function() {
    var deferred = $q.defer();
    // prepare request object
    var req = {
      method: 'GET',
      url: '/managers'
    };
    $http(req).then(function(payload) {
      deferred.resolve(payload.data);
    }, function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  /**
   * GET all users ( except manager) in the organization
   */
  service.getAllUsers = function() {
    var deferred = $q.defer();
    // prepare request object
    var req = {
      method: 'GET',
      url: '/employees'
    };
    $http(req).then(function(payload) {
      deferred.resolve(payload.data);
    }, function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  service.applyLeave = function(entity, user) {
    var deferred = $q.defer();
    var accessToken = storage.getSessionToken();
    // prepare http request object
    var req = {
      method: 'POST',
      url: '/users/' + user.id + '/leaves',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      data: entity
    };
    $http(req).then(function(payload) {
      deferred.resolve(payload.data);
    }, function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  service.getLeaves = function(user) {
    var deferred = $q.defer();
    var accessToken = storage.getSessionToken();
    // prepare http request object
    var req = {
      method: 'GET',
      url: '/users/' + user.id + '/leaves',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      }
    };
    $http(req).then(function(payload) {
      deferred.resolve(payload.data);
    }, function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  return service;
}]);

/**
 * Application LeaveService.
 * This service communicates with backend REST API's
 * All the routes in this service requires authorization header
 * All the methods in this service returns a promise.
 * When async opeartion finishes that promise would be resolved or rejected.
 * The promise would be resolved with actual response from Backend API and would be rejected be the reason
 */
appServices.factory('LeaveService', ['config', 'storage', '$http', '$q', function(config, storage, $http, $q) {
  var service = {};

  service.approveLeave = function(leaveId, reason) {
    var deferred = $q.defer();
    var accessToken = storage.getSessionToken();
    var data = {
      reason: reason
    };
    // prepare http request object
    var req = {
      method: 'POST',
      url: '/leaves/' + leaveId + '/approve',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      data: data
    };
    $http(req).then(function(payload) {
      deferred.resolve(payload.data);
    }, function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };

  service.rejectLeave = function(leaveId, reason) {
    var deferred = $q.defer();
    var accessToken = storage.getSessionToken();
    var data = {
      reason: reason
    };
    // prepare http request object
    var req = {
      method: 'POST',
      url: '/leaves/' + leaveId + '/reject',
      headers: {
        'Authorization': 'Bearer ' + accessToken
      },
      data: data
    };
    $http(req).then(function(payload) {
      deferred.resolve(payload.data);
    }, function(reason) {
      deferred.reject(reason);
    });
    return deferred.promise;
  };
  return service;
}]);