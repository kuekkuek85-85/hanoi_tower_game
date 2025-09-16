import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 하노이타워 기록 테이블 (v0.2에서 사용 예정)
export const hanoiRecords = pgTable("hanoi_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  disks: integer("disks").notNull(),
  moves: integer("moves").notNull(),
  seconds: integer("seconds").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertHanoiRecordSchema = createInsertSchema(hanoiRecords).omit({
  id: true,
  createdAt: true,
});

export type InsertHanoiRecord = z.infer<typeof insertHanoiRecordSchema>;
export type HanoiRecord = typeof hanoiRecords.$inferSelect;

// 기존 사용자 스키마는 유지
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
