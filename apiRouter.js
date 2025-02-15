// Imports
import express from "express";
import cors from "cors";
import { func } from "./funcs/functions.js";

import { user } from "./routes/usersCtrl.js";
import { ticket } from "./routes/ticketsCtrl.js";
import { reporting } from "./routes/reportingCtrl.js";
import { suggestion } from "./routes/suggestionCtrl.js";
import { coupDeCoeur } from "./routes/coupdecoeurCtrl.js";
import { adminAction } from "./routes/adminCtrl.js";
import { brandCtrl } from "./routes/brandCtrl.js";
import { posts } from "./routes/postCtrl.js";
import { comment } from "./routes/commentCtrl.js";
//const brandCtrlMethods = brandCtrl.default || brandCtrl; // Permet de gérer les deux types d'exportations
import { createBrandTicket } from "./routes/brandTicketCtrl.js";
import {
  validateCoupdeCoeur,
  validateReport,
  validateSuggest,
} from "./middleware/validateReport.js";
import rateLimit from "express-rate-limit";
import upload from "./config/multer.js";
import { isAdmin } from "./middleware/auth.js";

const refreshTokenLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limite à 10 requêtes par fenêtre
  message:
    "Trop de requêtes de rafraîchissement de token, veuillez réessayer plus tard.",
  headers: true, // Renvoie des en-têtes d'information sur le taux
});

// Définition de l'API Router
const apiRouter = express.Router();

// Configuration CORS pour autoriser toutes les origines
const permissiveCors = {
  origin: true, // Autoriser toutes les origines
  methods: ["POST", "GET"], // Limiter aux méthodes nécessaires
  credentials: false, // Désactiver les cookies (optionnel)
};
// 1-a Users routes
apiRouter
  .route("/user/login")
  .options(cors(permissiveCors)) // Gérer les pré-requêtes OPTIONS
  .post(cors(permissiveCors), user.login);

// 2-b Users routes
apiRouter
  .route("/user/refresh-token")
  .options(cors(permissiveCors)) // Gérer les pré-requêtes OPTIONS
  .post(cors(permissiveCors), refreshTokenLimiter, user.refreshToken);

apiRouter
  .route("/user/verify")
  .options(cors(permissiveCors)) // Gérer les pré-requêtes OPTIONS
  .post(cors(permissiveCors), user.verifyToken);

apiRouter
  .route("/user/register", cors(func.corsOptionsDelegate))
  .post(user.register);

apiRouter
  .route("/user/me", cors(func.corsOptionsDelegate))
  .get(user.getUserProfile);

/* apiRouter
  .route("/user/me", cors(func.corsOptionsDelegate))
  .put(user.updateUserProfile); */
apiRouter
  .route("/user/me", cors(func.corsOptionsDelegate))
  .put(upload.single("avatar"), user.updateUserProfile); // Ajouter Multer comme middleware

apiRouter
  .route("/user/pwd/me", cors(func.corsOptionsDelegate))
  .put(user.updateUserPassword);
/* apiRouter
  .route("/user/mailValidation/:userId/", cors(func.corsOptionsDelegate))
  .get(user.confirmEmail); */
apiRouter
  .route("/user/mailValidation", cors(func.corsOptionsDelegate))
  .post(user.confirmEmail);

apiRouter
  .route("/user/forgot-password", cors(func.corsOptionsDelegate))
  .post(user.forgotPassword);

apiRouter
  .route("/user/resetpwd/:userId/:token", cors(func.corsOptionsDelegate))
  .post(user.resetPassword);

apiRouter
  .route("/user/del/:email", cors(func.corsOptionsDelegate))
  .delete(user.destroyUserProfile);

// Espace Marque
apiRouter
  .route("/brand/login", cors(func.corsOptionsDelegate))
  .post(brandCtrl.login);

apiRouter
  .route("/brand/profile", cors(func.corsOptionsDelegate))
  .get(brandCtrl.fetchBrandProfile);

apiRouter
  .route("/brand/:name", cors(func.corsOptionsDelegate))
  .get(brandCtrl.getBrandByName);

apiRouter
  .route("/brand/:idticket/response", cors(func.corsOptionsDelegate))
  .post(createBrandTicket.createTicket);

// 1-b Users routes('/admin/')
apiRouter
  .route("/admin/brand/new", cors(func.corsOptionsDelegate))
  .post(isAdmin, upload.single("avatar"), user.createBrandNew);

apiRouter
  .route("/admin/brand/all", cors(func.corsOptionsDelegate))
  .get(user.BrandList);

/* apiRouter
  .route("/admin/brand/update/:brandId", cors(func.corsOptionsDelegate))
  .put(isAdmin, upload.single("avatar"), user.updateBrand); */

apiRouter.put(
  "/admin/brand/update/:id",
  async (req, res, next) => {
    console.log("🔍 ID reçu dans la route API :", req.params.id);
    next();
  },
  isAdmin,
  upload.single("avatar"),
  user.updateBrand
);

apiRouter.route("/admin/brand/:id").delete(isAdmin, user.deleteBrand);

apiRouter
  .route("/user/admin/:email", cors(func.corsOptionsDelegate))
  .delete(user.destroyUserProfileByAdmin);
apiRouter
  .route("/admin/users/", cors(func.corsOptionsDelegate))
  .get(user.listUsers);
apiRouter
  .route("/user-admin/:email", cors(func.corsOptionsDelegate))
  .get(user.findByEmail);

// signalement
apiRouter
  .route("/user/alert/new")
  .options(cors(permissiveCors)) // Gérer les pré-requêtes OPTIONS
  .post(
    cors(permissiveCors),
    validateReport.validateReportFields,
    reporting.createReport
  );

/* Create suggestion */
apiRouter
  .route("/user/suggestion/new", cors(func.corsOptionsDelegate))
  .options(cors(permissiveCors)) // Gérer les pré-requêtes OPTIONS
  .post(
    cors(permissiveCors),
    validateSuggest.validateReportFields,
    suggestion.create
  );

/* Create coup de coeur */
apiRouter
  .route("/user/coupdecoeur/new", cors(func.corsOptionsDelegate))
  .options(cors(permissiveCors)) // Gérer les pré-requêtes OPTIONS
  .post(
    cors(permissiveCors),
    validateCoupdeCoeur.validateReportFields,
    coupDeCoeur.createCoupdeCoeur
  );

apiRouter
  .route("/user/reports", cors(func.corsOptionsDelegate))
  .get(reporting.getAllReports);

apiRouter
  .route("/user/coupsdecoeur", cors(func.corsOptionsDelegate))
  .get(coupDeCoeur.getAllCoupdeCoeur);
apiRouter
  .route("/user/suggestion", cors(func.corsOptionsDelegate))
  .get(suggestion.getAllSuggestions);

// Récupérer tous les posts
apiRouter.route("/user/posts").get(posts.getAllPosts);

// Récupérer un post spécifique
apiRouter.route("/posts/:id").get(posts.getPostById);

// Créer un post (avec authentification)
apiRouter
  .route("/user/post")
  .post(cors(func.corsOptionsDelegate), posts.createPost);

// Modifier un post
apiRouter
  .route("/user/posts/:id")
  .put(cors(func.corsOptionsDelegate), posts.updatePost);

// Supprimer un post
apiRouter
  .route("/user/posts/:id")
  .delete(cors(func.corsOptionsDelegate), posts.deletePost);

// update like post
apiRouter
  .route("/posts/:postId/like")
  .put(cors(func.corsOptionsDelegate), posts.toggleLike);

// update reaction post
apiRouter
  .route("/posts/:postId/reaction")
  .put(cors(func.corsOptionsDelegate), posts.addReaction);

// get reaction post from each user
apiRouter
  .route("/posts/:postId/reactions/:emoji")
  .get(cors(func.corsOptionsDelegate), posts.getReactionUsers);

// 📌 Ajouter un commentaire à un post (🔒 Authentification requise)
apiRouter
  .route("/posts/:postId/comments")
  .post(cors(func.corsOptionsDelegate), comment.addComment);

// 📌 Récupérer les commentaires d'un post avec pagination
apiRouter
  .route("/posts/:postId/comments")
  .get(cors(func.corsOptionsDelegate), comment.getPostComments);

// 📌 Supprimer un commentaire (🔒 Seulement l'auteur du commentaire)
apiRouter
  .route("/comments/:commentId")
  .delete(cors(func.corsOptionsDelegate), comment.deleteComment);

apiRouter
  .route("/user/admin/:email", cors(func.corsOptionsDelegate))
  .get(reporting.getReportsByUser);

// Route pour récupérer les statistiques de l'utilisateur
apiRouter.route("/user/stats", cors(func.corsOptions)).get(user.getUserStats);

// 2- Tickets routes
apiRouter
  .route("/ticket/:idReporting/new", cors(func.corsOptionsDelegate))
  .post(ticket.create);

// action to admin only
apiRouter
  .route("/admin/clear-tables", cors(func.corsOptionsDelegate))
  .delete(adminAction.clearTables);

export default apiRouter;
