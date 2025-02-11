import multer from "multer";
import path from "path";
import fs from "fs";

// 📌 Définition des répertoires de stockage
const baseUploadDir = path.resolve("uploads");
const tempDirectory = path.join(baseUploadDir, "temp");
const userAvatarsDir = path.join(baseUploadDir, "avatars/users");
const brandAvatarsDir = path.join(baseUploadDir, "avatars/brands");

// 📌 Vérification et création des répertoires sécurisés
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 📌 Création des dossiers au démarrage
[baseUploadDir, tempDirectory, userAvatarsDir, brandAvatarsDir].forEach(
  ensureDirectoryExists
);

// 📌 Configuration de stockage temporaire
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDirectoryExists(tempDirectory);
    cb(null, tempDirectory);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

// 📌 Vérification du type de fichier (Sécurité)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Type de fichier non pris en charge (JPG, PNG, WEBP uniquement)"
      ),
      false
    );
  }
};

// 📌 Taille limite des fichiers (2MB)
const limits = {
  fileSize: 2 * 1024 * 1024, // 2MB
};

// 📌 Middleware Multer pour l'upload temporaire
const upload = multer({ storage: tempStorage, fileFilter, limits });

// 📌 Suppression sécurisée de l'ancien avatar AVANT d'enregistrer le nouveau
const deleteOldAvatar = async (avatarPath) => {
  try {
    if (!avatarPath) return;

    // 🔒 Empêcher les attaques Path Traversal et les manipulations de chemin
    if (avatarPath.includes("..") || avatarPath.includes("\\")) {
      console.error("❌ Chemin non autorisé détecté :", avatarPath);
      return;
    }

    // 🔥 Vérification stricte : Le fichier doit être dans le dossier "uploads/avatars/"
    if (
      !avatarPath.startsWith("uploads/avatars/users") &&
      !avatarPath.startsWith("uploads/avatars/brands")
    ) {
      console.error(
        "❌ Suppression interdite (chemin non reconnu) :",
        avatarPath
      );
      return;
    }

    // 📌 Récupérer uniquement le nom du fichier pour empêcher toute injection
    const fileName = path.basename(avatarPath);

    // 📌 Construire le chemin complet de manière sécurisée
    let resolvedAvatarPath;
    if (avatarPath.startsWith("uploads/avatars/users")) {
      resolvedAvatarPath = path.join(userAvatarsDir, fileName);
    } else if (avatarPath.startsWith("uploads/avatars/brands")) {
      resolvedAvatarPath = path.join(brandAvatarsDir, fileName);
    } else {
      console.error("❌ Chemin d'avatar non valide :", avatarPath);
      return;
    }

    // 🔥 Vérification finale avant suppression
    if (!resolvedAvatarPath.startsWith(path.resolve("uploads/avatars/"))) {
      console.error(
        "❌ Suppression interdite en dehors du dossier avatars :",
        resolvedAvatarPath
      );
      return;
    }

    // 📌 Vérifier si le fichier existe avant de le supprimer
    if (fs.existsSync(resolvedAvatarPath)) {
      await fs.promises.unlink(resolvedAvatarPath);
      console.log("✔ Ancien avatar supprimé :", resolvedAvatarPath);
    } else {
      console.warn("⚠️ Fichier avatar introuvable :", resolvedAvatarPath);
    }
  } catch (err) {
    console.error("❌ Erreur lors de la suppression de l'ancien avatar :", err);
  }
};

/* const deleteOldAvatar = async (avatarPath) => {
  try {
    if (!avatarPath) return;

    // 🔒 Vérification stricte pour éviter les attaques Path Traversal
    if (avatarPath.includes("..") || avatarPath.includes("\\")) {
      console.error("❌ Chemin non autorisé détecté :", avatarPath);
      return;
    }

    // 🔥 Vérification stricte : Accepter uniquement les fichiers dans "uploads/avatars/"
    if (
      !avatarPath.startsWith("uploads/avatars/users") &&
      !avatarPath.startsWith("uploads/avatars/brands")
    ) {
      console.error(
        "❌ Suppression interdite (chemin non reconnu) :",
        avatarPath
      );
      return;
    }

    // 📌 Sécurisation CodeQL : Générer un chemin sécurisé sans utiliser directement `path.resolve(avatarPath)`
    let resolvedAvatarPath = path.join(
      path.resolve("uploads"),
      path.relative("uploads", avatarPath)
    );

    // 🔥 Vérification stricte : Empêcher la suppression hors des dossiers autorisés
    if (
      !resolvedAvatarPath.startsWith(path.resolve(userAvatarsDir)) &&
      !resolvedAvatarPath.startsWith(path.resolve(brandAvatarsDir))
    ) {
      console.error("❌ Suppression interdite :", resolvedAvatarPath);
      return;
    }

    // 📌 Vérifier si le fichier existe avant de le supprimer
    if (fs.existsSync(resolvedAvatarPath)) {
      await fs.promises.unlink(resolvedAvatarPath);
      console.log("✔ Ancien avatar supprimé :", resolvedAvatarPath);
    } else {
      console.warn("⚠️ Fichier avatar introuvable :", resolvedAvatarPath);
    }
  } catch (err) {
    console.error("❌ Erreur lors de la suppression de l'ancien avatar :", err);
  }
}; */

// 📌 Déplacement sécurisé du fichier vers le répertoire final
const moveFileToFinalDestination = async (tempPath, finalPath) => {
  try {
    const resolvedTempPath = path.resolve(tempPath);
    const resolvedFinalPath = path.resolve(finalPath);

    // 🔥 Vérification stricte : Empêcher l'écriture en dehors de `uploads`
    if (
      !resolvedTempPath.startsWith(baseUploadDir) ||
      !resolvedFinalPath.startsWith(baseUploadDir)
    ) {
      throw new Error("❌ Tentative d'accès à des chemins non autorisés !");
    }

    // 📌 Création du répertoire final s'il n'existe pas
    ensureDirectoryExists(path.dirname(resolvedFinalPath));

    // 📌 Déplacement sécurisé du fichier
    await fs.promises.rename(resolvedTempPath, resolvedFinalPath);
    console.log("✔ Fichier déplacé avec succès :", resolvedFinalPath);
  } catch (err) {
    console.error("❌ Erreur lors du déplacement du fichier :", err);
    throw err;
  }
};

// 📌 Export des fonctions et middleware sécurisés
export default upload;
export {
  ensureDirectoryExists,
  moveFileToFinalDestination,
  deleteOldAvatar,
  userAvatarsDir,
  brandAvatarsDir,
};
