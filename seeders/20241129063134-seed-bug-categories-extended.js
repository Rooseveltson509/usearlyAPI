'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Récupérer les IDs des SiteTypes existants
    const siteTypes = await queryInterface.sequelize.query(
      'SELECT id, name FROM SiteTypes;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (!siteTypes || siteTypes.length === 0) {
      throw new Error('Aucun SiteType trouvé. Assurez-vous que la table SiteTypes est peuplée.');
    }

    const siteTypeMap = siteTypes.reduce((acc, siteType) => {
      acc[siteType.name] = siteType.id;
      return acc;
    }, {});

    // Liste complète des catégories de bugs par type de site
    const bugCategories = [
      // E-commerce
      { name: 'Problème de paiement', siteTypeId: siteTypeMap['E-commerce'] },
      { name: 'Erreur sur le panier', siteTypeId: siteTypeMap['E-commerce'] },
      { name: 'Connexion utilisateur impossible', siteTypeId: siteTypeMap['E-commerce'] },
      { name: 'Recherche de produits défaillante', siteTypeId: siteTypeMap['E-commerce'] },
      { name: 'Problème d’affichage des produits', siteTypeId: siteTypeMap['E-commerce'] },
      { name: 'Erreurs lors de l’ajout au panier', siteTypeId: siteTypeMap['E-commerce'] },
      { name: 'Bug sur les filtres de produits', siteTypeId: siteTypeMap['E-commerce'] },
      { name: 'Problème avec les coupons ou réductions', siteTypeId: siteTypeMap['E-commerce'] },
      { name: 'Déconnexion intempestive', siteTypeId: siteTypeMap['E-commerce'] },
      { name: 'Temps de chargement élevé', siteTypeId: siteTypeMap['E-commerce'] },

      // Blog
      { name: 'Erreur d’affichage des articles', siteTypeId: siteTypeMap['Blog'] },
      { name: 'Problème de publication de commentaire', siteTypeId: siteTypeMap['Blog'] },
      { name: 'Erreur d’intégration de média', siteTypeId: siteTypeMap['Blog'] },
      { name: 'Mauvaise gestion des balises SEO', siteTypeId: siteTypeMap['Blog'] },
      { name: 'Problème avec la pagination', siteTypeId: siteTypeMap['Blog'] },
      { name: 'Liens internes brisés', siteTypeId: siteTypeMap['Blog'] },
      { name: 'Images non optimisées', siteTypeId: siteTypeMap['Blog'] },
      { name: 'Temps de chargement élevé', siteTypeId: siteTypeMap['Blog'] },

      // Forum
      { name: 'Connexion impossible', siteTypeId: siteTypeMap['Forum'] },
      { name: 'Erreur lors de la réponse à un sujet', siteTypeId: siteTypeMap['Forum'] },
      { name: 'Bug sur le moteur de recherche', siteTypeId: siteTypeMap['Forum'] },
      { name: 'Problème de modération', siteTypeId: siteTypeMap['Forum'] },
      { name: 'Notification non reçue', siteTypeId: siteTypeMap['Forum'] },
      { name: 'Erreurs dans la gestion des profils', siteTypeId: siteTypeMap['Forum'] },

      // SaaS
      { name: 'Problème d’intégration API', siteTypeId: siteTypeMap['SaaS'] },
      { name: 'Erreur dans les workflows', siteTypeId: siteTypeMap['SaaS'] },
      { name: 'Bug sur le tableau de bord', siteTypeId: siteTypeMap['SaaS'] },
      { name: 'Problème de connexion SSO', siteTypeId: siteTypeMap['SaaS'] },
      { name: 'Erreur de calcul dans les rapports', siteTypeId: siteTypeMap['SaaS'] },
      { name: 'Instabilité du serveur', siteTypeId: siteTypeMap['SaaS'] },

      // Portfolio
      { name: 'Erreur d’affichage des projets', siteTypeId: siteTypeMap['Portfolio'] },
      { name: 'Problème avec le formulaire de contact', siteTypeId: siteTypeMap['Portfolio'] },
      { name: 'Mauvaise mise en page', siteTypeId: siteTypeMap['Portfolio'] },
      { name: 'Images floues ou déformées', siteTypeId: siteTypeMap['Portfolio'] },
      { name: 'Temps de chargement élevé', siteTypeId: siteTypeMap['Portfolio'] },
      { name: 'Erreur dans les transitions animées', siteTypeId: siteTypeMap['Portfolio'] },

      // Éducationnel
      { name: 'Problème avec les quiz ou tests', siteTypeId: siteTypeMap['Éducatif'] },
      { name: 'Erreur d’inscription', siteTypeId: siteTypeMap['Éducatif'] },
      { name: 'Cours non accessible', siteTypeId: siteTypeMap['Éducatif'] },
      { name: 'Problème avec les vidéos éducatives', siteTypeId: siteTypeMap['Éducatif'] },
      { name: 'Données des étudiants mal affichées', siteTypeId: siteTypeMap['Éducatif'] },
    ];

    // Ajouter les dates de création et d'UUID à chaque catégorie
    const bugCategoryRecords = bugCategories.map(category => ({
      id: uuidv4(),
      ...category,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Insérer les catégories dans la table `BugCategories`
    await queryInterface.bulkInsert('BugCategories', bugCategoryRecords);
  },

  async down(queryInterface, Sequelize) {
    // Supprimer toutes les données de BugCategories
    await queryInterface.bulkDelete('BugCategories', null, {});
  },
};