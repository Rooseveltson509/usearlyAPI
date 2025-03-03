import csurf from "csurf";

const csrfProtection = csurf({
  cookie: {
    key: "_csrf",
    httpOnly: true, // ✅ Empêche l'accès via JS (protège contre XSS)
    secure: process.env.NODE_ENV === "production", // ✅ Active la sécurité en prod
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  },
  value: (req) => req.headers["x-csrf-token"], // ✅ Vérifie le CSRF Token dans les headers
});

export default csrfProtection;
