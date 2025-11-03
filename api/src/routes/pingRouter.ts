import { Router } from "express";
import { pingServer } from "../controllers/pingController";

const router = Router();

router.get("/", pingServer);

export default router;
