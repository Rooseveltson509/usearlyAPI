'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ReportingCategories', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      reportingId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Reportings',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      categoryId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Categories',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    // Ajout de la contrainte d'unicité composite
    await queryInterface.addConstraint('ReportingCategories', {
      fields: ['reportingId', 'categoryId'],
      type: 'unique',
      name: 'unique_reporting_category',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('ReportingCategories', 'unique_reporting_category');
    await queryInterface.dropTable('ReportingCategories');
  },
};