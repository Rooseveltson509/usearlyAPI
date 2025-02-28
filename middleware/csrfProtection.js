import csurf from "csurf";

const csrfProtection = csurf({
  cookie: {
    httpOnly: true, // 🔒 Empêche l’accès au cookie depuis JS (protection XSS)
    secure: process.env.NODE_ENV === "production", // ✅ Active le mode sécurisé en production
    sameSite: "strict", // ⚠️ Empêche le partage de cookie entre sites (évite les attaques CSRF)
  },
});

export default csrfProtection;
