"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Suggestion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Suggestion.belongsTo(models.User, {
        foreignKey: "userId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Suggestion.hasMany(models.Comment, {
        foreignKey: "suggestionId",
        as: "comments",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }
  Suggestion.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: DataTypes.UUID,
      marque: DataTypes.STRING,
      description: DataTypes.TEXT("long"),
      emplacement: DataTypes.STRING,
      reactions: {
        type: DataTypes.JSON, // ✅ Tableau d'objets { emoji: "🔥", count: 10 }
        allowNull: false,
        defaultValue: [], // ✅ Commence vide
      },
      validated: DataTypes.BOOLEAN,
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: "Suggestion",
      tableName: "Suggestions",
    }
  );
  return Suggestion;
};
