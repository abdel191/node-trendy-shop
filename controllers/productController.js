import prisma from "../prisma/client.js";

// Afficher tous les produits
export const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    // Passe aussi l'utilisateur si connecté pour pré-remplir les infos dans le formulaire d'achat
    const user = req.session.user || null;
    res.render("products/index", { products, user });
  } catch (err) {
    console.error("Erreur récupération produits :", err);
    res.status(500).send("Erreur serveur");
  }
};

export const renderHomePage = async (req, res) => {
  const products = await prisma.product.findMany();
  const cartCount = req.session.cart ? req.session.cart.length : 0;

  res.render("home/index", {
    products,
    cartCount,
  });
};

// Afficher un produit par ID
export const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });
    if (!product) return res.status(404).send("Produit non trouvé");

    const user = req.session.user || null;
    res.render("products/detail", { product, user });
  } catch (err) {
    console.error("Erreur récupération produit :", err);
    res.status(500).send("Erreur serveur");
  }
};

// Créer un produit
export const createProduct = async (req, res) => {
  const { name, price, description, imageUrl, stock, categoryId } = req.body;
  try {
    await prisma.product.create({
      data: {
        name,
        price: parseFloat(price),
        description,
        imageUrl,
        stock: parseInt(stock),
        categoryId: parseInt(categoryId),
      },
    });
    req.flash("succes", "Produit ajouté avec succès !");
    res.redirect("/products");
  } catch (err) {
    console.error("Erreur ajout produit :", err);
    req.flash("error", "Erreur lors de l'ajout du produit.");
    res.redirect("/products");
  }
};
