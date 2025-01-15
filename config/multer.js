import multer from "multer";
import path from "path";
import fs from "fs";

// Vérifier et créer un dossier si nécessaire
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Configuration de stockage temporaire
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = "uploads/temp";
    ensureDirectoryExists(tempDir); // Vérifie et crée le dossier temporaire
    cb(null, tempDir);
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
    // Assurez-vous que le répertoire final existe
    const finalDir = path.dirname(finalPath);
    ensureDirectoryExists(finalDir);

    // Déplacer le fichier
    await fs.promises.rename(tempPath, finalPath);
  } catch (err) {
    console.error("Erreur lors du déplacement du fichier :", err);
    throw err;
  }
};

// Fonction pour supprimer un fichier inutilisé
const deleteFileIfExists = async (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  } catch (err) {
    console.error("Erreur lors de la suppression du fichier :", err);
  }
};

export default upload;
export { moveFileToFinalDestination, deleteFileIfExists };
