import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import cors from "cors";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable CORS for all routes
  app.use(cors());
  app.use(express.json());

  // API Proxy for Polymarket to avoid CORS
  app.get("/api/polymarket", async (req, res) => {
    try {
      console.log("Proxying request to Polymarket...");
      const response = await axios.get('https://gamma-api.polymarket.com/markets', {
        params: {
          active: true,
          closed: false,
          order: 'volume24hr',
          limit: 20
        },
        timeout: 10000 // 10s timeout
      });
      
      res.json(response.data);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error("Proxy error:", errorMessage);
      res.status(500).json({ 
        error: "Failed to fetch from Polymarket",
        details: errorMessage 
      });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
