'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Marque extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.Marque.hasMany(models.Ticket)
    }
  };
  Marque.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    mdp: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Marque',
  });
  return Marque;
};