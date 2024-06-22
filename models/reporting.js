'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Reporting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.Reporting.belongsTo(models.User, {
        foreignKey: {
            allowNull: true
        },
        onDelete: 'CASCADE',
    })
    }
  };
  Reporting.init({
    userId: DataTypes.STRING,
    marque: DataTypes.STRING,
    bugLocation: DataTypes.STRING,
    emojis: DataTypes.STRING,
    description: DataTypes.STRING,
    blocking: DataTypes.BOOLEAN,
    tips: DataTypes.STRING,
    date: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Reporting',
  });
  return Reporting;
};