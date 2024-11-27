// Imports
let express = require('express');
let cors = require('cors')
const corsOption = require('./funcs/functions')
let usersCtrl = require('./routes/usersCtrl');
let ticketCtrl = require('./routes/ticketsCtrl');
let alertCtrl = require('./routes/reportingCtrl');
let suggesttionCtrl = require('./routes/suggestionCtrl');
let coupdecoeurCtrl = require('./routes/coupdecoeurCtrl'); 
let brandCtrl = require('./routes/brandCtrl');
let brandTicketCtrl = require('./routes/brandTicketCtrl');

// Router
exports.router = (function () {
    let apiRouter = express.Router();

    // 1-a Users routes
    apiRouter.route('/user/register', cors(corsOption.corsOptionsDelegate)).post(usersCtrl.register);
    //apiRouter.route('/user/login', cors(corsOption.corsOptionsDelegate)).post(usersCtrl.login);
    apiRouter
    .route('/user/login')
    .options((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*'); // Permet toutes les origines
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Méthodes autorisées
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Headers autorisés
        res.status(200).end(); // Répondre avec un statut 200 pour OPTIONS
    })
    .post((req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*'); // Permet toutes les origines
        usersCtrl.login(req, res); // Gestion POST
    });
    apiRouter.route('/user/me', cors(corsOption.corsOptionsDelegate)).get(usersCtrl.getUserProfile);
    apiRouter.route('/user/me', cors(corsOption.corsOptionsDelegate)).put(usersCtrl.updateUserProfile);
    apiRouter.route('/user/pwd/me', cors(corsOption.corsOptionsDelegate)).put(usersCtrl.updateUserPassword);
    apiRouter.route('/user/mailValidation/:userId/', cors(corsOption.corsOptionsDelegate)).get(usersCtrl.confirmEmail);
    apiRouter.route('/user/forget', cors(corsOption.corsOptionsDelegate)).post(usersCtrl.forgotPassword);
    apiRouter.route('/user/resetpwd/:userId/:token', cors(corsOption.corsOptionsDelegate)).post(usersCtrl.resetPassword);
    apiRouter.route('/user/del/:email', cors(corsOption.corsOptionsDelegate)).delete(usersCtrl.destroyUserProfile);

    // Espace Marque
    apiRouter.route('/brand/login', cors(corsOption.corsOptionsDelegate)).post(brandCtrl.BrandLogin);
    apiRouter.route('/brand/:idticket/response', cors(corsOption.corsOptionsDelegate)).post(brandTicketCtrl.createBrandTicket);

    /* ONLY FOR TEST */
    apiRouter.route('/user/test/validate/:email', cors(corsOption.corsOptionsDelegate)).get(usersCtrl.validateEmailforTest);

    // 1-b Users routes('/admin/')
    apiRouter.route('/user/admin/:email', cors(corsOption.corsOptionsDelegate)).put(usersCtrl.updateUserProfileByAdmin);
    apiRouter.route('/admin/brand/new', cors(corsOption.corsOptionsDelegate)).post(usersCtrl.createBrandNew);
    apiRouter.route('/user/admin/employe/:email', cors(corsOption.corsOptionsDelegate)).put(usersCtrl.updateUserProfileEmployeByAdmin);
    apiRouter.route('/user/admin/:email', cors(corsOption.corsOptionsDelegate)).delete(usersCtrl.destroyUserProfileByAdmin);
    apiRouter.route('/user/admin/:email', cors(corsOption.corsOptionsDelegate)).delete(usersCtrl.destroyUserProfileByAdmin);
    apiRouter.route('/admin/users/', cors(corsOption.corsOptionsDelegate)).get(usersCtrl.listUsers);

    // signalement
    //apiRouter.route('/user/alert/new', cors(corsOption.corsOptionsDelegate)).post(alertCtrl.createAlert);
    // Exemple d'une route utilisateur avec OPTIONS et POST
    apiRouter
        .route('/user/alert/new')
        .options((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*'); // Permet toutes les origines
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Méthodes autorisées
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Headers autorisés
            res.status(200).end(); // Répondre avec un statut 200 pour OPTIONS
        })
        .post((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*'); // Permet toutes les origines
            alertCtrl.createAlert(req, res); // Gestion POST
        });
        apiRouter
        .route('/user/update-category')
        .options((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*'); // Permet toutes les origines
            res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS'); // Méthodes autorisées
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Headers autorisés
            res.status(200).end(); // Répondre avec un statut 200 pour OPTIONS
        })
        .put((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*'); // Permet toutes les origines
            alertCtrl.updateAlert(req, res); // Gestion POST
        });

        /* Create suggestion */
        apiRouter
        .route('/user/suggestion/new')
        .options((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*'); // Permet toutes les origines
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Méthodes autorisées
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Headers autorisés
            res.status(200).end(); // Répondre avec un statut 200 pour OPTIONS
        })
        .post((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*'); // Permet toutes les origines
            suggesttionCtrl.createSuggestion(req, res); // Gestion POST
        });

        /* Create coup de coeur */
        apiRouter
       .route('/user/coupdecoeur/new')
       .options((req, res) => {
           res.setHeader('Access-Control-Allow-Origin', '*'); // Permet toutes les origines
           res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Méthodes autorisées
           res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Headers autorisés
           res.status(200).end(); // Répondre avec un statut 200 pour OPTIONS
       })
       .post((req, res) => {
           res.setHeader('Access-Control-Allow-Origin', '*'); // Permet toutes les origines
           coupdecoeurCtrl.createCoupDeCoeur(req, res); // Gestion POST
       });

    apiRouter.route('/user/admin/reports', cors(corsOption.corsOptionsDelegate)).get(alertCtrl.getAllReports);
    // 2- Tickets routes
    apiRouter.route('/ticket/:idReporting/new', cors(corsOption.corsOptionsDelegate)).post(ticketCtrl.createTicket);
    apiRouter.route('/ticket/create/', cors(corsOption.corsOptionsDelegate)).post(ticketCtrl.createTicketForUser);
    apiRouter.route('/ticket/:code', cors(corsOption.corsOptionsDelegate)).get(ticketCtrl.getTicketByCode);
    apiRouter.route('/user/tickets', cors(corsOption.corsOptionsDelegate)).get(ticketCtrl.getAllTicketsFromUser);
    apiRouter.route('/user/tickets/:store', cors(corsOption.corsOptionsDelegate)).get(ticketCtrl.getAllTicketsByStore);

    return apiRouter;
})();