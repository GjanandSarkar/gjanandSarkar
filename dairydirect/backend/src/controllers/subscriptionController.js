// src/controllers/subscriptionController.js — Subscription Controller
import { supabase } from "../utils/supabase.js";
import { log } from "../utils/logger.js";

export const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        product_variants (
          label,
          price,
          products (name, image_url)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({
        error: "Failed to fetch subscriptions",
        message: error.message,
      });
    }

    res.json({
      message: "Subscriptions retrieved",
      subscriptions: data,
    });
  } catch (error) {
    log.error("Get subscriptions error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    const { variantId, quantity, frequency, startDate, endDate } = req.body;

    const { data, error } = await supabase
      .from("subscriptions")
      .insert([
        {
          user_id: userId,
          variant_id: variantId,
          quantity,
          frequency,
          start_date: startDate,
          end_date: endDate,
          status: "ACTIVE",
        },
      ])
      .select();

    if (error) {
      return res.status(400).json({
        error: "Subscription creation failed",
        message: error.message,
      });
    }

    log.info("Subscription created:", data[0].id);

    res.status(201).json({
      message: "Subscription created successfully",
      subscription: data[0],
    });
  } catch (error) {
    log.error("Create subscription error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      return res.status(404).json({ error: "Subscription not found" });
    }

    res.json({ message: "Subscription retrieved", subscription: data });
  } catch (error) {
    log.error("Get subscription error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, quantity, frequency } = req.body;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("subscriptions")
      .update({ status, quantity, frequency })
      .eq("id", id)
      .eq("user_id", userId)
      .select();

    if (error) {
      return res.status(400).json({
        error: "Update failed",
        message: error.message,
      });
    }

    log.info("Subscription updated:", id);

    res.json({
      message: "Subscription updated successfully",
      subscription: data[0],
    });
  } catch (error) {
    log.error("Update subscription error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("subscriptions")
      .update({ status: "CANCELLED" })
      .eq("id", id)
      .eq("user_id", userId)
      .select();

    if (error) {
      return res.status(400).json({
        error: "Cancellation failed",
        message: error.message,
      });
    }

    log.info("Subscription cancelled:", id);

    res.json({ message: "Subscription cancelled successfully" });
  } catch (error) {
    log.error("Cancel subscription error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};