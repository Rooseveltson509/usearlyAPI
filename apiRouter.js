// Imports
//let express = require('express');
import express from "express";
import cors from "cors";
//let cors = require('cors')
//const corsOption = require('./funcs/functions')
import {func} from "./funcs/functions.js";
/* let usersCtrl = require('./routes/usersCtrl');
let ticketCtrl = require('./routes/ticketsCtrl');
let alertCtrl = require('./routes/reportingCtrl');
let suggesttionCtrl = require('./routes/suggestionCtrl');
let coupdecoeurCtrl = require('./routes/coupdecoeurCtrl');
let brandCtrl = require('./routes/brandCtrl');
let brandTicketCtrl = require('./routes/brandTicketCtrl'); */

import {user} from './routes/usersCtrl.js';
import {ticket} from './routes/ticketsCtrl.js';
import {reporting} from './routes/reportingCtrl.js';
import {suggestion} from './routes/suggestionCtrl.js';
import {coupDeCoeur}from './routes/coupdecoeurCtrl.js';
//import brandCtrl from './routes/brandCtrl.js';
import {brandCtrl} from './routes/brandCtrl.js';
const brandCtrlMethods = brandCtrl.default || brandCtrl; // Permet de gérer les deux types d'exportations
import {createBrandTicket} from './routes/brandTicketCtrl.js';


// Définition de l'API Router
const apiRouter = express.Router();

    // 1-a Users routes
// Router
/* exports.router = (function () {
    let apiRouter = express.Router(); */

    apiRouter.get('/test-cors', (req, res) => {
        res.json({ message: "CORS is working properly!" });
      });
      

    // 1-a Users routes
    apiRouter.route('/user/register', cors(func.corsOptionsDelegate)).post(user.register);
    apiRouter.route('/user/login').post(user.login);
    apiRouter.route('/user/me', cors(func.corsOptionsDelegate)).get(user.getUserProfile);
    apiRouter.route('/user/me', cors(func.corsOptionsDelegate)).put(user.updateUserProfile);
    apiRouter.route('/user/pwd/me', cors(func.corsOptionsDelegate)).put(user.updateUserPassword);
    apiRouter.route('/user/mailValidation/:userId/', cors(func.corsOptionsDelegate)).get(user.confirmEmail);
    apiRouter.route('/user/forget', cors(func.corsOptionsDelegate)).post(user.forgotPassword);
    apiRouter.route('/user/resetpwd/:userId/:token', cors(func.corsOptionsDelegate)).post(user.resetPassword);
    apiRouter.route('/user/del/:email', cors(func.corsOptionsDelegate)).delete(user.destroyUserProfile);

    // Espace Marque
    apiRouter.route('/brand/login', cors(func.corsOptionsDelegate)).post(brandCtrlMethods.login);
    apiRouter.route('/brand/:idticket/response', cors(func.corsOptionsDelegate)).post(createBrandTicket.createTicket);

    // 1-b Users routes('/admin/')
    apiRouter.route('/user/admin/:email', cors(func.corsOptionsDelegate)).put(user.updateUserProfileByAdmin);
    apiRouter.route('/admin/brand/new', cors(func.corsOptionsDelegate)).post(user.createBrandNew);
    apiRouter.route('/user/admin/:email', cors(func.corsOptionsDelegate)).delete(user.destroyUserProfileByAdmin);
    apiRouter.route('/admin/users/', cors(func.corsOptionsDelegate)).get(user.listUsers);

    // signalement
    apiRouter.route('/user/alert/new').post(reporting.createAlert);
    /* update category */
    apiRouter.route('/user/update-category').put(reporting.updateAlert);

    /* Create suggestion */
    apiRouter.route('/user/suggestion/new', cors(func.corsOptionsDelegate)).post(suggestion.create);

    /* Create coup de coeur */
    apiRouter.route('/user/coupdecoeur/new', cors(func.corsOptionsDelegate)).post(coupDeCoeur.createCoupdeCoeur);

    apiRouter.route('/user/admin/reports', cors(func.corsOptionsDelegate)).get(reporting.getAllReports);
    // 2- Tickets routes
    apiRouter.route('/ticket/:idReporting/new', cors(func.corsOptionsDelegate)).post(ticket.create);

/*     return apiRouter;
})(); */

export default apiRouter;