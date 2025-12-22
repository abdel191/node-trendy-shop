import express from "express";
import {
  inscriptionForm,
  inscriptionSubmit,
} from "../controllers/inscriptionController.js";

const router = express.Router();

router.get("/", inscriptionForm);
router.post("/", inscriptionSubmit);

export default router;
