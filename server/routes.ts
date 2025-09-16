import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertHanoiRecordSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Hanoi game records routes
  app.post("/api/records", async (req, res) => {
    try {
      const recordData = insertHanoiRecordSchema.parse(req.body);
      const record = await storage.createHanoiRecord(recordData);
      res.json(record);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.get("/api/records", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const records = await storage.getHanoiRecords(limit);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch records" });
    }
  });

  app.get("/api/records/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      const records = await storage.searchHanoiRecords(query);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  app.get("/api/records/disks/:diskCount", async (req, res) => {
    try {
      const diskCount = parseInt(req.params.diskCount);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      
      if (diskCount < 3 || diskCount > 10) {
        return res.status(400).json({ error: "Disk count must be between 3 and 10" });
      }
      
      const records = await storage.getHanoiRecordsByDisks(diskCount, limit);
      res.json(records);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch records by disk count" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
