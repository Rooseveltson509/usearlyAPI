// Imports
import db from "./models/index.js";
import express from "express";
import { getUserId } from "./utils/jwtUtils.js";
import cors from "cors";
import { func } from "./funcs/functions.js";
import { user } from "./routes/usersCtrl.js";
import { ticket } from "./routes/ticketsCtrl.js";
import { reporting } from "./routes/reportingCtrl.js";
import { suggestion } from "./routes/suggestionCtrl.js";
import { coupDeCoeur } from "./routes/coupdecoeurCtrl.js";
import { adminAction } from "./routes/adminCtrl.js";
import { brandCtrl } from "./routes/brandCtrl.js";
import { brandResponseCtrl } from "./routes/brandResponseCtrl.js";
import { posts } from "./routes/postCtrl.js";
import { reportingDesc } from "./routes/reportingDescriptionCtrl.js";
import { comment } from "./routes/commentCtrl.js";
import { commentReport } from "./routes/commentReportCtrl.js";
import { commentCdc } from "./routes/commentCdcCtr.js";
import { commentSuggestion } from "./routes/commentSuggestionCtrl.js";
import { createBrandTicket } from "./routes/brandTicketCtrl.js";
import { timeline } from "./routes/reportTimelineStepCtrl.js";
import { reportService } from "./services/reportService.js";
import { service as siteService } from "./services/siteService.js";
import {
  createNotification,
  markNotificationAsRead,
  getNotifications,
} from "./routes/notificationCtrl.js";
import rateLimit from "express-rate-limit";
import csrfProtection from "./middleware/csrfProtection.js"; // 🔥 Import du middleware CSRF
//import { checkAlreadyAuthenticated } from "./middleware/checkAlreadyAuthenticated.js"; // 🔥 Import du middleware CSRF
import {
  validateCoupdeCoeur,
  validateReport,
  validateSuggest,
} from "./middleware/validateReport.js";
import { sendNotificationToUser } from "./utils/notificationUtils.js";
import upload from "./config/multer.js";
import { isAdmin } from "./middleware/auth.js";
import { authenticateBrand } from "./middleware/authenticateBrand.js";
const { Reporting, User } = db;
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
apiRouter.get("/csrf-token", csrfProtection, (req, res) => {
  try {
    const csrfToken = req.csrfToken(); // ✅ fonctionne maintenant

    console.log("✅ CSRF Token généré :", csrfToken);

    res.cookie("_csrf", csrfToken, {
      httpOnly: false, // ✅ accessible côté client
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: process.env.COOKIE_SECURE === "true" ? "None" : "Lax",
    });

    res.json({ csrfToken });
  } catch (error) {
    console.error("❌ Erreur lors de la génération du CSRF Token :", error);
    res.status(500).json({ error: "CSRF Token non généré" });
  }
});

const refreshCors = cors({
  origin: true,
  credentials: true,
  methods: ["POST"],
  allowedHeaders: ["Authorization", "Content-Type", "X-CSRF-Token"],
});

// ✅ Route sécurisée avec CSRF pour `refresh-token`
apiRouter.post(
  "/user/refresh-token",
  refreshLimiter,
  refreshCors,

  // ✅ Debug cookies / CSRF
  (req, res, next) => {
    console.log("🧪 Cookies reçus :", req.cookies);
    console.log("🧪 Header X-CSRF-Token :", req.headers["x-csrf-token"]);
    console.log("🧪 NODE_ENV :", process.env.NODE_ENV);
    next();
  },

  // ✅ CSRF
  process.env.NODE_ENV === "production"
    ? csrfProtection
    : (req, res, next) => {
        console.log("⚠ CSRF middleware désactivé (dev mode)");
        next();
      },

  user.refreshToken
);

const permissiveCors = {
  origin: true, // ✅ Autorise toutes les origines
  methods: ["POST", "GET", "PUT"], // ✅ Autorise uniquement les méthodes nécessaires
  credentials: true, // ✅ Permet l'envoi des cookies (obligatoire pour CSRF & refreshToken)
  allowedHeaders: ["Authorization", "Content-Type", "X-CSRF-Token"], // ✅ Assure que CSRF passe bien
};

apiRouter
  .route("/user/login")
  .options(cors(permissiveCors)) // ✅ Gestion des pré-requêtes OPTIONS pour éviter les erreurs CORS
  .post(cors(permissiveCors), user.login); // ✅ Applique la configuration CORS correctement

apiRouter
  .route("/user/logout")
  .options(cors(permissiveCors))
  .post(cors(permissiveCors), user.logout);

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

apiRouter
  .route("/user/notifications/:userId")
  .options(cors(permissiveCors)) // Gérer les pré-requêtes OPTIONS
  .get(cors(permissiveCors), getNotifications); // Récupérer les notifications de l'utilisateur

apiRouter
  .route("/user/notifications/read/:userId")
  .options(cors(permissiveCors)) // Gérer les pré-requêtes OPTIONS
  .put(cors(permissiveCors), markNotificationAsRead); // Marquer la notification comme lue

apiRouter
  .route("/user/notifications")
  .options(cors(permissiveCors)) // Gérer les pré-requêtes OPTIONS
  .post(cors(permissiveCors), createNotification); // Créer une nouvelle notification pour l'utilisateur

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
  .post(/* checkAlreadyAuthenticated, */ brandCtrl.login); // Middleware ajouté ici

apiRouter
  .route("/brand-reply/:reportId", cors(func.corsOptionsDelegate))
  .post(brandResponseCtrl.createBrandReply);

// Récupérer la réponse de marque pour un report donné
apiRouter
  .route("/reports/:id/brand-reply")
  .options(cors(permissiveCors))
  .get(cors(permissiveCors), brandResponseCtrl.getBrandReplyByReport);

apiRouter
  .route("/brand/profile", cors(func.corsOptionsDelegate))
  .get(brandCtrl.fetchBrandProfile);

apiRouter
  .route("/brand/:brandName", cors(func.corsOptionsDelegate))
  .get(brandCtrl.getBrandByName);

apiRouter
  .route("/brand/:brandName/analytics/weekly")
  .get(cors(func.corsOptionsDelegate), brandCtrl.getAnalyticsStats);

apiRouter
  .route("/brand/:brandName/analytics/summary")
  .get(cors(func.corsOptionsDelegate), brandCtrl.getSummaryAnalytics);

apiRouter
  .route("/brand/:brandName/reports/latest")
  .get(cors(func.corsOptionsDelegate), brandCtrl.getLatestReports);

apiRouter
  .route("/brand/:brandName/latest-feedbacks")
  .get(cors(func.corsOptionsDelegate), brandCtrl.getLatestFeedbacks);

apiRouter
  .route("/brand/:brandName/top-report")
  .get(cors(func.corsOptionsDelegate), brandCtrl.getTopReport);

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
apiRouter
  .route("/reportings/:reportingId/subcategories")
  .get(cors(func.corsOptionsDelegate), reporting.getSubCategories);

apiRouter
  .route("/report/page-info")
  .options(cors(permissiveCors))
  .get(cors(permissiveCors), reporting.getPageInfo);

apiRouter
  .route("/reportings/grouped", cors(func.corsOptionsDelegate))
  .get(reporting.getGroupedReports);
// ✅ Endpoint pour récupérer les bugs les plus signalés pour un site donné
apiRouter
  .route("/user/alert/popular")
  .options(cors(permissiveCors))
  .get(cors(permissiveCors), async (req, res) => {
    try {
      const siteUrl = req.query.siteUrl;
      if (!siteUrl) {
        return res.status(400).json({ error: "Paramètre siteUrl manquant." });
      }

      const normalizedUrl = siteService.normalizeUrl(siteUrl);
      if (!siteService.isValidUrl(normalizedUrl)) {
        return res
          .status(400)
          .json({ error: "URL invalide ou non approuvée." });
      }

      const popularBugs = await reportService.getTopReportedBugs(normalizedUrl);
      return res.status(200).json({ success: true, reports: popularBugs });
    } catch (error) {
      console.error("❌ Erreur dans /user/alert/popular:", error);
      return res.status(500).json({
        error:
          "Une erreur est survenue lors de la récupération des signalements populaires.",
      });
    }
  });
apiRouter
  .route("/user/alert/support")
  .options(cors(permissiveCors))
  .post(cors(permissiveCors), reporting.confirmReport);

apiRouter
  .route("/reportings/grouped-by-category")
  .get(cors(func.corsOptionsDelegate), reporting.getAllGroupedReports);

apiRouter
  .route("/reports/:reportId/timeline")
  .post(
    cors(func.corsOptionsDelegate),
    authenticateBrand,
    timeline.createOrUpdateTimelineStep // Utilisation de `POST` pour créer ou mettre à jour
  )
  .put(
    cors(func.corsOptionsDelegate),
    authenticateBrand,
    timeline.createOrUpdateTimelineStep // Utilisation de `PUT` pour la mise à jour
  )
  .options(cors(permissiveCors))
  .get(
    cors(permissiveCors),
    timeline.getTimelineSteps // ✅ Pas besoin d'auth pour voir la timeline
  );

apiRouter
  .route("/report/description")
  .options(cors(permissiveCors))
  .post(cors(permissiveCors), reportingDesc.createReportingDescription);

/* apiRouter
  .route("/reportings/reportings-with-subcategories")
  .get(cors(func.corsOptionsDelegate), reporting.getAllGroupedReports); */

/* apiRouter
  .route("/reporting/:id", cors(func.corsOptionsDelegate))
  .get(reporting.getReport); */

apiRouter
  .route("/reporting/:reportingId")
  .options(cors(permissiveCors))
  .get(cors(permissiveCors), reporting.getReportWithDescriptions);

apiRouter
  .route("/test/site-metadata", cors(func.corsOptionsDelegate))
  .get(reporting.testGetSiteMetadata);

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
    "/suggestion/:suggestionId/reactions/count",
    cors(func.corsOptionsDelegate)
  )
  .get(suggestion.getReactionsCountBySuggest); // ✅ Récupération des réactions

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

// Endpoint pour mettre à jour le statut d'un signalement
apiRouter
  .route("/user/reporting/:reportingId/status")
  .patch(cors(permissiveCors), async (req, res) => {
    let headerAuth = req.headers["authorization"];
    let userId = getUserId(headerAuth);
    if (!userId || userId < 0) {
      return res.status(400).json({ error: "Utilisateur non authentifié." });
    }

    const user = await User.findByPk(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        error:
          "Accès refusé. Seuls les administrateurs peuvent effectuer cette action.",
      });
    }

    const { reportingId } = req.params;
    const { status } = req.body;
    const validStatuses = ["pending", "resolved", "in-progress"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Statut invalide." });
    }

    try {
      const reporting = await Reporting.findByPk(reportingId);
      if (!reporting) {
        return res.status(404).json({ error: "Signalement non trouvé." });
      }

      // Mise à jour du statut du signalement
      reporting.status = status;
      await reporting.save();

      // Si le signalement est marqué comme "résolu", notifier tous les utilisateurs associés
      if (status === "resolved") {
        const users = await reporting.getAuthor();
        console.log("Utilisateurs récupérés :", users);
        await Promise.all(
          users.map(async (user) => {
            console.log("notification sent: ", user.email); // Ajoute un log pour vérifier
            await sendNotificationToUser(
              user.id,
              "🎉 Votre signalement a été résolu !",
              "bug_resolved"
            );

            console.log("notification sent: ");
          })
        );
      }

      return res
        .status(200)
        .json({ message: "Statut mis à jour avec succès." });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Erreur interne." });
    }
  });

export default apiRouter;
