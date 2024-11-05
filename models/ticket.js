'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.Ticket.belongsTo(models.Reporting, {
        foreignKey: "reportingId", // Utilisez uniquement le nom de la colonne
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    
      // Association avec le modèle TicketMarque
      models.Ticket.hasMany(models.TicketMarque);
    }
  };
  Ticket.init({
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    reportingId: DataTypes.UUID,
    email: DataTypes.STRING,
    marque: DataTypes.STRING,
    title: DataTypes.STRING,
    category: DataTypes.STRING,
    blocking: DataTypes.BOOLEAN,
    emojis: DataTypes.STRING,
    bugLocation: DataTypes.STRING,
    tips: DataTypes.STRING,
    response: DataTypes.STRING,
    ticketStatus: DataTypes.STRING,
    configuration: DataTypes.STRING,
    criticality: DataTypes.ENUM('mineur', 'majeur', 'critique')
  }, {
    sequelize,
    modelName: 'Ticket',
  });
  return Ticket;
};