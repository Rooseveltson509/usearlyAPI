"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class SiteType extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Association avec le modèle Category
      SiteType.hasMany(models.Category, {
        foreignKey: "siteTypeId",
        as: "categories", // Alias pour accéder aux catégories associées
      });
    }
  }

  SiteType.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Assure l'unicité du nom
        validate: {
          notEmpty: true, // Vérifie que le champ n'est pas vide
          len: [3, 255], // Vérifie la longueur (entre 3 et 255 caractères)
        },
      },
      description: {
        type: DataTypes.TEXT, // Permet des descriptions longues
        allowNull: true, // Le champ est optionnel
      },
    },
    {
      sequelize,
      modelName: "SiteType",
      tableName: "SiteTypes", // Définit explicitement le nom de la table
      timestamps: true, // Inclut `createdAt` et `updatedAt`
    }
  );

  return SiteType;
};
