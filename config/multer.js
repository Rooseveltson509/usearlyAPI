import multer from "multer";
import path from "path";
import fs from "fs";

// Dossiers de stockage
const baseUploadDir = path.resolve("uploads");
const tempDirectory = path.join(baseUploadDir, "temp");
const userAvatarsDir = path.join(baseUploadDir, "avatars/users");
const brandAvatarsDir = path.join(baseUploadDir, "avatars/brands");

// Vérifier et créer les répertoires si nécessaires
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Création des dossiers au démarrage
[baseUploadDir, tempDirectory, userAvatarsDir, brandAvatarsDir].forEach(
  ensureDirectoryExists
);

// Configuration de stockage temporaire
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

// Vérification du type de fichier
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

// Taille limite des fichiers (2MB)
const limits = {
  fileSize: 2 * 1024 * 1024, // 2MB
};

// Middleware Multer pour l'upload temporaire
const upload = multer({ storage: tempStorage, fileFilter, limits });

// Déplacement du fichier vers le répertoire final (Utilisateur ou Marque)
const moveFileToFinalDestination = async (tempPath, finalPath) => {
  try {
    const resolvedTempPath = path.resolve(tempPath);
    const resolvedFinalPath = path.resolve(finalPath);

    if (
      !resolvedTempPath.startsWith(baseUploadDir) ||
      !resolvedFinalPath.startsWith(baseUploadDir)
    ) {
      throw new Error("Tentative d'accès à des chemins non autorisés");
    }

    ensureDirectoryExists(path.dirname(resolvedFinalPath));
    await fs.promises.rename(resolvedTempPath, resolvedFinalPath);
  } catch (err) {
    console.error("Erreur lors du déplacement du fichier :", err);
    throw err;
  }
};

// Suppression de l'ancien avatar
const deleteOldAvatar = async (avatarPath) => {
  try {
    if (!avatarPath) return;

    // 📌 Correction ici : Générer le bon chemin absolu
    const resolvedAvatarPath = path.resolve("uploads", avatarPath);

    // 📌 Vérification pour s'assurer qu'on ne supprime que dans `uploads/avatars/users`
    if (
      !resolvedAvatarPath.startsWith(userAvatarsDir) &&
      !resolvedAvatarPath.startsWith(brandAvatarsDir)
    ) {
      throw new Error("Tentative de suppression d'un fichier non autorisé.");
    }

    if (fs.existsSync(resolvedAvatarPath)) {
      await fs.promises.unlink(resolvedAvatarPath);
      console.log("✔ Ancien avatar supprimé :", resolvedAvatarPath);
    }
  } catch (err) {
    console.error("❌ Erreur lors de la suppression de l'ancien avatar :", err);
  }
};

export default upload;
export {
  ensureDirectoryExists,
  moveFileToFinalDestination,
  deleteOldAvatar,
  userAvatarsDir,
  brandAvatarsDir,
};
