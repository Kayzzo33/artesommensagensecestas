import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Create Supabase Admin client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://gyghrqnhaiazxtdwylbs.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API constraints check
  const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: "Missing authorization header" });
      return;
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    // Set user on response locals
    res.locals.user = user;
    next();
  };

  // API Routes (Server Actions)
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Protect all /api/admin routes
  app.use("/api/admin", requireAuth);

  // Admin routes using the Service Role Key
  app.get("/api/admin/metrics", async (req, res) => {
    try {
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from("orders")
        .select("total, created_at");
      
      const { data: financial, error: financialError } = await supabaseAdmin
        .from("financial_records")
        .select("amount, type");
        
      if (ordersError || financialError) throw new Error("Error fetching metrics");
      
      const revenue = financial?.filter((f) => f.type === "receita").reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
      const expenses = financial?.filter((f) => f.type === "despesa").reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      res.json({
        totalOrders: orders?.length || 0,
        totalRevenue: revenue,
        totalExpenses: expenses,
        profit: revenue - expenses
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
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
