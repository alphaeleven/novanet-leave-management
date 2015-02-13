'use strict';

/**
 * Main router middleware for the API.
 *
 * This middleware route requests to particular controller methods.
 * In implementation it a wrapper around express.Router instance.
 * HTTP VERB routes defined in the configuration object are added to router instance
 */

/* Globals */
var express = require('express');
var path = require('path');
var auth = require('./auth');
var routingMethods = {
  GET: 'get',
  POST: 'post',
  PUT: 'put',
  DELETE: 'delete',
  HEAD: 'head',
  OPTIONS: 'options'
};

/**
 * Load the controllers and instantiate them. Instantiation involves calling the init method of controllers once.
 * Controllers can perform some init task in init method
 *
 * @param  {Object}   config    Configuration object
 * @return {Object}             Returns an object (controllerName --> controllerInstance)
 */
var loadControllers = function(config) {
  var options, controller, controllerConfig, controllerBunch, controllers = {};
  for (controller in config.controllers) {
    if (config.controllers.hasOwnProperty(controller)) {
      controllerConfig = config.controllers[controller];
      options = controllerConfig.options;
      if(options && typeof (options) !== 'object') {
        throw new Error('Controller ' + controller + 'options should be a object');
      }
      var controllerPath = path.join(process.cwd(), config.app.controllersDirectory, controller);
      controllerBunch = require(controllerPath);
      controllerBunch.init(options, config);
      controllers[controller] = controllerBunch;
    }
  }
  return controllers;
};

/**
 * Load the routes from config.routes
 *
 * @param  {Object}  router        Express router instance
 * @param  {Object}  config        Global configuration Object
 * @param  {Object}  controllers   Object of controllers
 */
var loadRoutes = function(router, config, controllers) {
  var route, routeValues, routeKeys, verb,
    path, controllerName, actionName, actionMethod;

  //load and initialize secured routes
  for (route in config.routes.secured) {
    if (config.routes.secured.hasOwnProperty(route)) {
      routeValues = config.routes.secured[route].split('#');
      if (routeValues.length !== 2) {
        throw new Error('ERROR Route value "' + config.routes.secured[route] + 
          '" Route value must be "<controller-name>#<action-method-name>",' + ' like "foo#index"');
      }

      routeKeys = route.split(' ');
      if (routeKeys.length !== 2) {
        throw new Error('ERROR Route key "' + route + '" Route key must be "<HTTP-verb> <path-pattern>", like "GET /foo/:id"');
      }

      verb = routeKeys[0];
      path = routeKeys[1];
      controllerName = routeValues[0];
      actionName = routeValues[1];
      if (!routingMethods[verb]) {
        throw new Error('HTTP verb "' + verb + '" for route "' + route + '" is not supported!');
      }

      if (!controllers[controllerName]) {
        throw new Error('Controller "' + controllerName + '" is not available for route "' + route + '"!');
      }

      actionMethod = controllers[controllerName][actionName];
        if (!actionMethod) {
          throw new Error('Action method "' + controllerName + '#' + actionName + '" is not available for route "' + route + '"!');
      }
      // by default consider 1st part as the resource name
      var action = path.split('/').slice(0, 2).join('');
      router[routingMethods[verb]](path, auth(action), controllers[controllerName][actionName]);
    }
  }
  //load and initialize public routes
  for (route in config.routes.public) {
    if (config.routes.public.hasOwnProperty(route)) {
      routeValues = config.routes.public[route].split('#');
      if (routeValues.length !== 2) {
        throw new Error('ERROR Route value "' + config.routes.public[route] + 
          '" Route value must be "<controller-name>#<action-method-name>",' + ' like "foo#index"');
      }

      routeKeys = route.split(' ');
      if (routeKeys.length !== 2) {
        throw new Error('ERROR Route key "' + route + '" Route key must be "<HTTP-verb> <path-pattern>", like "GET /foo/:id"');
      }

      verb = routeKeys[0];
      path = routeKeys[1];
      controllerName = routeValues[0];
      actionName = routeValues[1];
      if (!routingMethods[verb]) {
        throw new Error('HTTP verb "' + verb + '" for route "' + route + '" is not supported!');
      }

      if (!controllers[controllerName]) {
        throw new Error('Controller "' + controllerName + '" is not available for route "' + route + '"!');
      }

      actionMethod = controllers[controllerName][actionName];
        if (!actionMethod) {
          throw new Error('Action method "' + controllerName + '#' + actionName + '" is not available for route "' + route + '"!');
      }
      router[routingMethods[verb]](path, controllers[controllerName][actionName]);
    }
  }
};

/**
 * Module exports
 *
 * @param  {Object} config      Configuration object
 * @return {Router}             Express router instance
 */
module.exports = function(config) {
  var options = {
    caseSensitive: true
  };
  // Instantiate an isolated express Router instance
  var router = express.Router(options);
  // load controllers
  var controllers = loadControllers(config);

  // configure router instance
  loadRoutes(router, config, controllers);

  return router;
};