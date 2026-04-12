import jwt from "jsonwebtoken";

const JWT_SECRET = "secret123";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. Provide a valid Bearer token.",
      });
    }

    // ✅ Extract token
    const token = authHeader.split(" ")[1];

    // ❌ Token missing
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Token missing",
      });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user
    req.user = decoded;

    next();
  } catch (error) {
    console.error("JWT Error:", error.message);

    return res.status(401).json({
      success: false,
      error: "Invalid token. Please login again.",
    });
  }
};