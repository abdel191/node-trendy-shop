import express from "express";

import { homeIndex } from "../controllers/homeController.js";

const router = express.Router();
router.get("/", homeIndex);
//router.get("/about", aboutIndex);
//router.get("/dashbord", dashbord);

export default router;
