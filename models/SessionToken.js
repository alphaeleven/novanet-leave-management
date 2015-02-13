/**
 * Represent SessionToken in the system.
 */
'use strict';

/**
 * Defining SessionToken model
 */
module.exports = function(sequelize, DataTypes) {

  var SessionToken = sequelize.define('SessionToken', {
    // primary key
    id: {
      type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true,
      get: function() {
        return parseInt(this.getDataValue('id'));
      }
    },
    userId: {
      type: DataTypes.BIGINT,
      get: function() {
        return parseInt(this.getDataValue('userId'));
      }
    },
    token: DataTypes.STRING,
    expirationDate: DataTypes.DATE
  }, {
    tableName : 'session_tokens'
  });
  return SessionToken;
};