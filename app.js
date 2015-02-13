'use strict';

/**
 * API Application script
 */

/* Globals */
var express = require('express'),
  config = require('config'),
  logger = require('./logger').getLogger(),
  path = require('path'),
  app = express();
var datasource = require('./datasource');
// initialize datasource
datasource.init(config);
var router = require('./middlewares/router'),
  tokenParser = require('./middlewares/tokenParser'),
  responser = require('./middlewares/responser'),
  errorHandler = require('./middlewares/errorHandler'),
  port = process.env.PORT || config.WEB_SERVER_PORT || 3000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

var bodyParser = require('body-parser');
// only use bodyParser for json and urlencoded
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(tokenParser());
// init application routes
app.use(router(config));
// use global error handler
app.use(errorHandler());
// use responser
app.use(responser());
/**
 * Configuring root path
 */
app.get('/', function(req, res) {
  res.render('index', {
    title : 'Leave Management Application'
  });
});
// start the application
app.listen(port);
logger.info('App started on port ' + port);