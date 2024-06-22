'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      gender: {
        type: Sequelize.ENUM,
        values: [
          'monsieur',
          'madame'
        ]
      },
      pseudo: {
        allowNull: false,
        type: Sequelize.STRING
      },
      email: {
        allowNull: false,
        type: Sequelize.STRING
      },
      password: {
        allowNull: false,
        type: Sequelize.STRING
      },
      role: {
        type: Sequelize.ENUM,
        values: [
          'user',
          'admin'
        ],
        defaultValue: 'user'
      },
      born: {
        type: Sequelize.DATE
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      confirmationToken: {
          allowNull: true,
          type: Sequelize.STRING
      },
      confirmedAt: {
          allowNull: true,
          type: Sequelize.DATE
      },
      resetToken: {
          allowNull: true,
          type: Sequelize.STRING
      },
      resetAt: {
          allowNull: true,
          type: Sequelize.DATE
      },
      expiredAt: {
          allowNull: true,
          type: Sequelize.DATE
      },
      rememberToken: {
          allowNull: true,
          type: Sequelize.STRING
      },
      optin: { 
        type: Sequelize.ENUM,
        values: [
          'yes',
          'no'
        ],
        defaultValue: 'no'
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};