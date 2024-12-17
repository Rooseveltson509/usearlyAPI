"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class ReportingCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Relation avec Reporting
      ReportingCategory.belongsTo(models.Reporting, {
        foreignKey: "reportingId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Relation avec Category
      ReportingCategory.belongsTo(models.Category, {
        foreignKey: "categoryId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  ReportingCategory.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      reportingId: {
        type: DataTypes.UUID,
        allowNull: false, // Champ obligatoire
        validate: {
          notEmpty: true, // Ne doit pas être vide
        },
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      sequelize,
      modelName: "ReportingCategory",
      tableName: "ReportingCategories", // Nom explicite pour la table
      timestamps: true, // Inclut createdAt et updatedAt
    }
  );

  return ReportingCategory;
};
