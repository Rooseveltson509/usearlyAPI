"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Associations avec alias et clés étrangères explicites
      User.hasMany(models.Marque, {
        foreignKey: "userId", // Clé étrangère dans Marque
        as: "marques", // Alias pour accéder aux Marques
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      User.hasMany(models.Reporting, {
        foreignKey: "userId", // Clé étrangère dans Reporting
        as: "reportings", // Alias pour accéder aux Reportings
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      User.hasMany(models.CoupDeCoeur, {
        foreignKey: "userId", // Clé étrangère dans CoupDeCoeur
        as: "coupsDeCoeur", // Alias pour accéder aux Coups de Cœur
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      User.hasMany(models.Post, {
        foreignKey: "userId",
        as: "posts",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      User.hasMany(models.Suggestion, {
        foreignKey: "userId", // Clé étrangère dans Suggestion
        as: "suggestions", // Alias pour accéder aux Suggestions
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }

  User.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      gender: {
        type: DataTypes.ENUM("monsieur", "madame", "N/A"),
        allowNull: true,
        validate: {
          isIn: [["monsieur", "madame", "N/A"]],
        },
      },
      pseudo: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 50], // Pseudo entre 3 et 50 caractères
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true, // Valide les emails
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [8, 255], // Longueur minimale de 8 caractères
        },
      },
      born: {
        type: DataTypes.DATE,
        allowNull: true, // Facultatif
        validate: {
          isDate: true, // Valide les dates
        },
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true, // Facultatif
      },
      role: {
        type: DataTypes.ENUM("user", "admin"),
        defaultValue: "user",
        validate: {
          isIn: [["user", "admin"]],
        },
      },
      confirmationToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      confirmedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      resetToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expiredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rememberToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
    }
  );

  return User;
};
