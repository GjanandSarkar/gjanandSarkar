// src/routes/user.routes.js — User Routes
import express from "express";
import { getProfile, updateProfile, deleteUser } from "../controllers/userController.js";

const router = express.Router();

// GET /api/users/profile
router.get("/profile", getProfile);

// PATCH /api/users/profile
router.patch("/profile", updateProfile);

// DELETE /api/users/profile
router.delete("/profile", deleteUser);

export default router;
