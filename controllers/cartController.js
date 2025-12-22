import prisma from "../lib/prisma.js";
import crypto from "crypto";

/* ======================================================
   🔹 RÉCUPÉRER LE PANIER
====================================================== */
export const getCart = async (req, res) => {
  try {
    // Assurer un sessionId
    if (!req.cookies.sessionId) {
      const newSessionId = crypto.randomUUID();
      res.cookie("sessionId", newSessionId, { httpOnly: true });
      req.cookies.sessionId = newSessionId;
    }

    const sessionId = req.cookies.sessionId;
    const userId = req.user?.id || null;

    let cart;

    // Si connecté → panier utilisateur
    if (userId) {
      cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });
    }
    // Sinon → panier invité via sessionId
    else {
      cart = await prisma.cart.findFirst({
        where: { sessionId },
        include: { items: { include: { product: true } } },
      });
    }

    // Si aucun panier → créer
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId, sessionId },
        include: { items: { include: { product: true } } },
      });
    }

    const cartItems = cart.items;
    const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

    res.render("cart/index", { cart, cartItems, cartCount });
  } catch (error) {
    console.error("ERREUR getCart :", error);
    res.status(500).send("Erreur serveur");
  }
};

/* ======================================================
   🔹 AJOUTER AU PANIER
====================================================== */
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      req.flash("error", "Produit invalide");
      return res.redirect("/");
    }

    /* ------------------------------------------------------
       1️⃣ Assurer un sessionId cohérent (comme dans app.js)
    ------------------------------------------------------ */
    let sessionId = req.cookies.sessionId;

    if (!sessionId) {
      sessionId = crypto.randomUUID();

      res.cookie("sessionId", sessionId, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 jours
        sameSite: "lax",
        path: "/", // ⬅️ CRUCIAL POUR LE HEADER
      });

      console.log("🟧 Nouveau sessionId créé dans addToCart:", sessionId);
    } else {
      console.log("🟩 Session existante utilisée :", sessionId);
    }

    /* ------------------------------------------------------
       2️⃣ Récupérer ou créer le panier
    ------------------------------------------------------ */
    let cart = await prisma.cart.findFirst({
      where: { sessionId },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId },
      });

      console.log("🟦 Nouveau panier créé :", cart.id);
    }

    /* ------------------------------------------------------
       3️⃣ Ajouter ou augmenter un produit
    ------------------------------------------------------ */
    let item = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: Number(productId),
      },
    });

    if (item) {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity: { increment: 1 } },
      });

      console.log("🔼 Quantité augmentée pour produit :", productId);
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: Number(productId),
          quantity: 1,
        },
      });

      console.log("🆕 Produit ajouté au panier :", productId);
    }

    /* ------------------------------------------------------
       4️⃣ Message & redirection propre
    ------------------------------------------------------ */
    req.flash("success", "Produit ajouté au panier !");
    return res.redirect("/");
  } catch (error) {
    console.error("❌ Erreur addToCart:", error);
    req.flash("error", "Erreur interne.");
    return res.redirect("/");
  }
};
/* ======================================================
   🔹 AUGMENTER QUANTITÉ (+)
====================================================== */
export const increaseQuantity = async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: { increment: 1 } },
    });

    res.redirect("/cart");
  } catch (error) {
    console.error("Erreur increaseQuantity :", error);
    res.status(500).send("Erreur serveur");
  }
};

/* ======================================================
   🔹 DIMINUER QUANTITÉ (−)
====================================================== */
export const decreaseQuantity = async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item) return res.redirect("/cart");

    // Si la quantité tombe à 1 → supprimer
    if (item.quantity <= 1) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: { decrement: 1 } },
      });
    }

    res.redirect("/cart");
  } catch (error) {
    console.error("Erreur decreaseQuantity :", error);
    res.status(500).send("Erreur serveur");
  }
};

/* ======================================================
   🔹 SUPPRIMER UN PRODUIT
====================================================== */
export const removeFromCart = async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    res.redirect("/cart");
  } catch (error) {
    console.error("Erreur removeFromCart :", error);
    res.status(500).send("Erreur serveur");
  }
};
