'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Récupérer les IDs des SiteTypes existants
    const siteTypes = await queryInterface.sequelize.query(
      'SELECT id, name FROM "SiteTypes";',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Vérifiez les données récupérées
    if (!siteTypes || siteTypes.length === 0) {
      throw new Error('Aucun SiteType trouvé. Vérifiez que la table SiteTypes est peuplée.');
    }

    const siteTypeMap = siteTypes.reduce((acc, siteType) => {
      acc[siteType.name] = siteType.id;
      return acc;
    }, {});

    console.log('Mapping SiteTypes :', siteTypeMap); // Debugging

    // Insérer les catégories dans la table `Categories`
    const categories = [
      // Catégories pour E-commerce
      { id: uuidv4(), name: 'Mode', siteTypeId: siteTypeMap['E-commerce'], createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), name: 'Électronique', siteTypeId: siteTypeMap['E-commerce'], createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), name: 'Maison', siteTypeId: siteTypeMap['E-commerce'], createdAt: new Date(), updatedAt: new Date() },

      // Catégories pour Blog
      { id: uuidv4(), name: 'Lifestyle', siteTypeId: siteTypeMap['Blog'], createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), name: 'Voyages', siteTypeId: siteTypeMap['Blog'], createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), name: 'Technologie', siteTypeId: siteTypeMap['Blog'], createdAt: new Date(), updatedAt: new Date() },

      // Catégories pour Forum
      { id: uuidv4(), name: 'Discussions générales', siteTypeId: siteTypeMap['Forum'], createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), name: 'Gaming', siteTypeId: siteTypeMap['Forum'], createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), name: 'Aide', siteTypeId: siteTypeMap['Forum'], createdAt: new Date(), updatedAt: new Date() },

      // Catégories pour SaaS
      { id: uuidv4(), name: 'CRM', siteTypeId: siteTypeMap['SaaS'], createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), name: 'Gestion de projet', siteTypeId: siteTypeMap['SaaS'], createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), name: 'Analyse de données', siteTypeId: siteTypeMap['SaaS'], createdAt: new Date(), updatedAt: new Date() },
    ];

    // Vérifiez les catégories avant l'insertion
    console.log('Catégories à insérer :', categories);

    await queryInterface.bulkInsert('Categories', categories);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Categories', null, {});
  }
};