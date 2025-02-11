import db from "./models/index.js"; // Import du fichier contenant les modèles Sequelize
const { Post, Marque } = db;

async function test() {
  const post = await Post.findOne({
    include: { model: Marque, as: "brand" },
  });

  console.log(post);
}

test();
