import { Router } from "express";
import { handleChat } from "../controllers/chatController";

const router = Router();

// POST /chat
router.post("/", handleChat);

export default router;
