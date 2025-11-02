import { Router } from "express";
import { pingServer } from "../controllers/pingController";

const router = Router();

// GET /ping
router.get("/", pingServer);

export default router;
