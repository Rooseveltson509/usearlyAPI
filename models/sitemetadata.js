"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class SiteMetadata extends Model {
    static associate(models) {
      // Relation avec `Reporting`
      SiteMetadata.hasMany(models.Reporting, {
        foreignKey: "siteMetadataId",
        as: "reportings",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // ✅ 🔥 Correction : Renommage de l'association pour éviter le conflit
      SiteMetadata.belongsTo(models.SiteType, {
        foreignKey: "siteTypeId",
        as: "siteTypeRelation", // ✅ Renommé pour éviter le conflit avec la colonne `siteType`
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      });
    }
  }

  SiteMetadata.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      siteUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isUrl: true,
        },
      },
      siteType: {
        type: DataTypes.STRING, // ✅ Ajout du champ siteType pour stocker le nom du type de site
        allowNull: false, // 🔥 Important pour éviter l'erreur SQL
      },
      siteTypeId: {
        type: DataTypes.UUID,
        allowNull: true, // Peut être NULL au départ, mais sera défini après analyse
        references: {
          model: "SiteTypes",
          key: "id",
        },
      },
      categories: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "SiteMetadata",
      tableName: "SiteMetadata",
    }
  );

  return SiteMetadata;
};
