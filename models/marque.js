"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Marque extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Relation avec User
      Marque.belongsTo(models.User, {
        foreignKey: {
          name: "userId", // Nom explicite de la clé étrangère
          allowNull: false,
        },
        as: "user", // Alias pour accéder à l'utilisateur
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      Marque.hasMany(models.Post, { foreignKey: "marqueId", as: "posts" });

      // Relation avec TicketMarque
      Marque.hasMany(models.TicketMarque, {
        foreignKey: "marqueId",
        as: "tickets", // Alias pour les tickets liés à la marque
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  Marque.init(
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
        unique: true, // Le nom de la marque doit être unique
        validate: {
          notEmpty: true, // Ne peut pas être vide
          len: [3, 50], // Entre 3 et 50 caractères
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // L'email doit être unique
        validate: {
          isEmail: true, // Doit être un email valide
        },
      },
      mdp: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [8, 255], // Longueur minimale de 8 caractères
        },
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true, // Facultatif
      },
      offres: {
        type: DataTypes.ENUM("freemium", "start", "start pro", "premium"),
        defaultValue: "freemium", // Valeur par défaut
        validate: {
          isIn: [["freemium", "start", "start pro", "premium"]], // Liste des valeurs possibles
        },
      },
    },
    {
      sequelize,
      modelName: "Marque",
      indexes: [
        {
          fields: ["email"], // Ajout d'un index unique sur l'email pour améliorer les performances
          unique: true,
        },
        {
          fields: ["name"], // Ajout d'un index unique sur le nom
          unique: true,
        },
      ],
    }
  );

  return Marque;
};
