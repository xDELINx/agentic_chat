import { Router } from "express";
import { streamChat } from "../controllers/chatController";

const router = Router();

// POST /chat
router.post("/", streamChat);

export default router;
