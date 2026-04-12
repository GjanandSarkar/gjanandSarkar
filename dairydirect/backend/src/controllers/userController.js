// src/controllers/userController.js — User Controller
import { supabase } from "../utils/supabase.js";
import { log } from "../utils/logger.js";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json({
      message: "User profile retrieved",
      user: data,
    });
  } catch (error) {
    log.error("Get profile error:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    // Only name can be updated (phone is unique identifier)
    if (!name) {
      return res.status(400).json({
        error: "Name is required",
      });
    }

    const { data, error } = await supabase
      .from("users")
      .update({
        name: name,
      })
      .eq("id", userId)
      .select();

    if (error) {
      return res.status(400).json({
        error: "Update failed",
        message: error.message,
      });
    }

    log.info("User profile updated:", userId);

    res.json({
      message: "Profile updated successfully",
      user: data[0],
    });
  } catch (error) {
    log.error("Update profile error:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase.from("users").delete().eq("id", userId);

    if (error) {
      return res.status(400).json({
        error: "Deletion failed",
        message: error.message,
      });
    }

    log.info("User deleted:", userId);

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    log.error("Delete user error:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};
