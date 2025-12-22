import express from "express";
import upload from "../lib/upload.js";
import { adminStats } from "../controllers/adminController.js";
import {
  adminDashboard,
  createProductForm,
  createProduct,
  editProductForm,
  updateProduct,
  deleteProduct,
  adminOrders,
  adminOrderDetails,
  adminUsers,
  toggleAdmin,
  adminCategories,
  createCategory,
  createCategoryForm,
} from "../controllers/adminController.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";

const router = express.Router();

/* ==========================
   DASHBOARD ADMIN
========================== */
router.get("/", requireAuth, requireAdmin, adminDashboard);

/* ==========================
   PRODUITS
========================== */

// ➕ FORMULAIRE CRÉATION
router.get("/products/new", requireAuth, requireAdmin, createProductForm);

// ➕ CRÉATION (UPLOAD IMAGE)
router.post(
  "/products/new",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  createProduct
);

// ✏️ FORMULAIRE ÉDITION
router.get("/products/:id/edit", requireAuth, requireAdmin, editProductForm);

// ✏️ MISE À JOUR (UPLOAD IMAGE OPTIONNEL)
router.post(
  "/products/:id/edit",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  updateProduct
);

// 🗑️ SUPPRESSION
router.post("/products/:id/delete", requireAuth, requireAdmin, deleteProduct);

/* ==========================
   COMMANDES
========================== */

// 📦 LISTE
router.get("/orders", requireAuth, requireAdmin, adminOrders);

// 🔍 DÉTAIL
router.get("/orders/:id", requireAuth, requireAdmin, adminOrderDetails);

/* ==========================
   UTILISATEURS
========================== */

router.get("/users", requireAuth, requireAdmin, adminUsers);

router.post("/users/:id/toggle-admin", requireAuth, requireAdmin, toggleAdmin);

router.get("/stats", requireAuth, requireAdmin, adminStats);

// 📂 Catégories
router.get("/categories", requireAuth, requireAdmin, adminCategories);
router.post("/categories", requireAuth, requireAdmin, createCategory);
router.post("/categories/new", requireAuth, requireAdmin, createCategory);
router.get("/categories/new", requireAuth, requireAdmin, createCategoryForm);
export default router;
