// src/websocketServer.js
const WebSocket = require("ws");
const mysql = require("mysql2/promise");

class TicketWebSocketServer {
  constructor(server, pool) {
    this.wss = new WebSocket.Server({ server });
    this.pool = pool;
    this.clients = new Set();
    this.setupWebSocket();
    this.startTicketUpdates();
  }

  setupWebSocket() {
    this.wss.on("connection", (ws) => {
      console.log("New client connected");
      this.clients.add(ws);

      // Send initial ticket count
      this.sendTicketCount(ws);

      ws.on("close", () => {
        console.log("Client disconnected");
        this.clients.delete(ws);
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    });
  }

  async sendTicketCount(ws) {
    try {
      const connection = await this.pool.getConnection();
      try {
        const [rows] = await connection.execute(
          'SELECT COUNT(*) as count FROM tickets WHERE status = "available"'
        );

        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ availableTickets: rows[0].count }));
        }
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error("Error getting ticket count:", error);
    }
  }

  broadcast(data) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  startTicketUpdates() {
    // Poll for ticket updates every 5 seconds
    setInterval(async () => {
      try {
        const connection = await this.pool.getConnection();
        try {
          const [rows] = await connection.execute(
            'SELECT COUNT(*) as count FROM tickets WHERE status = "available"'
          );
          this.broadcast({ availableTickets: rows[0].count });
        } finally {
          connection.release();
        }
      } catch (error) {
        console.error("Error broadcasting ticket updates:", error);
      }
    }, 5000);
  }
}

module.exports = TicketWebSocketServer;
