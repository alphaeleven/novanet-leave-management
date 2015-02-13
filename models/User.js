/**
 * Represent User in the system.
 */
'use strict';

/**
 * Defining User model
 */
module.exports = function(sequelize, DataTypes) {

  var User = sequelize.define('User', {
    // primary key
    id: {
      type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true,
      get: function() {
        return parseInt(this.getDataValue('id'));
      }
    },
    reportingManager: {
      type: DataTypes.BIGINT,
      get: function() {
        return parseInt(this.getDataValue('reportingManager'));
      }
    },
    firstName: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true
      }
    },
    lastName: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      validate: {
        notNull: true,
        notEmpty: true
      }
    },
    isFirstNamePublic: DataTypes.BOOLEAN,
    isLastNamePublic: DataTypes.BOOLEAN,
    isEmailPublic: DataTypes.BOOLEAN,
    resetPasswordToken: DataTypes.STRING,
    resetPasswordExpired: DataTypes.BOOLEAN,
    role : {
      type: DataTypes.ENUM,
      values: ['MANAGER', 'INDIVIDUAL_USER']
    }
  }, {
    tableName : 'users'
  });
  return User;
};