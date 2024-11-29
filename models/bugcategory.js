'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class BugCategory extends Model {
    static associate(models) {
      // Associer BugCategory à SiteTypes
      BugCategory.belongsTo(models.SiteType, {
        foreignKey: 'siteTypeId',
        as: 'siteType',
      });
    }
  }
  BugCategory.init(
    {
      name: DataTypes.STRING,
      siteTypeId: DataTypes.UUID,
    },
    {
      sequelize,
      modelName: 'BugCategory',
    }
  );
  return BugCategory;
};