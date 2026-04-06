import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Simulated WhatsApp Webhook
  app.post("/api/whatsapp/webhook", (req, res) => {
    const { from, body } = req.body;
    console.log(`[WhatsApp Webhook Received] From: ${from}, Body: ${body}`);
    res.json({ status: "received" });
  });

  // Simulated Cron Job for Reminders
  // In a real app, this would be a scheduled task (e.g., Bull, Cron)
  app.post("/api/admin/trigger-reminders", async (req, res) => {
    console.log("[Cron] Triggering daily reminders for tomorrow at 10:00 AM...");
    // Here we would query Firestore for appointments tomorrow
    // and send messages via Twilio/WhatsApp API
    res.json({ status: "triggered", count: 0 });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
