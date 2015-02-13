'use strict';

var paths = {
  js: ['*.js', 'test/**/*.js','**/*.js', '!node_modules/**', '!public/bower_components/**' ]
};
var config = require('config');
var databaseUrl = config.datasource.dbUrl;

module.exports = function(grunt) {
  // Project Configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: {
        src: paths.js,
        options: {
          jshintrc: true
        }
      }
    },
    migrate: {
      options: {
        env: {
          DATABASE_URL: databaseUrl // the databaseUrl is resolved at the beginning based on the NODE_ENV, this value injects the config in the database.json
        },
        'migrations-dir': 'config/schema-migrations', // defines the dir for the migration scripts
        verbose: true // tell me more stuff
      }
    },
    env: {
      test: {
        NODE_ENV: 'test'
      }
    }
  });

  //Load NPM tasks
  require('load-grunt-tasks')(grunt);

  grunt.registerTask('default', ['jshint', 'validate', 'dbmigrate']);
  //validate task.
  grunt.registerTask('validate', ['env:test', 'jshint']);

  // db migrate
  grunt.registerTask('dbmigrate', 'db up all the applicable scripts', function () {
    grunt.task.run('migrate:up');
  });
  grunt.registerTask('dbdown', 'db down all the applicable scripts', function () {
    grunt.task.run('migrate:down');
  });
};