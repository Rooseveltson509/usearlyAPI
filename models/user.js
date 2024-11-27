'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.User.hasMany(models.Marque); // Association correcte
      models.User.hasMany(models.Reporting); // Association correcte

      User.associate = (models) => {
        Users.hasMany(models.CoupDeCoeur, {
          foreignKey: 'userId',
          as: 'coupsDeCoeur',
          onDelete: 'CASCADE',
        });
      
        User.hasMany(models.Suggestion, {
          foreignKey: 'userId',
          as: 'suggestions',
          onDelete: 'CASCADE',
        });
      };
      

    }
  };
  User.init({
    id: {
      allowNull: false,
      primaryKey: true,
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4
    },
    gender: DataTypes.ENUM('monsieur', 'madame', 'N/A'),
    pseudo: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    born: DataTypes.DATE,
    role: DataTypes.ENUM('user', 'admin'),
    confirmationToken: DataTypes.STRING,
    confirmedAt: DataTypes.DATE,
    resetToken: DataTypes.STRING,
    resetAt: DataTypes.DATE,
    expiredAt: DataTypes.DATE,
    rememberToken: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};