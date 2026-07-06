import { z } from "zod";

// Firestore 컬렉션: "hanoi_records"
export const insertHanoiRecordSchema = z.object({
  studentId: z.string().min(1),
  studentName: z.string().min(1),
  disks: z.number().int().min(3).max(10),
  moves: z.number().int().min(0),
  seconds: z.number().int().min(0),
});

export type InsertHanoiRecord = z.infer<typeof insertHanoiRecordSchema>;

export interface HanoiRecord extends InsertHanoiRecord {
  id: string;
  createdAt: Date;
}
