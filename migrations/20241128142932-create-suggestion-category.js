'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SuggestionCategories', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      suggestionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Suggestions', // Le nom exact de la table cible
          key: 'id', // Clé primaire de la table cible
        },
        onDelete: 'CASCADE', // Supprime les enregistrements associés si la suggestion est supprimée
        onUpdate: 'CASCADE', // Met à jour les enregistrements associés si l'id est modifié
      },
      categoryId: {
        type: Sequelize.UUID,
        allowNull: false, // Assurez-vous que la catégorie est toujours renseignée
        references: {
          model: 'Categories', // Le nom exact de la table cible
          key: 'id', // Clé primaire de la table cible
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SuggestionCategories');
  },
};