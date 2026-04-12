// src/models/User.js — User Data Model
export const UserModel = {
  table: 'users',
  fields: {
    id: 'UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    email: 'VARCHAR(255) UNIQUE NOT NULL',
    password_hash: 'VARCHAR(255) NOT NULL',
    full_name: 'VARCHAR(255)',
    phone: 'VARCHAR(20)',
    address: 'TEXT',
    role: 'VARCHAR(50) DEFAULT "user"',
    created_at: 'TIMESTAMP DEFAULT NOW()',
    updated_at: 'TIMESTAMP DEFAULT NOW()',
  },
};
