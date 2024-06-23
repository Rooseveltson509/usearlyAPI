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
        models.User.hasMany(models.Ticket)
        
    }
  };
  User.init({
    gender: DataTypes.ENUM('monsieur', 'madame'),
    pseudo: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    born: DataTypes.STRING,
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