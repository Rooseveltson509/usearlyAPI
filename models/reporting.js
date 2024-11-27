'use strict';
const { foreign_key } = require('i/lib/methods');
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
        foreignKey: "userId", // Utilisez simplement le nom de la colonne
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });

      // Association avec le modèle Ticket
      models.Reporting.hasMany(models.Ticket);

    }
  };
  Reporting.init({
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    userId: DataTypes.UUID,
    marque: DataTypes.STRING,
    bugLocation: DataTypes.STRING,
    emojis: DataTypes.STRING,
    description: DataTypes.STRING,
    blocking: DataTypes.BOOLEAN,
    capture: DataTypes.STRING,
    tips: DataTypes.STRING,
    category: {
      type: DataTypes.ENUM('cat1', 'cat2', 'cat3', 'autre'),
      allowNull: true,
      defaultValue: 'autre',
    }
  }, {
    sequelize,
    modelName: 'Reporting',
  });
  return Reporting;
};