import express from "express";
import {
  forgotPasswordForm,
  forgotPasswordSubmit,
  resetPasswordForm,
  resetPasswordSubmit,
} from "../controllers/passwordController.js";

const router = express.Router();

// Mot de passe oublié
router.get("/forgot", forgotPasswordForm);
router.post("/forgot", forgotPasswordSubmit);

// Reset mot de passe
router.get("/reset-password/:token", resetPasswordForm);
router.post("/reset-password/:token", resetPasswordSubmit);

export default router;
