'use strict';

var appControllers = angular.module('leaveManagementApp.controllers', ['leaveManagementApp.services']);

// login controller
appControllers.controller('LoginController', ['$scope', '$state', '$log', 'SecurityService', 'UserService', 'config', 'storage', function ($scope, $state, $log, SecurityService, UserService, config, storage) {
  $scope.status = {
    error: false,
    message: ''
  };
  $scope.rememberMe = false;
  var loginHandler = function(token) {
    storage.storeSessionToken(token, $scope.rememberMe);
    UserService.getMyUserProfile().then(function(profile) {
      storage.storeCurrentUserProfile(profile, $scope.rememberMe);
      SecurityService.getAllowedActions().then(function(actions) {
        storage.storeAllowedActions(actions, $scope.rememberMe);
        if(profile.role === config.userRoles.MANAGER) {
          $state.go('manager');
        } else if(profile.role === config.userRoles.INDIVIDUAL_USER) {
          $state.go('user');
        }
      }, function(reason) {
        $log.error('Error fetching allowed actions HTTP STATUS CODE [ ' + reason.status + ' ] Error [ ' + angular.toJson(reason.data) + ' ]');
      });
    }, function(profileReason) {
      $log.error('Error fetching user profile HTTP STATUS CODE [ ' + profileReason.status + ' ] Error [ ' + angular.toJson(profileReason.data) + ' ]');
    });
  };

  $scope.login = function(credentials) {
    SecurityService.authenticate(credentials.email, credentials.password).then(function(data) {
      loginHandler(data.sessionToken);
    }, function(reason) {
      $log.error('Login Error HTTP STATUS CODE [ ' + reason.status + ' ], Error message [ ' + angular.toJson(reason.data) + ' ]');
      $scope.status.error = true;
      if(reason.status === 401 || reason.status === 403) {
        $scope.status.message = 'Invalid email/password or user is not authorized to perform this operation';
      } else {
        $scope.status.message = reason.data.error;
      }
    });
  };
}]);

// register controller
appControllers.controller('RegisterController', ['$scope', '$log', 'UserService', 'managers', 'config', function ($scope, $log, UserService, managers, config) {
  $scope.managers = managers;
  $scope.userRoles = config.userRoles;
  $scope.user = {};
  $scope.status = {
    error: false,
    success: false,
    message: ''
  };
  $scope.register = function() {
    UserService.register($scope.user).then(function() {
      $scope.status.error = false;
      $scope.status.success = true;
      $scope.status.message = 'User registerd successfully';
      $scope.user = {};
    }, function(reason) {
      $log.error('Error registering user. HTTP STATUS CODE [' + reason.status + '], Error message [' + angular.toJson(reason.data) + ']');
      $scope.status.error = true;
      $scope.status.success = false;
      $scope.status.message = reason.data;
    });
  };
}]);

// manager controller
appControllers.controller('ManagerController', ['$scope', '$log', '$modal', 'UserService', 'profile', 'LeaveService', function ($scope, $log, $modal, UserService, profile, LeaveService) {
  $scope.user = profile;
  $scope.leaves = {
    requested: [],
    handler: []
  };
  $scope.status = {
    error: false,
    message: ''
  };
  $scope.init = function() {
    $scope.leaves.handler = [];
    UserService.getLeaves($scope.user).then(function(leaves) {
      $scope.leaves.requested = leaves.requested;
      angular.forEach(leaves.handler, function(leave) {
        UserService.getUserProfile(leave.requester).then(function(data) {
          leave.requester = data;
          $scope.leaves.handler.push(leave);
        }, function(reason) {
          $log.error('Error fetching requester information for user id' + leave.requester + '. HTTP STATUS CODE [' + reason.status + '], Error message [' + angular.toJson(reason.data) + ']');
        });
      });
    }, function(reason) {
      $log.error('Error approving leaves for user id ' + $scope.user.id +  '. HTTP STATUS CODE [' + reason.status + '], Error message [' + angular.toJson(reason.data) + ']');
    });
  };
  $scope.init();
  $scope.approve = function(leaveId) {
    var modalInstance = $modal.open({
      templateUrl: 'partials/leave-modal.html',
      controller: 'LeaveModalController',
      resolve: {
        type: function () {
          return 'Approve';
        }
      }
    });
    modalInstance.result.then(function(approveReason) {
      // approve request
      LeaveService.approveLeave(leaveId, approveReason).then(function() {
        $scope.status.success = true;
        $scope.status.error = false;
        $scope.status.message = 'Leave approved successfully';
        $scope.init();
      }, function(reason) {
        $log.error('Error approving request. HTTP STATUS CODE [' + reason.status + '], Error message [' + angular.toJson(reason.data) + ']');
        $scope.status.success = false;
        $scope.status.error = true;
        $scope.status.message = reason.data.error;
      });
    });
  };

  $scope.reject = function(leaveId) {
    var modalInstance = $modal.open({
      templateUrl: 'partials/leave-modal.html',
      controller: 'LeaveModalController',
      resolve: {
        type: function () {
          return 'Reject';
        }
      }
    });
    modalInstance.result.then(function(rejectReason) {
      // approve request
      LeaveService.rejectLeave(leaveId, rejectReason).then(function() {
        $scope.status.success = true;
        $scope.status.error = false;
        $scope.status.message = 'Leave rejected successfully';
        $scope.init();
      }, function(reason) {
        $log.error('Error approving request. HTTP STATUS CODE [' + reason.status + '], Error message [' + angular.toJson(reason.data) + ']');
        $scope.status.success = false;
        $scope.status.error = true;
        $scope.status.message = reason.data.error;
      });
    });
  };
}]);

// user controller
appControllers.controller('UserController', ['$scope', '$filter', '$log', 'profile', 'UserService', function ($scope, $filter, $log, profile, UserService) {
  $scope.user = profile;
  var today = $filter('date')(Date.now(), 'dd-MMMM-yyyy');
  $scope.endDateOpened = false;
  $scope.startDateOpened = false;
  $scope.dateFormat = 'dd-MMMM-yyyy';
  $scope.minDate = today;
  $scope.startDate = today;
  $scope.endDate = today;
  $scope.dateOptions = {
    startingDay: 1
  };
  // Disable past date
  $scope.disabled = function(date, mode) {
    return ( mode === 'day' && (date < today) );
  };
  $scope.openStartDate = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.startDateOpened = true;
  };
  $scope.openEndDate = function($event) {
    $event.preventDefault();
    $event.stopPropagation();
    $scope.endDateOpened = true;
  };

  $scope.status = {
    error: false,
    success: false,
    message: ''
  };

  $scope.reset = function() {
    $scope.reason = '';
    $scope.startDate = today;
    $scope.endDate = today;
  };

  $scope.apply = function(reason) {
    var leave = {
      startDate: $scope.startDate,
      endDate: $scope.endDate,
      reason: reason
    };
    UserService.applyLeave(leave, profile).then(function() {
      $scope.status.error = false;
      $scope.status.success = true;
      $scope.status.message = 'Your leave request successfully sent to your reporting manager. Leave waiting for approval';
      $scope.reset();
    }, function(reason) {
      $log.error('Error applying for leave HTTP STATUS CODE [ ' + reason.status + ' ] Error [ ' + angular.toJson(reason.data) + ' ]');
      $scope.status.error = true;
      $scope.status.success = false;
      $scope.status.message = reason.data.error;
    });
  };
}]);

appControllers.controller('LeaveModalController', ['$scope', '$modalInstance', 'type', function($scope, $modalInstance, type) {
  $scope.type = type ;
  $scope.ok = function(leaveReason) {
    $modalInstance.close(leaveReason);
  };
  $scope.cancel = function() {
    $modalInstance.dismiss();
  };
}]);