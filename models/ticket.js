"use strict";
import { Model } from "sequelize";

export default (sequelize, DataTypes) => {
  class Ticket extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Association avec Reporting
      models.Ticket.belongsTo(models.Reporting, {
        foreignKey: "reportingId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Association avec TicketMarque
      models.Ticket.hasMany(models.TicketMarque);
    }
  }

  Ticket.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
      },
      // La colonne reportingId sera générée automatiquement par Sequelize grâce à l'association belongsTo
      email: {
        type: DataTypes.STRING,
        validate: {
          isEmail: true,
        },
      },
      marque: DataTypes.STRING,
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      blocking: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      emojis: DataTypes.STRING,
      bugLocation: DataTypes.STRING,
      tips: DataTypes.TEXT,
      response: DataTypes.TEXT,
      ticketStatus: {
        type: DataTypes.ENUM("open", "in_progress", "resolved", "closed"),
        defaultValue: "open",
      },
      configuration: DataTypes.TEXT,
      criticality: {
        type: DataTypes.ENUM("mineur", "majeur", "critique"),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Ticket",
    }
  );

  return Ticket;
};
