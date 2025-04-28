"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class ReportTimelineStep extends Model {
    static associate(models) {
      // timeline liée à un signalement
      ReportTimelineStep.belongsTo(models.Reporting, {
        foreignKey: "reportId",
        as: "report",
        onDelete: "CASCADE",
      });

      // optionnel : liée à un user (créée par un utilisateur)
      ReportTimelineStep.belongsTo(models.User, {
        foreignKey: "userId",
        as: "user",
        onDelete: "SET NULL",
      });

      // optionnel : liée à une marque
      ReportTimelineStep.belongsTo(models.Marque, {
        foreignKey: "brandId",
        as: "brand",
        onDelete: "SET NULL",
      });
    }
  }

  ReportTimelineStep.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      reportId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      label: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("done", "active", "upcoming", "review"),
        allowNull: false,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      brandId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.ENUM("user", "brand", "system"),
        allowNull: false,
        defaultValue: "system",
      },
    },
    {
      sequelize,
      modelName: "ReportTimelineStep",
      tableName: "ReportTimelineSteps",
    }
  );

  return ReportTimelineStep;
};
