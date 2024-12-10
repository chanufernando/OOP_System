// src/server.js
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const http = require("http");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const TicketWebSocketServer = require("./websocket");
const { createInitialTickets } = require("./utils/ticketUtils");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ticketing_system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Initialize WebSocket server
const wsServer = new TicketWebSocketServer(server, pool);

let isSystemRunning = true;

// Test database connection
app.get("/api/health", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    res.json({ status: "healthy", message: "Database connection successful" });
  } catch (error) {
    console.error("Database connection failed:", error);
    res
      .status(500)
      .json({ status: "unhealthy", message: "Database connection failed" });
  }
});

// Vendor login route
app.post("/api/vendor/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const connection = await pool.getConnection();
    try {
      const [vendors] = await connection.execute(
        "SELECT * FROM vendors WHERE email = ?",
        [email]
      );

      if (!vendors.length) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const vendor = vendors[0];
      const passwordMatch = await bcrypt.compare(
        password,
        vendor.password_hash
      );

      bcrypt.hash(password, 10).then((hash) => console.log(hash));

      console.log(vendor.password_hash);

      if (!passwordMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!vendor.is_active) {
        return res.status(403).json({ error: "Account is inactive" });
      }

      // Update last login
      await connection.execute(
        "UPDATE vendors SET last_login = NOW() WHERE id = ?",
        [vendor.id]
      );

      const token = jwt.sign(
        { id: vendor.id, email: vendor.email },
        "your-secret-key", // Replace with actual secret from environment variables
        { expiresIn: "24h" }
      );

      res.json({
        token,
        vendor: {
          id: vendor.id,
          email: vendor.email,
          company_name: vendor.company_name,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Vendor dashboard route
app.get("/api/vendor/dashboard", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, "your-secret-key"); // Replace with actual secret

    const connection = await pool.getConnection();
    try {
      // Get vendor's configurations
      const [configs] = await connection.execute(
        "SELECT * FROM configurations WHERE vendor_id = ? AND is_active = true",
        [decoded.id]
      );

      // Get vendor's analytics
      const [analytics] = await connection.execute(
        `SELECT SUM(tickets_sold) as total_sold, SUM(revenue) as total_revenue 
         FROM vendor_analytics 
         WHERE vendor_id = ? AND date = CURDATE()`,
        [decoded.id]
      );

      // Get vendor's notifications
      const [notifications] = await connection.execute(
        `SELECT * FROM vendor_notifications 
         WHERE vendor_id = ? AND is_read = false 
         ORDER BY created_at DESC LIMIT 5`,
        [decoded.id]
      );

      res.json({
        configurations: configs,
        analytics: analytics[0],
        notifications,
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Dashboard error:", error);
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// Customer registration
app.post("/api/customer/register", async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    const connection = await pool.getConnection();
    try {
      // Check if email already exists
      const [existing] = await connection.execute(
        "SELECT id FROM customers WHERE email = ?",
        [email]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new customer
      const [result] = await connection.execute(
        `INSERT INTO customers (name, email, password_hash, phone)
         VALUES (?, ?, ?, ?)`,
        [name, email, hashedPassword, phone]
      );

      // Generate token
      const token = jwt.sign(
        { id: result.insertId, email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(201).json({
        message: "Registration successful",
        token,
        customer: {
          id: result.insertId,
          name,
          email,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Customer login
app.post("/api/customer/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const connection = await pool.getConnection();
    try {
      const [customers] = await connection.execute(
        "SELECT * FROM customers WHERE email = ?",
        [email]
      );

      if (!customers.length) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const customer = customers[0];
      const validPassword = await bcrypt.compare(
        password,
        customer.password_hash
      );

      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      if (!customer.is_active) {
        return res.status(403).json({ error: "Account is inactive" });
      }

      // Update last login
      await connection.execute(
        "UPDATE customers SET last_login = NOW() WHERE id = ?",
        [customer.id]
      );

      const token = jwt.sign(
        { id: customer.id, email: customer.email },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        token,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Middleware to authenticate customer
const authenticateCustomer = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.customer = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Get customer profile
app.get("/api/customer/profile", authenticateCustomer, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [customer] = await connection.execute(
        `SELECT id, name, email, phone, created_at 
         FROM customers WHERE id = ?`,
        [req.customer.id]
      );

      if (!customer.length) {
        return res.status(404).json({ error: "Customer not found" });
      }

      res.json(customer[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Add payment method
app.post(
  "/api/customer/payment-methods",
  authenticateCustomer,
  async (req, res) => {
    const { cardType, lastFour, expiryMonth, expiryYear } = req.body;

    try {
      const connection = await pool.getConnection();
      try {
        const [result] = await connection.execute(
          `INSERT INTO customer_payment_methods 
         (customer_id, card_type, last_four, expiry_month, expiry_year)
         VALUES (?, ?, ?, ?, ?)`,
          [req.customer.id, cardType, lastFour, expiryMonth, expiryYear]
        );

        res.status(201).json({
          message: "Payment method added successfully",
          paymentMethodId: result.insertId,
        });
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Payment method error:", error);
      res.status(500).json({ error: "Failed to add payment method" });
    }
  }
);

// Add to cart
app.post("/api/customer/cart/add", authenticateCustomer, async (req, res) => {
  const { ticketId } = req.body;

  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if ticket is available
      const [tickets] = await connection.execute(
        'SELECT id, status FROM tickets WHERE id = ? AND status = "available"',
        [ticketId]
      );

      if (!tickets.length) {
        throw new Error("Ticket not available");
      }

      // Add to cart with 15-minute expiry
      await connection.execute(
        `INSERT INTO shopping_cart (customer_id, ticket_id, expires_at)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE))`,
        [req.customer.id, ticketId]
      );

      // Update ticket status
      await connection.execute(
        'UPDATE tickets SET status = "reserved" WHERE id = ?',
        [ticketId]
      );

      await connection.commit();
      res.json({ message: "Ticket added to cart" });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ error: error.message || "Failed to add to cart" });
  }
});

// Get cart items
app.get("/api/customer/cart", authenticateCustomer, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [items] = await connection.execute(
        `SELECT sc.*, t.ticket_number, t.price
         FROM shopping_cart sc
         JOIN tickets t ON sc.ticket_id = t.id
         WHERE sc.customer_id = ? AND sc.expires_at > NOW()`,
        [req.customer.id]
      );

      res.json(items);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ error: "Failed to fetch cart items" });
  }
});

// Cart cleanup (add this near your other interval tasks)
setInterval(async () => {
  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get expired cart items
      const [expired] = await connection.execute(
        `SELECT ticket_id FROM shopping_cart 
         WHERE expires_at <= NOW()`
      );

      if (expired.length > 0) {
        const ticketIds = expired.map((item) => item.ticket_id);

        // Release tickets
        await connection.execute(
          `UPDATE tickets SET status = "available" 
           WHERE id IN (?)`,
          [ticketIds]
        );

        // Remove expired cart items
        await connection.execute(
          "DELETE FROM shopping_cart WHERE expires_at <= NOW()"
        );
      }

      await connection.commit();
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Cart cleanup error:", error);
  }
}, 60000);

// Admin login endpoint
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await pool.getConnection();
    try {
      const [admins] = await connection.execute(
        "SELECT * FROM admins WHERE username = ? AND is_active = TRUE",
        [username]
      );

      if (admins.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const admin = admins[0];
      const isValidPassword = await bcrypt.compare(
        password,
        admin.password_hash
      );

      bcrypt.hash(password, 10).then((hash) => console.log(hash));

      console.log(admin.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Update last login
      await connection.execute(
        "UPDATE admins SET last_login = NOW() WHERE id = ?",
        [admin.id]
      );

      const token = jwt.sign(
        { id: admin.id, username: admin.username, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      res.json({
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get configuration
app.get("/api/config", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        "SELECT * FROM configurations WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1"
      );
      res.json(rows[0] || {});
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error retrieving configuration:", error);
    res.status(500).json({ error: "Failed to retrieve configuration" });
  }
});

// Save configuration
app.post("/api/config", async (req, res) => {
  const { totalTickets, releaseRate, retrievalRate, maxCapacity } = req.body;

  if (!totalTickets || !releaseRate || !retrievalRate || !maxCapacity) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Set all existing configurations to inactive
      await connection.execute(
        "UPDATE configurations SET is_active = FALSE WHERE is_active = TRUE"
      );

      // Insert new configuration
      const [result] = await connection.execute(
        "INSERT INTO configurations (total_tickets, release_rate, retrieval_rate, max_capacity) VALUES (?, ?, ?, ?)",
        [totalTickets, releaseRate, retrievalRate, maxCapacity]
      );

      // Create initial tickets based on configuration
      for (let i = 0; i < totalTickets; i++) {
        await connection.execute(
          'INSERT INTO tickets (ticket_number, status, price, configuration_id) VALUES (?, "available", ?, ?)',
          [`TICKET-${result.insertId}-${i + 1}`, 10.0, result.insertId]
        );
      }

      await connection.commit();

      res.json({
        message: "Configuration saved successfully",
        configId: result.insertId,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error saving configuration:", error);
    res.status(500).json({ error: "Failed to save configuration" });
  }
});

// Get available tickets count
app.get("/api/tickets/available", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      // Get total tickets
      const [totalResult] = await connection.execute(
        "SELECT COUNT(*) as total FROM tickets"
      );

      // Get available tickets
      const [availableResult] = await connection.execute(
        'SELECT COUNT(*) as available FROM tickets WHERE status = "available"'
      );

      // Get reserved tickets
      const [reservedResult] = await connection.execute(
        'SELECT COUNT(*) as reserved FROM tickets WHERE status = "reserved"'
      );

      const ticketStats = {
        total: totalResult[0].total,
        availableTickets: availableResult[0].available,
        reserved: reservedResult[0].reserved,
      };

      res.json(ticketStats);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error retrieving ticket counts:", error);
    res.status(500).json({ error: "Failed to retrieve ticket information" });
  }
});

// Get detailed ticket status (optional endpoint for more detailed information)
app.get("/api/tickets/status", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(`
          SELECT 
            status,
            COUNT(*) as count
          FROM tickets
          GROUP BY status
        `);

      res.json(rows);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error retrieving ticket status:", error);
    res.status(500).json({ error: "Failed to retrieve ticket status" });
  }
});

// Get a specific ticket's information (optional endpoint)
app.get("/api/tickets/:id", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        "SELECT * FROM tickets WHERE id = ?",
        [req.params.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      res.json(rows[0]);
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error retrieving ticket:", error);
    res.status(500).json({ error: "Failed to retrieve ticket" });
  }
});

// Book tickets
app.post("/api/tickets/book", async (req, res) => {
  const { numberOfTickets, userDetails } = req.body;

  if (!numberOfTickets || numberOfTickets <= 0) {
    return res.status(400).json({ error: "Invalid number of tickets" });
  }

  try {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if enough tickets are available
      const [availableTickets] = await connection.execute(
        'SELECT COUNT(*) as count FROM tickets WHERE status = "available"'
      );

      if (availableTickets[0].count < numberOfTickets) {
        throw new Error("Not enough tickets available");
      }

      // Get the tickets to book
      const [tickets] = await connection.execute(
        'SELECT id FROM tickets WHERE status = "available" LIMIT ?',
        [numberOfTickets]
      );

      // Create user if not exists
      const [userResult] = await connection.execute(
        "INSERT INTO users (name, email, phone) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)",
        [userDetails.name, userDetails.email, userDetails.phone]
      );
      const userId = userResult.insertId;

      // Create order
      const [orderResult] = await connection.execute(
        "INSERT INTO orders (user_id, order_number, status, total_amount) VALUES (?, ?, ?, ?)",
        [userId, `ORD-${Date.now()}`, "pending", numberOfTickets * 10.0]
      );
      const orderId = orderResult.insertId;

      // Update ticket status and create order items
      for (const ticket of tickets) {
        await connection.execute(
          'UPDATE tickets SET status = "reserved", reserved_at = NOW() WHERE id = ?',
          [ticket.id]
        );

        await connection.execute(
          "INSERT INTO order_items (order_id, ticket_id, price) VALUES (?, ?, ?)",
          [orderId, ticket.id, 10.0]
        );
      }

      await connection.commit();

      res.json({
        message: "Booking successful",
        orderId,
        ticketCount: numberOfTickets,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error booking tickets:", error);
    res.status(500).json({ error: error.message || "Failed to book tickets" });
  }
});

// Get logs with pagination and filters
app.get("/api/logs", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      severity,
      eventType,
      startDate,
      endDate,
    } = req.query;

    const offset = (page - 1) * limit;
    const connection = await pool.getConnection();

    try {
      // Build WHERE clause based on filters
      let whereConditions = [];
      let params = [];

      if (severity) {
        whereConditions.push("severity = ?");
        params.push(severity);
      }

      if (eventType) {
        whereConditions.push("event_type = ?");
        params.push(eventType);
      }

      if (startDate) {
        whereConditions.push("created_at >= ?");
        params.push(startDate);
      }

      if (endDate) {
        whereConditions.push("created_at <= ?");
        params.push(endDate);
      }

      const whereClause = whereConditions.length
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

      // Get total count
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as total FROM logs ${whereClause}`,
        params
      );

      // Get logs with pagination
      const [logs] = await connection.execute(
        `SELECT * FROM logs ${whereClause} 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      res.json({
        logs,
        total: countResult[0].total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(countResult[0].total / limit),
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Error retrieving logs:", error);
    res.status(500).json({ error: "Failed to retrieve logs" });
  }
});

app.post("/api/system/toggle", async (req, res) => {
  try {
    const { status } = req.body;
    isSystemRunning = status;

    // If system is stopped, temporarily disable ticket operations
    if (!isSystemRunning) {
      await connection.execute(
        "UPDATE configurations SET is_active = FALSE WHERE is_active = TRUE"
      );
    }

    res.json({ status: isSystemRunning });
  } catch (error) {
    console.error("Error toggling system:", error);
    res.status(500).json({ error: "Failed to toggle system status" });
  }
});

// Add middleware to check system status
const checkSystemStatus = (req, res, next) => {
  if (!isSystemRunning && req.method !== "GET") {
    return res.status(503).json({ error: "System is currently stopped" });
  }
  next();
};

app.use("/api/config", checkSystemStatus);
app.use("/api/tickets", checkSystemStatus);

const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 8080;

server.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
  console.log(`WebSocket Server running on port ${PORT}`);
});
