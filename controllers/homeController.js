import prisma from "../lib/prisma.js";

export const homeIndex = async (req, res) => {
  try {
    const products = await prisma.product.findMany();

    // On utilise uniquement la valeur du middleware
    const cartCount = res.locals.cartCount;

    res.render("home/index", {
      products,
      cartCount, // ← Utilise maintenant le vrai compteur
    });
  } catch (error) {
    console.error("Erreur chargement produits :", error);
    res.status(500).send("Erreur serveur");
  }
};
