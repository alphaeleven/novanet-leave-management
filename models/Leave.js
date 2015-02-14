/**
 * Represent Leave in the system.
 */
'use strict';

/**
 * Defining Leave model
 */
module.exports = function(sequelize, DataTypes) {

  var Leave = sequelize.define('Leave', {
    // primary key
    id: {
      type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true,
      get: function() {
        return parseInt(this.getDataValue('id'));
      }
    },
    reason: DataTypes.STRING,
    startDate: DataTypes.DATE,
    endDate: DataTypes.DATE,
    requester: {
      type: DataTypes.BIGINT,
      get: function() {
        return parseInt(this.getDataValue('requester'));
      }
    },
    resolver: {
      type: DataTypes.BIGINT,
      get: function() {
        return parseInt(this.getDataValue('resolver'));
      }
    },
    status : {
      type: DataTypes.ENUM,
      values: ['APPROVED', 'REJECTED', 'NEW']
    },
    createdBy: {
      type: DataTypes.BIGINT,
      get: function() {
        return parseInt(this.getDataValue('createdBy'));
      }
    },
    updatedBy: {
      type: DataTypes.BIGINT,
      get: function() {
        return parseInt(this.getDataValue('updatedBy'));
      }
    }
  }, {
    tableName : 'leaves'
  });
  return Leave;
};