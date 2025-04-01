"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class Reporting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      // Dans le modèle Reporting
      Reporting.belongsToMany(models.User, {
        through: "ReportingUsers", // Nom de la table de liaison
        foreignKey: "reportingId", // Clé étrangère vers Reporting
        otherKey: "userId", // Clé étrangère vers User
        as: "User", // Alias à utiliser pour récupérer les utilisateurs associés
      });

      // Association avec le modèle Ticket
      models.Reporting.hasMany(models.Ticket);

      Reporting.belongsToMany(models.Category, {
        through: "ReportingCategories",
        foreignKey: "reportingId",
        as: "categoriesRelations",
      });

      Reporting.hasMany(models.ReportingDescription, {
        foreignKey: "reportingId",
        as: "descriptions", // ✅ Cet alias doit être identique à celui utilisé dans `findSimilarReporting()`
        onDelete: "CASCADE",
      });
      Reporting.belongsTo(models.SiteMetadata, {
        foreignKey: "siteMetadataId",
        as: "siteMetadata",
      });
      // Association avec SiteType
      Reporting.belongsTo(models.SiteType, {
        foreignKey: "siteTypeId",
        as: "siteType",
      });
      Reporting.hasMany(models.Comment, {
        foreignKey: "reportId",
        as: "comments",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
    }
  }
  Reporting.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      userId: DataTypes.UUID,
      siteMetadataId: {
        type: DataTypes.UUID,
        allowNull: true, // Peut être null pour les anciens signalements
        references: {
          model: "SiteMetadata",
          key: "id",
        },
      },
      siteUrl: DataTypes.STRING,
      domain: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      categories: {
        type: DataTypes.JSON, // ou ARRAY si Postgres
        allowNull: true,
      },
      marque: DataTypes.STRING,
      bugLocation: DataTypes.STRING,
      emojis: DataTypes.STRING,
      description: DataTypes.TEXT("long"),
      reactions: {
        type: DataTypes.JSON, // ✅ Tableau d'objets { emoji: "🔥", count: 10 }
        allowNull: false,
        defaultValue: [], // ✅ Commence vide
      },
      blocking: DataTypes.BOOLEAN,
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending", // Initialisation du statut
      },
      capture: DataTypes.STRING,
      tips: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Reporting",
      tableName: "Reportings",
    },
    {
      indexes: [
        {
          fields: ["siteUrl", "bugLocation", "description"], // Colonnes de l'index
          name: "idx_reportings_search", // Nom de l'index
          using: "BTREE", // Type d'index
        },
      ],
    }
  );
  return Reporting;
};
