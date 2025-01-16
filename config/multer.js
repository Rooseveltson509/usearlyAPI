import multer from "multer";
import path from "path";
import fs from "fs";

// Vérifier et créer un dossier si nécessaire
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Répertoire temporaire autorisé
const tempDirectory = path.resolve("uploads/temp");

// Répertoire final autorisé
//const finalDirectoryBase = path.resolve("uploads/avatars");

// Configuration de stockage temporaire
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDirectoryExists(tempDirectory); // Vérifie et crée le dossier temporaire
    cb(null, tempDirectory);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

// Filtrage des fichiers par type MIME
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accepter le fichier
  } else {
    cb(new Error("Type de fichier non pris en charge"), false);
  }
};

// Limite la taille du fichier (par exemple : 2 MB)
const limits = {
  fileSize: 2 * 1024 * 1024, // 2 MB
};

// Middleware multer avec stockage temporaire
const upload = multer({ storage: tempStorage, fileFilter, limits });

// Fonction pour déplacer un fichier du répertoire temporaire à son emplacement final
const moveFileToFinalDestination = async (tempPath, finalPath) => {
  try {
    const resolvedTempPath = path.resolve(tempPath);
    const resolvedFinalPath = path.resolve(finalPath);

    // Assurez-vous que les chemins restent dans le répertoire attendu
    const baseDir = path.resolve("uploads");
    if (
      !resolvedTempPath.startsWith(baseDir) ||
      !resolvedFinalPath.startsWith(baseDir)
    ) {
      throw new Error("Tentative d'accès à des chemins non autorisés");
    }

    // Assurez-vous que le répertoire final existe
    const finalDir = path.dirname(resolvedFinalPath);
    ensureDirectoryExists(finalDir);

    // Déplacer le fichier
    await fs.promises.rename(resolvedTempPath, resolvedFinalPath);
  } catch (err) {
    console.error("Erreur lors du déplacement du fichier :", err);
    throw err;
  }
};

/* const moveFileToFinalDestination = async (tempPath, finalPath) => {
  try {
    // Résolution des chemins pour validation
    const resolvedTempPath = path.resolve(tempPath);
    const resolvedFinalPath = path.resolve(finalPath);

    // Assurez-vous que les chemins appartiennent aux répertoires autorisés
    if (!resolvedTempPath.startsWith(tempDirectory)) {
      throw new Error("Chemin temporaire non autorisé.");
    }
    if (!resolvedFinalPath.startsWith(finalDirectoryBase)) {
      throw new Error("Chemin final non autorisé.");
    }

    // Assurez-vous que le répertoire final existe
    const finalDir = path.dirname(resolvedFinalPath);
    ensureDirectoryExists(finalDir);

    // Déplacer le fichier
    await fs.promises.rename(resolvedTempPath, resolvedFinalPath);
  } catch (err) {
    console.error("Erreur lors du déplacement du fichier :", err);
    throw err;
  }
}; */

// Fonction pour supprimer un fichier inutilisé
const deleteFileIfExists = async (filePath) => {
  try {
    // Résoudre le chemin pour éviter les injections de chemin
    const resolvedFilePath = path.resolve(filePath);

    // Vérifiez que le chemin reste dans un répertoire sécurisé
    const baseDir = path.resolve("uploads"); // Limite les actions dans ce répertoire
    if (!resolvedFilePath.startsWith(baseDir)) {
      throw new Error("Tentative d'accès à un chemin non autorisé");
    }

    if (fs.existsSync(resolvedFilePath)) {
      await fs.promises.unlink(resolvedFilePath);
    }
  } catch (err) {
    console.error("Erreur lors de la suppression du fichier :", err);
    throw err;
  }
};

/* const deleteFileIfExists = async (filePath) => {
  try {
    const resolvedFilePath = path.resolve(filePath);

    // Vérifiez que le chemin appartient à un répertoire autorisé
    if (
      !resolvedFilePath.startsWith(tempDirectory) &&
      !resolvedFilePath.startsWith(finalDirectoryBase)
    ) {
      throw new Error("Tentative de suppression d'un fichier non autorisé.");
    }

    if (fs.existsSync(resolvedFilePath)) {
      await fs.promises.unlink(resolvedFilePath);
    }
  } catch (err) {
    console.error("Erreur lors de la suppression du fichier :", err);
  }
}; */

export default upload;
export { ensureDirectoryExists };
export { moveFileToFinalDestination, deleteFileIfExists };
