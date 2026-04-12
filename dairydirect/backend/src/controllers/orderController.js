// src/controllers/orderController.js — Order Controller
import { supabase } from "../utils/supabase.js";
import { log } from "../utils/logger.js";

export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, totalPrice, shippingAddress } = req.body;

    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          user_id: userId,
          items,
          total_price: totalPrice,
          shipping_address: shippingAddress,
          status: "pending",
        },
      ])
      .select();

    if (error) {
      return res.status(400).json({
        error: "Order creation failed",
        message: error.message,
      });
    }

    log.info("Order created:", data[0].id);

    res.status(201).json({
      message: "Order created successfully",
      order: data[0],
    });
  } catch (error) {
    log.error("Create order error:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({
        error: "Failed to fetch orders",
        message: error.message,
      });
    }

    res.json({
      message: "Orders retrieved",
      orders: data,
    });
  } catch (error) {
    log.error("Get orders error:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      return res.status(404).json({
        error: "Order not found",
      });
    }

    res.json({
      message: "Order retrieved",
      order: data,
    });
  } catch (error) {
    log.error("Get order error:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) {
      return res.status(400).json({
        error: "Update failed",
        message: error.message,
      });
    }

    log.info("Order status updated:", id);

    res.json({
      message: "Order updated successfully",
      order: data[0],
    });
  } catch (error) {
    log.error("Update order error:", error);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};
