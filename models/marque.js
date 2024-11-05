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
      models.Marque.belongsTo(models.User, {
        foreignKey: "userId", // Utilisez simplement le nom de la colonne
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
      // Association avec le modèle TicketMarque
      models.Marque.hasMany(models.TicketMarque);
    }
  };
  Marque.init({
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    userId: DataTypes.UUID,
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    mdp: DataTypes.STRING,
    offres: DataTypes.ENUM('freemium', 'start', 'start pro', 'premium')
  }, {
    sequelize,
    modelName: 'Marque',
  });
  return Marque;
};