'use strict';
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('Suggestions', {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      userId: {
        type: Sequelize.UUID,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      marque: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      emplacement: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      nbrLikes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: true,
      },
      nbrDislikes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: true,
      },
      validated: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
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
  }
  export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Suggestions');
  }