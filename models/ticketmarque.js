"use strict";
import { Model } from "sequelize";
export default (sequelize, DataTypes) => {
  class TicketMarque extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.TicketMarque.belongsTo(models.Ticket, {
        foreignKey: "ticketId", // Utilisez uniquement le nom de la colonne
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });

      // Association avec le modèle Marque
      models.TicketMarque.belongsTo(models.Marque, {
        foreignKey: "marqueId", // Utilisez uniquement le nom de la colonne
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      });
      //models.TicketMarque.belongsTo(models.Ticket);
    }
  }
  TicketMarque.init(
    {
      ticketId: DataTypes.UUID,
      marqueId: DataTypes.UUID,
      title: DataTypes.STRING,
      description: DataTypes.TEXT("long"),
      ticketStatus: DataTypes.ENUM("sent", "in progress", "fixed"),
    },
    {
      sequelize,
      modelName: "TicketMarque",
    }
  );
  return TicketMarque;
};
