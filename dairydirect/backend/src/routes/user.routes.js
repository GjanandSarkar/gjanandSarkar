import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/me", authenticate, (req, res) => {
  return res.json({
    success: true,
    data: {
      id: "user_" + req.user.phone,
      phone: req.user.phone,
      role: req.user.role,
    },
  });
});

export default router;