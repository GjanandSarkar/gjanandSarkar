// src/utils/jwt.util.js — JWT Sign & Verify Helpers

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Sign a JWT token for a user
 * @param {Object} payload - { userId, role }
 * @returns {string} JWT token
 */
export const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify and decode a JWT token
 * @param {string} token
 * @returns {Object} decoded payload
 * @throws {JsonWebTokenError|TokenExpiredError}
 */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
