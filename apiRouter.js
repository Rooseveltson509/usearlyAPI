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
import { commentReport } from "./routes/commentReportCtrl.js";
import { commentCdc } from "./routes/commentCdcCtr.js";
import { commentSuggestion } from "./routes/commentSuggestionCtrl.js";
import { createBrandTicket } from "./routes/brandTicketCtrl.js";
import rateLimit from "express-rate-limit";
import csrfProtection from "./middleware/csrfProtection.js"; // 🔥 Import du middleware CSRF
import {
  validateCoupdeCoeur,
  validateReport,
  validateSuggest,
} from "./middleware/validateReport.js";
import upload from "./config/multer.js";
import { isAdmin } from "./middleware/auth.js";

// Définition de l'API Router
const apiRouter = express.Router();

// Middleware de limitation de débit (rate limiting)
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // ✅ Permet plus de requêtes en développement
  message: {
    success: false,
    message: "Trop de requêtes, réessayez plus tard.",
  },
  headers: true,
});

// ✅ Route pour récupérer le CSRF Token
apiRouter.get("/csrf-token", (req, res) => {
  try {
    const csrfToken = req.csrfToken(); // ✅ Génère le CSRF Token
    console.log("✅ CSRF Token généré :", csrfToken);

    res.cookie("_csrf", csrfToken, {
      httpOnly: false, // ✅ Permet au frontend de le lire
      secure: false, // ✅ False en local
      sameSite: "Lax",
    });

    res.json({ csrfToken });
  } catch (error) {
    console.error("❌ Erreur lors de la génération du CSRF Token :", error);
    res.status(500).json({ error: "CSRF Token non généré" });
  }
});

// ✅ Route sécurisée avec CSRF pour `refresh-token`
apiRouter.post(
  "/user/refresh-token",
  refreshLimiter,
  cors(func.corsOptionsDelegate),
  (req, res, next) => {
    console.log("📌 Avant CSRF Protection");
    console.log("📌 Cookies reçus :", req.cookies);
    console.log(
      "📌 CSRF Token reçu dans headers :",
      req.headers["x-csrf-token"]
    );
    console.log("📌 CSRF Token attendu (cookie) :", req.cookies["_csrf"]);

    if (!req.cookies["_csrf"] || !req.headers["x-csrf-token"]) {
      return res
        .status(403)
        .json({ success: false, message: "CSRF Token manquant." });
    }

    next();
  },
  csrfProtection,
  user.refreshToken
);
const permissiveCors = {
  origin: true, // ✅ Autorise toutes les origines
  methods: ["POST", "GET"], // ✅ Autorise uniquement les méthodes nécessaires
  credentials: true, // ✅ Permet l'envoi des cookies (obligatoire pour CSRF & refreshToken)
  allowedHeaders: ["Authorization", "Content-Type", "X-CSRF-Token"], // ✅ Assure que CSRF passe bien
};

apiRouter
  .route("/user/login")
  .options(cors(permissiveCors)) // ✅ Gestion des pré-requêtes OPTIONS pour éviter les erreurs CORS
  .post(cors(permissiveCors), user.login); // ✅ Applique la configuration CORS correctement

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

/* reaction report */
apiRouter
  .route("/report/:reportId/reactions", cors(func.corsOptionsDelegate))
  .put(reporting.addReactionToReport);

apiRouter
  .route("/reports/:reportId/reactions", cors(func.corsOptionsDelegate))
  .get(reporting.getAllReportReactions); // ✅ Nouvelle méthode pour récupérer toutes les réactions

apiRouter
  .route("/reports/:reportId/reactions/:emoji", cors(func.corsOptionsDelegate))
  .get(reporting.getReportReactionUsers);
/* end reaction report */

/* reaction suggestion */
/* ✅ Routes pour les réactions sur les Suggestions */
apiRouter
  .route("/suggestion/:suggestionId/reactions", cors(func.corsOptionsDelegate))
  .put(suggestion.addReactionToSuggestion) // ✅ Ajout d'une réaction
  .get(suggestion.getAllSuggestionReactions); // ✅ Récupération des réactions

apiRouter
  .route(
    "/suggestion/:suggestionId/reactions/:emoji",
    cors(func.corsOptionsDelegate)
  )
  .get(suggestion.getSuggestionReactionUsers); // ✅ Récupération des utilisateurs ayant réagi avec un emoji spécifique

/* end reaction suggestion */

/* reaction cdc */
apiRouter
  .route("/cdc/:coupdecoeurId/reactions", cors(func.corsOptionsDelegate))
  .put(coupDeCoeur.addReactionToCdc);

apiRouter
  .route("/cdc/:coupdecoeurId/reactions", cors(func.corsOptionsDelegate))
  .get(coupDeCoeur.getAllCdcReactions);

apiRouter
  .route("/cdc/:cdcId/reactions/:emoji", cors(func.corsOptionsDelegate))
  .get(coupDeCoeur.getCdcReactionUsers);
/* end reaction cdc */

apiRouter
  .route("/reports/:reportId/comments/count", cors(func.corsOptionsDelegate))
  .get(comment.getReportCommentCount);

apiRouter
  .route("/posts/:postId/comments/count", cors(func.corsOptionsDelegate))
  .get(posts.getPostCommentCount);

apiRouter
  .route(
    "/suggestions/:suggestionId/comments/count",
    cors(func.corsOptionsDelegate)
  )
  .get(comment.getSuggestionCommentCount);

apiRouter
  .route("/cdc/:coupDeCoeurId/comments/count", cors(func.corsOptionsDelegate))
  .get(comment.getCdcCommentCount);

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
  .route("/posts/:id") // 🔥 Supprime un post (admin = tout, user = son post)
  .delete(cors(func.corsOptionsDelegate), posts.deletePost);

apiRouter
  .route("/posts")
  .delete(cors(func.corsOptionsDelegate), posts.getFilteredPosts);

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

apiRouter
  .route("/posts/:postId/reactions") // ✅ Nouvelle route pour récupérer toutes les réactions
  .get(cors(func.corsOptionsDelegate), posts.getAllPostReactions);

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

// 📌 Ajouter un commentaire à un Report (🔒 Authentification requise)
apiRouter
  .route("/reports/:reportId/comments")
  .post(cors(func.corsOptionsDelegate), commentReport.addCommentToReport);

// 📌 Récupérer les commentaires d'un Report avec pagination
apiRouter
  .route("/reports/:reportId/comments")
  .get(cors(func.corsOptionsDelegate), commentReport.getReportComments);

// 📌 Supprimer un commentaire d'un Report (🔒 Seulement l'auteur du commentaire ou un admin)
apiRouter
  .route("/comments/:commentId")
  .delete(
    cors(func.corsOptionsDelegate),
    commentReport.deleteCommentFromReport
  );

// 📌 Ajouter un commentaire à un CoupDeCoeur (🔒 Authentification requise)
apiRouter
  .route("/coupdecoeur/:coupDeCoeurId/comments")
  .post(cors(func.corsOptionsDelegate), commentCdc.addCommentToCdc);

// 📌 Récupérer les commentaires d'un CoupDeCoeur avec pagination
apiRouter
  .route("/coupdecoeur/:coupDeCoeurId/comments")
  .get(cors(func.corsOptionsDelegate), commentCdc.getCdcComments);

// 📌 Supprimer un commentaire d'un CoupDeCoeur (🔒 Seulement l'auteur ou un admin)
apiRouter
  .route("/comments/:commentId")
  .delete(cors(func.corsOptionsDelegate), commentCdc.deleteCommentFromCdc);

// 📌 Ajouter un commentaire à une Suggestion (🔒 Authentification requise)
apiRouter
  .route("/suggestions/:suggestionId/comments")
  .post(
    cors(func.corsOptionsDelegate),
    commentSuggestion.addCommentToSuggestion
  );

// 📌 Récupérer les commentaires d'une Suggestion avec pagination
apiRouter
  .route("/suggestions/:suggestionId/comments")
  .get(cors(func.corsOptionsDelegate), commentSuggestion.getSuggestionComments);

// 📌 Supprimer un commentaire d'une Suggestion (🔒 Seulement l'auteur ou un admin)
apiRouter
  .route("/comments/:commentId")
  .delete(
    cors(func.corsOptionsDelegate),
    commentSuggestion.deleteCommentFromSuggestion
  );

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
