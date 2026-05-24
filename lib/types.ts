import type { ObjectId } from "mongodb";

export type Role = "admin" | "staff";

export interface UserDoc {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  avatar?: string | null; // UploadThing URL
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionPayload {
  userId: string;
  role: Role;
  email: string;
  name: string;
  expiresAt: number;
  [key: string]: unknown;
}

export const VEHICLE_NUMBERS = [
  "TS 09 FT 9375",
  "TS 12 ED 2215",
  "TS 12 EK 6351",
  "AP 29 AE 0809",
  "TS 12 EE 0800",
] as const;

export type VehicleNumber = (typeof VEHICLE_NUMBERS)[number];

export interface SubmissionDoc {
  _id?: ObjectId;
  userId: string;
  userName: string;
  placeOfWork: string;
  workDescription: string;
  vehicleNumber: VehicleNumber;
  /** ISO string — set to submission creation time if not provided */
  startTime: string;
  /** ISO string — null until staff ends the shift */
  endTime: string | null;
  /** If edited, the new start time goes here; original startTime is preserved */
  editedStartTime: string | null;
  diesel: boolean;
  dieselAmount: number | null; // price in ₹, only when diesel === true
  images: string[]; // UploadThing URLs, max 4
  /** Optional bill/receipt photo — UploadThing URL, added during edit */
  billPhoto: string | null;
  /** Admin marks this submission as paid */
  paid: boolean;
  /** Admin remark / note */
  adminRemark: string | null;
  createdAt: Date;
  updatedAt: Date;
}
