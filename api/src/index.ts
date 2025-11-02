import express from "express";
import chatRouter from "./routes/chatRouter";
import pingRouter from "./routes/pingRouter";
import cors from "cors";

const app = express();
app.use(express.json());

app.use(cors());
app.use("/api/ping", pingRouter);
app.use("/api/chat", chatRouter);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
