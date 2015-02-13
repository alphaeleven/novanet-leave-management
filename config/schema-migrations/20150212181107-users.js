'use strict';
var async = require('async');

exports.up = function(db, callback) {
  // every user has a role associated and every user has a reporting manager.
  // If for a user reporting manager is null than that employee is considered as the head of the business/organization
  async.series([
    // Test table
    db.runSql.bind(db,
      'CREATE TABLE `novanet`.`users` ( ' +
        '`id` INT NOT NULL AUTO_INCREMENT, ' +
        '`firstName` MEDIUMTEXT NOT NULL, ' +
        '`lastName` MEDIUMTEXT NOT NULL, ' +
        '`email` VARCHAR(255) NOT NULL, ' +
        '`reportingManager` INT, ' +
        '`passwordHash` MEDIUMTEXT NOT NULL, ' +
        '`isFirstNamePublic` TINYINT(1) DEFAULT 1, ' +
        '`isLastNamePublic` TINYINT(1) DEFAULT 1, ' +
        '`isEmailPublic` TINYINT(1) DEFAULT 1, ' +
        '`resetPasswordToken` MEDIUMTEXT NULL, ' +
        '`role` ENUM(\'MANAGER\', \'INDIVIDUAL_USER\') NOT NULL, ' +
        '`resetPasswordExpired` TINYINT(1) DEFAULT 1, ' +
        'createdAt TIMESTAMP NOT NULL, ' +
        'updatedAt TIMESTAMP NOT NULL, CONSTRAINT pk_users PRIMARY KEY (id)' +
      ');')
  ], callback);
};

exports.down = function(db, callback) {
  async.series([
    db.dropTable.bind(db, 'users')
  ], callback);
};
