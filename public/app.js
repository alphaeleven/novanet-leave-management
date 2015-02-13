'use strict';

/**
 * This is the main file. This will bootstrapped the HQ angular app and will do the required configurations
 */
var app = angular.module('leaveManagementApp', ['ui.router', 'leaveManagementApp.controllers', 'leaveManagementApp.services']);

/**
 * App configurations goes here
 */
app.config(['$stateProvider', '$urlRouterProvider','$locationProvider', '$compileProvider', function($stateProvider, $urlRouterProvider, $locationProvider, $compileProvider) {
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|javascript):/);
  $urlRouterProvider.otherwise('/');

  $stateProvider
    .state('login', {
      url: '/',
      templateUrl: 'partials/login.html',
      controller: 'LoginController'
    })
    .state('manager', {
      url: '/manager',
      templateUrl: 'partials/manager.html',
      controller: 'ManagerController'
    })
    .state('user', {
      url: '/user',
      templateUrl: 'partials/user.html',
      controller: 'UserController'
    })
    .state('register', {
      url: '/register',
      templateUrl: 'partials/register.html',
      controller: 'RegisterController'
    });
}]);

app.run(['$rootScope', '$log', '$state', '$interval', '$location', 'SecurityService', 'storage', 'config', 'util', function($rootScope, $log, $state, $interval, $location, SecurityService, storage, config, util) {
  // authentication logic
  var token = storage.getSessionToken();
  var profile = storage.getCurrentUserProfile();
  if(token && profile) {
    // check if the user is manager or normal employee then reidirect to home
    if(profile.role === config.userRoles.MANAGER) {
      $state.go('manager');
    } else if(profile.role === config.userRoles.INDIVIDUAL_USER) {
      $state.go('user');
    } else {
      $state.go('login');
    }
  } else {
    // redirect to login
    $state.go('login');
  }

  $rootScope.getHome = function() {
    var profile = storage.getCurrentUserProfile();
    if(profile.role === config.userRoles.MANAGER) {
      return '/manager';
    } else if(profile.role === config.userRoles.INDIVIDUAL_USER) {
      return '/user';
    } else {
      return '/';
    }
  };

  // if session token refresh period is configured
  if(config.SESSION_TOKEN_REFRESH_PERIOD) {
    $interval(util.refreshToken, config.SESSION_TOKEN_REFRESH_PERIOD * 1000);
  }
  $rootScope.$on('$routeChangeStart', function () {
    var path = $location.path();
    // check if the user is authorized
    if(util.isLoggedIn()) {
        // check the user home page
        if(path === '/manager') {
            $location.path($rootScope.getHome());
        } else if(path === '/employee') {
            $location.path($rootScope.getHome());
        } else if(path === '/') {
            $location.path($rootScope.getHome());
        }
    } else if(config.publicRoutes.indexOf(path) === -1) {
        $location.path('/');
    }
  });
}]);