"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class ReportingUsers extends Model {
    static associate(models) {
      // ReportingUsers appartient à un Reporting
      ReportingUsers.belongsTo(models.Reporting, {
        foreignKey: "reportingId",
        onDelete: "CASCADE",
      });

      // ReportingUsers appartient à un User
      ReportingUsers.belongsTo(models.User, {
        foreignKey: "userId",
        onDelete: "CASCADE",
      });
    }
  }

  ReportingUsers.init(
    {
      reportingId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Reportings",
          key: "id",
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "ReportingUsers",
      tableName: "ReportingUsers",
    }
  );

  return ReportingUsers;
};
