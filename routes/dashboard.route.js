import express from "express";
import {
  userDashboard,
  orderDetails,
} from "../controllers/dashboardController.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Dashboard utilisateur (UNE SEULE ROUTE)
router.get("/", requireAuth, userDashboard);
// Détails d'une commande
router.get("/orders/:id", requireAuth, orderDetails);

export default router;
