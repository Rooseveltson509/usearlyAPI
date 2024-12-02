'use strict';
/** @type {import('sequelize-cli').Migration} */
  export async function up(queryInterface, Sequelize) {
    await queryInterface.createTable('Reportings', {
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
        index: true // Ajout d'un index pour optimiser les requêtes
      },
/*       siteTypeId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'SiteTypes',
          key: 'id',
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      }, */
      siteUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isUrl: true,
        },
      },
      marque: {
        allowNull: false,
        type: Sequelize.STRING
      },
      bugLocation: {
        allowNull: false,
        type: Sequelize.STRING
      },
      emojis: {
        allowNull: false,
        type: Sequelize.STRING
      },
      description: {
        allowNull: false,
        type: Sequelize.STRING
      },
      blocking: {
        type: Sequelize.ENUM,
        values: [
          'yes',
          'no'
        ],
        defaultValue: 'no'
      },
      hooks: {
        beforeValidate: (instance) => {
          if (instance.blocking !== 'yes' && instance.blocking !== 'no') {
            throw new Error('Invalid value for blocking. Accepted values are "yes" or "no".');
          }
        },
      },
      tips: {
        allowNull: true,
        type: Sequelize.STRING
      },
      capture: {
        allowNull: false,
        type: Sequelize.STRING
      },
      /*       category: {
              type: Sequelize.ENUM,
              values: [
                'cat1', 'cat2', 'cat3', 'autre'
              ],
              defaultValue: 'autre'
            }, */
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
    await queryInterface.removeColumn('Reportings', 'siteTypeId');
  }