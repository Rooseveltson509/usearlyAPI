import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SIGN_SECRET = process.env.JWT_SIGN_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Générer un token d'accès (courte durée)
export function generateAccessToken(userData) {
  return jwt.sign(
    {
      userId: userData.id,
      email: userData.email,
    },
    JWT_SIGN_SECRET,
    {
      expiresIn: "5h", // Plus courte durée pour le token d'accès
    }
  );
}

// Générer un refresh token (longue durée)
export function generateRefreshToken(userData) {
  return jwt.sign(
    {
      userId: userData.id,
    },
    JWT_REFRESH_SECRET,
    {
      expiresIn: "30d", // Longue durée pour le token de rafraîchissement
    }
  );
}

// Vérifier un token d'accès
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SIGN_SECRET);
  } catch (err) {
    console.error("Erreur lors de la vérification du token d'accès:", err);
    throw new Error("Access Token invalide ou expiré.");
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (err) {
    console.error("Erreur lors de la vérification du refresh token:", err);
    throw new Error("Refresh Token invalide ou expiré.");
  }
}

// Extraire l'utilisateur à partir de l'autorisation
export function getUserId(authorization) {
  const token = authorization ? authorization.replace("Bearer ", "") : null;
  if (token) {
    try {
      const jwtToken = verifyAccessToken(token);
      return jwtToken ? jwtToken.userId : -1;
    } catch (err) {
      console.error("Erreur lors de l'extraction de l'utilisateur:", err);
      return -1;
    }
  }
  return -1;
}
