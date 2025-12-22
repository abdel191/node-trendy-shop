import express from "express";
import {
  getCart,
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
} from "../controllers/cartController.js";

const router = express.Router();

// 📌 Afficher le panier
router.get("/", getCart);

// ➕ Ajouter un produit au panier
router.post("/add", addToCart);

// ➕ Augmenter la quantité
router.post("/increase/:itemId", increaseQuantity);

// ➖ Diminuer la quantité
router.post("/decrease/:itemId", decreaseQuantity);

// ❌ Supprimer complètement un produit
router.post("/remove/:itemId", removeFromCart);

export default router;
