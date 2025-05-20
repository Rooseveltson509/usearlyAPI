"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Like extends Model {
    static associate(models) {
      Like.belongsTo(models.User, { foreignKey: "userId" });
      // Pas de relation directe à Post/Suggestion/CoupDeCoeur
    }
  }

  Like.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      targetId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      targetType: {
        type: DataTypes.ENUM("report", "coupDeCoeur", "suggestion"),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Like",
      indexes: [
        {
          unique: true,
          fields: ["userId", "targetId", "targetType"], // évite les doublons
        },
      ],
    }
  );

  return Like;
};
