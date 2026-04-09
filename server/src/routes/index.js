import { Router } from "express";
import { isDbConnected } from "../db.js";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "websockets-server",
    db: isDbConnected() ? "connected" : "disconnected",
  });
});
