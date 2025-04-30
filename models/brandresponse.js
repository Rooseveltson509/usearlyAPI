"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class BrandResponse extends Model {
    /**
     * Définition des associations.
     */
    static associate(models) {
      BrandResponse.belongsTo(models.Reporting, {
        foreignKey: {
          name: "reportId",
          allowNull: false,
        },
        as: "report",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      BrandResponse.belongsTo(models.Marque, {
        foreignKey: {
          name: "marqueId",
          allowNull: false,
        },
        as: "marque",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  BrandResponse.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      reportId: {
        allowNull: false,
        type: DataTypes.UUID,
      },
      message: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      brandName: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      authorName: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      authorRole: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      authorAvatarUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "BrandResponse",
      tableName: "BrandResponse",
      indexes: [
        {
          fields: ["reportId"],
        },
      ],
    }
  );

  return BrandResponse;
};
