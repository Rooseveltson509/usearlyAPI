'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Effacez les données existantes pour éviter des conflits
    await queryInterface.bulkDelete('`SiteTypes`', null, {}); // Ajout des backticks

    await queryInterface.bulkInsert('`SiteTypes`', [
      {
        id: uuidv4(), // Correctement en utilisant uuidv4()
        name: 'E-commerce',
        description: 'Sites de commerce en ligne.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Vitrine',
        description: 'Sites mettant en avant une entreprise ou un produit.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Blog',
        description: 'Sites de partage de contenu ou d’expériences personnelles.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Media',
        description: 'Sites de diffusion de contenu (vidéo, audio, actualités).',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Forum',
        description: 'Sites permettant des discussions communautaires.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'SaaS',
        description: 'Sites fournissant des services logiciels.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Portfolio',
        description: 'Sites pour présenter un portfolio ou un CV.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Institutionnel',
        description: 'Sites gouvernementaux ou institutionnels.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Éducatif',
        description: 'Sites pour l’apprentissage ou la formation.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Jeux',
        description: 'Sites de jeux ou de divertissement interactif.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('`SiteTypes`', null, {}); // Ajout des backticks
  },
};
