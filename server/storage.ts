import { type User, type InsertUser, type HanoiRecord, type InsertHanoiRecord, users, hanoiRecords } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, desc, or, ilike } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Hanoi game records
  createHanoiRecord(record: InsertHanoiRecord): Promise<HanoiRecord>;
  getHanoiRecords(limit?: number): Promise<HanoiRecord[]>;
  searchHanoiRecords(query: string): Promise<HanoiRecord[]>;
  getHanoiRecordsByDisks(disks: number, limit?: number): Promise<HanoiRecord[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private hanoiRecords: Map<string, HanoiRecord>;

  constructor() {
    this.users = new Map();
    this.hanoiRecords = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createHanoiRecord(insertRecord: InsertHanoiRecord): Promise<HanoiRecord> {
    const id = randomUUID();
    const record: HanoiRecord = {
      ...insertRecord,
      id,
      createdAt: new Date(),
    };
    this.hanoiRecords.set(id, record);
    return record;
  }

  async getHanoiRecords(limit = 50): Promise<HanoiRecord[]> {
    const records = Array.from(this.hanoiRecords.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
    return records;
  }

  async searchHanoiRecords(query: string): Promise<HanoiRecord[]> {
    const records = Array.from(this.hanoiRecords.values())
      .filter(record => 
        record.studentId.includes(query) || 
        record.studentName.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return records;
  }

  async getHanoiRecordsByDisks(disks: number, limit = 50): Promise<HanoiRecord[]> {
    const records = Array.from(this.hanoiRecords.values())
      .filter(record => record.disks === disks)
      .sort((a, b) => a.moves - b.moves || a.seconds - b.seconds)
      .slice(0, limit);
    return records;
  }
}

// DatabaseStorage 구현
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createHanoiRecord(insertRecord: InsertHanoiRecord): Promise<HanoiRecord> {
    const [record] = await db
      .insert(hanoiRecords)
      .values(insertRecord)
      .returning();
    return record;
  }

  async getHanoiRecords(limit = 50): Promise<HanoiRecord[]> {
    const records = await db
      .select()
      .from(hanoiRecords)
      .orderBy(desc(hanoiRecords.createdAt))
      .limit(limit);
    return records;
  }

  async searchHanoiRecords(query: string): Promise<HanoiRecord[]> {
    const records = await db
      .select()
      .from(hanoiRecords)
      .where(
        or(
          ilike(hanoiRecords.studentId, `%${query}%`),
          ilike(hanoiRecords.studentName, `%${query}%`)
        )
      )
      .orderBy(desc(hanoiRecords.createdAt));
    return records;
  }

  async getHanoiRecordsByDisks(disks: number, limit = 50): Promise<HanoiRecord[]> {
    const records = await db
      .select()
      .from(hanoiRecords)
      .where(eq(hanoiRecords.disks, disks))
      .orderBy(hanoiRecords.moves, hanoiRecords.seconds)
      .limit(limit);
    return records;
  }
}

// 프로덕션에서는 DatabaseStorage 사용, 개발 중에는 MemStorage도 가능
export const storage = new DatabaseStorage();
