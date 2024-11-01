// Imports
let express = require('express');
let cors = require('cors')
const corsOption = require('./funcs/functions')
let usersCtrl = require('./routes/usersCtrl');
let ticketCtrl = require('./routes/ticketsCtrl');
let alertCtrl = require('./routes/reportingCtrl');

// Router
exports.router = (function() {
    let apiRouter = express.Router();

    // 1-a Users routes
    apiRouter.route('/user/register', cors(corsOption.corsOptionsDelegate)).post(usersCtrl.register);
    apiRouter.route('/user/login', cors(corsOption.corsOptionsDelegate)).post(usersCtrl.login);
    apiRouter.route('/user/me', cors(corsOption.corsOptionsDelegate)).get(usersCtrl.getUserProfile);
    apiRouter.route('/user/me', cors(corsOption.corsOptionsDelegate)).put(usersCtrl.updateUserProfile);
    apiRouter.route('/user/pwd/me', cors(corsOption.corsOptionsDelegate)).put(usersCtrl.updateUserPassword);
    apiRouter.route('/user/mailValidation/:userId/', cors(corsOption.corsOptionsDelegate)).get(usersCtrl.confirmEmail);
    apiRouter.route('/user/forget', cors(corsOption.corsOptionsDelegate)).post(usersCtrl.forgotPassword);
    apiRouter.route('/user/resetpwd/:userId/:token', cors(corsOption.corsOptionsDelegate)).post(usersCtrl.resetPassword);
    apiRouter.route('/user/del/:email', cors(corsOption.corsOptionsDelegate)).delete(usersCtrl.destroyUserProfile);

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
    apiRouter.route('/user/alert/new', cors(corsOption.corsOptionsDelegate)).post(alertCtrl.createAlert);
    apiRouter.route('/user/admin/reports', cors(corsOption.corsOptionsDelegate)).get(alertCtrl.getAllReports);

    // 2- Tickets routes
    apiRouter.route('/ticket/:idReporting/new', cors(corsOption.corsOptionsDelegate)).post(ticketCtrl.createTicket);
    apiRouter.route('/ticket/create/', cors(corsOption.corsOptionsDelegate)).post(ticketCtrl.createTicketForUser);
    apiRouter.route('/ticket/:code', cors(corsOption.corsOptionsDelegate)).get(ticketCtrl.getTicketByCode);
    apiRouter.route('/user/tickets', cors(corsOption.corsOptionsDelegate)).get(ticketCtrl.getAllTicketsFromUser);
    apiRouter.route('/user/tickets/:store', cors(corsOption.corsOptionsDelegate)).get(ticketCtrl.getAllTicketsByStore);

    return apiRouter;
})();