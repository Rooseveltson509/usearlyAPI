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
      models.Ticket.belongsTo(models.User, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'CASCADE',
    })
    }
  };
  Ticket.init({  
    date: DataTypes.DATE,
    reporting: DataTypes.INTEGER,
    adminId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    marque: DataTypes.STRING,
    title: DataTypes.STRING,
    category: DataTypes.STRING,
    blocking: DataTypes.BOOLEAN,
    criticality: DataTypes.ENUM('mineur', 'majeur', 'critique'),
    bugLocation: DataTypes.STRING,
    emojis: DataTypes.STRING,
    configuration: DataTypes.STRING,
    tips: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Ticket',
  });
  return Ticket;
};