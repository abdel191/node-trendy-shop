import express from "express";
import {
  showLogin,
  loginUser,
  logoutUser,
} from "../controllers/connexionController.js";

const router = express.Router();

// PAGE CONNEXION
router.get("/", showLogin);

// TRAITEMENT CONNEXION
router.post("/", loginUser);

// DÉCONNEXION
router.get("/logout", logoutUser);

export default router;
