'use strict';

const { toDefaultValue } = require("sequelize/lib/utils");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Marques', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      userId: {
        allowNull: false,
        type: Sequelize.UUID,
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
        references: {
          model: 'Users',
          key: 'id'
        },
        index: true // Ajout index
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING
      },
      email: {
        allowNull: false,
        type: Sequelize.STRING,
        unique: true // Ajout de l'unicité pour garantir qu'un email ne soit pas dupliqué

      },
      mdp: {
        allowNull: false,
        type: Sequelize.STRING
      },
      offres: {
        type: Sequelize.ENUM,
        values: [
          'freemium',
          'start',
          'start pro',
          'premium'
        ],
        defaultValue: 'freemium'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Marques');
  }
};