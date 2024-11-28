'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Création de la table Categories
    await queryInterface.createTable('Categories', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4, // Génère automatiquement un UUID
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false, // Le nom est obligatoire
        unique: true, // Empêche les doublons
      },
      siteTypeId: {
        type: Sequelize.UUID,
        allowNull: true, // Peut être null si la relation est optionnelle
        references: {
          model: 'SiteTypes', // Associe au modèle SiteTypes
          key: 'id',
        },
        onUpdate: 'CASCADE', // Met à jour la relation si l'ID change
        onDelete: 'SET NULL', // Définit `siteTypeId` à NULL si le SiteType est supprimé
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // Valeur par défaut
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // Valeur par défaut
      },
    });

    // Ajout d'un index unique pour accélérer les recherches
    await queryInterface.addIndex('Categories', ['name'], {
      unique: true,
      name: 'unique_category_name',
    });
  },

  async down(queryInterface, Sequelize) {
    // Supprime d'abord l'index
    await queryInterface.removeIndex('Categories', 'unique_category_name');

    // Puis supprime la table
    await queryInterface.dropTable('Categories');
  },
};
