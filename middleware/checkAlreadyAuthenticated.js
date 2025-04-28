export const checkAlreadyAuthenticated = (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken;

  // ✅ Autorise si ?force=true
  if (req.query.force === "true") return next();

  if (refreshToken && refreshToken !== "undefined") {
    return res.status(400).json({
      success: false,
      message:
        "Vous êtes déjà connecté. Déconnectez-vous d'abord pour changer de rôle.",
    });
  }

  next();
};
