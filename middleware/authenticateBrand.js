import db from "../models/index.js";
const { Marque } = db;
import { getBrandId } from "../utils/jwtUtils.js"; // on va créer aussi cette fonction

export const authenticateBrand = async (req, res, next) => {
  try {
    const headerAuth = req.headers["authorization"];
    const brandId = getBrandId(headerAuth);

    console.log("🔍 Vérification Marque - BrandId récupéré :", brandId);

    if (!brandId) {
      console.log("❌ Erreur : BrandId non trouvé ou token invalide.");
      return res.status(401).json({ error: "Marque non authentifiée." });
    }

    const brand = await Marque.findByPk(brandId);

    console.log(
      "🔍 Marque trouvée :",
      brand ? brand.toJSON() : "Aucune marque trouvée"
    );

    if (!brand) {
      console.log("❌ Erreur : Marque non trouvée en base de données.");
      return res.status(404).json({ error: "Marque non trouvée." });
    }

    // Stocker la marque dans la requête pour l'utiliser ensuite
    req.brand = brand;

    console.log("✅ Accès autorisé pour la marque :", brand.name);
    next();
  } catch (error) {
    console.error("❌ Erreur lors de la vérification de la marque :", error);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};
