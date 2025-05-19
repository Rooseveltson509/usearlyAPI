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
        as: "author",
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
      siteUrl: DataTypes.STRING,
      emplacement: DataTypes.STRING,
      emoji: DataTypes.STRING,
      reactions: {
        type: DataTypes.JSON, // ✅ Tableau d'objets { emoji: "🔥", count: 10 }
        allowNull: false,
        defaultValue: [], // ✅ Commence vide
      },
      capture: {
        type: DataTypes.STRING, // Stocke l'URL de l'image en base64 ou un lien vers un stockage externe
        allowNull: true, // Ce champ est optionnel
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
