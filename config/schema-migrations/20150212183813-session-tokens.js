'use strict';
var async = require('async');

exports.up = function(db, callback) {
  async.series([
    // Test table
    db.runSql.bind(db,
      'CREATE TABLE `novanet`.`session_tokens` ( ' +
        '`id` INT NOT NULL AUTO_INCREMENT, ' +
        '`token` MEDIUMTEXT NOT NULL, ' +
        '`expirationDate` TIMESTAMP NOT NULL, ' +
        '`userId` INT NOT NULL, ' +
        'createdAt TIMESTAMP NOT NULL, ' +
        'updatedAt TIMESTAMP NOT NULL, CONSTRAINT pk_session_tokens PRIMARY KEY (id)' +
      ');')
  ], callback);
};

exports.down = function(db, callback) {
  async.series([
    db.dropTable.bind(db, 'session_tokens')
  ], callback);
};
