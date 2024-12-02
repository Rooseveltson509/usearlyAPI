'use strict';
/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('SiteTypes', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4, // Génère un UUID automatiquement
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
        unique: true, // Ajout de l'unicité directement dans la définition du champ
      },
      description: {
        allowNull: true, // Permet un champ optionnel
        type: Sequelize.TEXT, // Utilisé pour des descriptions longues
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'), // Valeur par défaut pour la création
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'), // Valeur mise à jour automatiquement
      },
    });

    // Ajout d'un index unique explicite (optionnel si `unique: true` suffit)
    await queryInterface.addIndex('SiteTypes', ['name'], {
      unique: true,
      name: 'unique_siteType_name',
    });
  }

  export async function down(queryInterface, Sequelize) {
    await queryInterface.dropTable('SiteTypes');
    await queryInterface.removeIndex('SiteTypes', 'unique_siteType_name');


  }