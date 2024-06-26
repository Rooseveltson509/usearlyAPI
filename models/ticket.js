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
     /*  models.Ticket.belongsTo(models.User, {
        foreignKey: {
            allowNull: false,
            name: 'userId'
        },
        onDelete: 'CASCADE',
    }) */
    }
  };
  Ticket.init({
    idREPORTINGS: DataTypes.INTEGER,
    adminId: DataTypes.INTEGER,
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