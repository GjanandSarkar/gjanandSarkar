import jwt from "jsonwebtoken";

const JWT_SECRET = "secret123";

// 📩 SEND OTP (DEV MODE)
export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    // Validate phone
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        error: "Phone must be a valid 10-digit Indian mobile number",
      });
    }

    // DEV OTP
    const otp = "123456";

    console.log("OTP (DEV MODE):", otp);

    return res.status(200).json({
      success: true,
      data: {
        message: "OTP sent successfully (DEV MODE)",
        otp,
        expiresInMinutes: 5,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// 🔐 VERIFY OTP
export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        error: "Phone and OTP are required",
      });
    }

    if (otp !== "123456") {
      return res.status(400).json({
        success: false,
        error: "Invalid OTP",
      });
    }

    const token = jwt.sign(
      { phone, role: "CUSTOMER" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: "user_" + phone,
          phone,
          role: "CUSTOMER",
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};