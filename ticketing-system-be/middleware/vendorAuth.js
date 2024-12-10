const jwt = require("jsonwebtoken");

const authenticateVendor = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const connection = await pool.getConnection();

    try {
      const [vendors] = await connection.execute(
        "SELECT id, email, company_name, is_active FROM vendors WHERE id = ?",
        [decoded.id]
      );

      if (!vendors.length || !vendors[0].is_active) {
        throw new Error("Vendor not found or inactive");
      }

      req.vendor = vendors[0];
      next();
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = { authenticateVendor };
