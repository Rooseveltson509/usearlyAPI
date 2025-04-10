// Middleware pour vérifier si l'utilisateur est déjà connecté sous un autre rôle
export const checkAlreadyAuthenticated = (req, res, next) => {
  // Vérifier si l'utilisateur est déjà connecté avec une session active (marque ou utilisateur)
  if (req.cookies.refreshToken) {
    // Si un refreshToken est présent, on renvoie l'erreur 400
    return res.status(400).json({
      success: false,
      message:
        "Vous êtes déjà connecté. Déconnectez-vous d'abord pour changer de rôle.",
    });
  }
  next();
};
