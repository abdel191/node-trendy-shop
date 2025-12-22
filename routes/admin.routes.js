import express from "express";
import upload from "../lib/upload.js";

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
  adminStats,
} from "../controllers/adminController.js";

import {
  adminCategories,
  createCategoryForm,
  createCategory,
} from "../controllers/categoryController.js";

import { requireAuth } from "../middlewares/auth.middleware.js";
import { requireAdmin } from "../middlewares/admin.middleware.js";

const router = express.Router();
/* ==========================
   DASHBOARD
========================== */
router.get("/", requireAuth, requireAdmin, adminDashboard);
router.get("/stats", requireAuth, requireAdmin, adminStats);

/* ==========================
   PRODUITS
========================== */
router.get("/products/new", requireAuth, requireAdmin, createProductForm);

router.post(
  "/products/new",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  createProduct
);

router.get("/products/:id/edit", requireAuth, requireAdmin, editProductForm);

router.post(
  "/products/:id/edit",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  updateProduct
);

router.post("/products/:id/delete", requireAuth, requireAdmin, deleteProduct);

/* ==========================
   COMMANDES
========================== */
router.get("/orders", requireAuth, requireAdmin, adminOrders);
router.get("/orders/:id", requireAuth, requireAdmin, adminOrderDetails);

/* ==========================
   UTILISATEURS
========================== */
router.get("/users", requireAuth, requireAdmin, adminUsers);
router.post("/users/:id/toggle-admin", requireAuth, requireAdmin, toggleAdmin);

/* ==========================
   CATEGORIES ✅
========================== */
router.get("/categories", requireAuth, requireAdmin, adminCategories);
router.get("/categories/new", requireAuth, requireAdmin, createCategoryForm);
router.post("/categories/new", requireAuth, requireAdmin, createCategory);

export default router;
