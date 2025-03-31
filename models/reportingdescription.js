"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class ReportingDescription extends Model {
    static associate(models) {
      // Association avec Reporting (avec alias)
      ReportingDescription.belongsTo(models.Reporting, {
        foreignKey: "reportingId",
        as: "reporting", // ✅ Ajout de l'alias ici
        onDelete: "CASCADE",
      });

      // Association avec User
      ReportingDescription.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user", // ✅ Alias optionnel si tu veux inclure l'utilisateur plus tard
        onDelete: "CASCADE",
      });
    }
  }

  ReportingDescription.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      reportingId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "ReportingDescription",
      tableName: "ReportingDescriptions",
      timestamps: true,
    }
  );

  return ReportingDescription;
};
