'use strict';
var datasource = {};
var novanetDatasource = require('novanet-datasource');

/**
 * This function will initializes datasource with all the models present in models directory
 * @param {Object} config Global configuration object
 */
datasource.init = function(config) {
  if (!this.dbInstance) {
    this.dbInstance = new novanetDatasource(config);
  }
};

/**
 * Return the initialized datasource.
 * @return {Object} Datasource Object
 */
datasource.getDataSource = function() {
  return this.dbInstance;
};

/**
 * Exporting module
 */
module.exports = datasource;