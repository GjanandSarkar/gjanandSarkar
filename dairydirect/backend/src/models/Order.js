// src/models/Order.js — Order Data Model
export const OrderModel = {
  table: "orders",
  fields: {
    id: "UUID PRIMARY KEY DEFAULT gen_random_uuid()",
    user_id: "UUID NOT NULL REFERENCES users(id)",
    items: "JSONB NOT NULL",
    total_price: "DECIMAL(10, 2) NOT NULL",
    shipping_address: "TEXT",
    status: 'VARCHAR(50) DEFAULT "pending"',
    created_at: "TIMESTAMP DEFAULT NOW()",
    updated_at: "TIMESTAMP DEFAULT NOW()",
  },
};
