// routes/product.routes.js

import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
} from "../controllers/productController.js";

const router = express.Router();

// Liste de tous les produits
router.get("/", getAllProducts);

// Détail d’un produit (par ID)
router.get("/:id", getProductById);

// Création d’un produit (POST)
router.post("/", createProduct); // à sécuriser plus tard si admin uniquement

export default router;
