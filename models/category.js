"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Category extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Association with SiteType (1 category belongs to 1 site type)
      Category.belongsTo(models.SiteType, {
        foreignKey: "siteTypeId",
        as: "siteType",
      });

      // Association with Reporting (many-to-many through ReportingCategories)
      Category.belongsToMany(models.Reporting, {
        through: "ReportingCategories",
        foreignKey: "categoryId",
        as: "reportings",
      });

      // Association with Suggestion (many-to-many through SuggestionCategories)
      Category.belongsToMany(models.Suggestion, {
        through: "SuggestionCategories",
        foreignKey: "categoryId",
        as: "suggestions",
      });

      // Association with CoupDeCoeur (many-to-many through CoupDeCoeurCategories)
      Category.belongsToMany(models.CoupDeCoeur, {
        through: "CoupDeCoeurCategories",
        foreignKey: "categoryId",
        as: "coupDeCoeurs",
      });
    }
  }

  Category.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4, // Automatically generates a UUIDv4
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false, // Ensure name is required
        unique: true, // Avoid duplicate category names
        validate: {
          notEmpty: { msg: "Category name cannot be empty" },
          len: {
            args: [3, 255],
            msg: "Category name must be between 3 and 255 characters",
          },
        },
      },
      siteTypeId: {
        type: DataTypes.UUID,
        allowNull: false, // Ensure association with SiteType is required
        validate: {
          isUUID: { args: 4, msg: "siteTypeId must be a valid UUID" },
        },
      },
    },
    {
      sequelize,
      modelName: "Category",
      tableName: "Categories", // Explicit table name for clarity
      timestamps: true, // Adds `createdAt` and `updatedAt`
    }
  );

  return Category;
};
