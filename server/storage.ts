import { type User, type InsertUser, type HanoiRecord, type InsertHanoiRecord } from "@shared/schema";
import { randomUUID } from "crypto";

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

export const storage = new MemStorage();
