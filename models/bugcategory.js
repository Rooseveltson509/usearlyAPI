"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class BugCategory extends Model {
    static associate(models) {
      // Associer BugCategory à SiteTypes
      BugCategory.belongsTo(models.SiteType, {
        foreignKey: "siteTypeId",
        as: "siteType",
      });
    }
  }
  BugCategory.init(
    {
      /*       id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      }, */
      name: DataTypes.STRING,
      siteTypeId: DataTypes.UUID,
    },
    {
      sequelize,
      modelName: "BugCategory",
    }
  );

  return BugCategory;
};
