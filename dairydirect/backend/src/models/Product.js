// src/models/Product.js — Product Data Model
export const ProductModel = {
  table: 'products',
  fields: {
    id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    name: 'VARCHAR(255) NOT NULL',
    description: 'TEXT',
    price: 'DECIMAL(10, 2) NOT NULL',
    category: 'VARCHAR(100)',
    stock: 'INTEGER DEFAULT 0',
    image_url: 'VARCHAR(500)',
    created_at: 'TIMESTAMP DEFAULT NOW()',
    updated_at: 'TIMESTAMP DEFAULT NOW()',
  },
};
