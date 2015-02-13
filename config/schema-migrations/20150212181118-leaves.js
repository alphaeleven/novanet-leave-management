'use strict';
var async = require('async');

exports.up = function(db, callback) {
  async.series([
    // Test table
    db.runSql.bind(db,
      'CREATE TABLE `novanet`.`leaves` ( ' +
        '`id` INT NOT NULL AUTO_INCREMENT, ' +
        '`reason` MEDIUMTEXT NOT NULL, ' +
        '`startDate` TIMESTAMP NOT NULL, ' +
        '`endDate` TIMESTAMP NOT NULL, ' +
        '`requester` INT NOT NULL, ' +
        '`resolver` INT NOT NULL, ' +
        '`status` ENUM(\'APPROVED\', \'REJECTED\', \'NEW\') NOT NULL, ' +
        '`createdBy` INT NOT NULL, ' +
        '`updatedBy` INT NOT NULL, ' +
        'createdAt TIMESTAMP NOT NULL, ' +
        'updatedAt TIMESTAMP NOT NULL, CONSTRAINT pk_leaves PRIMARY KEY (id)' +
      ');')
  ], callback);
};

exports.down = function(db, callback) {
  async.series([
    db.dropTable.bind(db, 'leaves')
  ], callback);
};
