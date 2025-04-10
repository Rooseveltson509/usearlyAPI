import csurf from "csurf";

const isSecure = process.env.COOKIE_SECURE === "true";

const csrfProtection = csurf({
  cookie: {
    key: "_csrf",
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? "None" : "Lax",
  },
  value: (req) => req.headers["x-csrf-token"],
});

export default csrfProtection;
