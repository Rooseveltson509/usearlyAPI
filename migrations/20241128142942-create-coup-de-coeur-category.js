'use strict';
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('CoupDeCoeurCategories', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      coupDeCoeurId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { 
          model: 'CoupDeCoeurs', // Nom de la table liée
          key: 'id',
        },
        onUpdate: 'CASCADE', // Action lors d'une mise à jour
        onDelete: 'CASCADE', // Action lors d'une suppression
      },
      categoryId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { 
          model: 'Categories', // Nom de la table liée
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  }

  export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CoupDeCoeurCategories');
  }
