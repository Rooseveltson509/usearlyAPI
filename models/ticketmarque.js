'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TicketMarque extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.TicketMarque.belongsTo(models.Ticket, {
        foreignKey: {
          foreignKey: "ticketId",

        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      models.TicketMarque.belongsTo(models.Marque, {
        foreignKey: {
          foreignKey: "marqueId",

        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
  }
  TicketMarque.init({
    ticketId: DataTypes.UUID,
    title: DataTypes.STRING,
    marqueId: DataTypes.UUID,
    description: DataTypes.STRING,
    ticketStatus: DataTypes.ENUM('sent', 'in progress', 'fixed')
  }, {
    sequelize,
    modelName: 'TicketMarque',
  });
  return TicketMarque;
};