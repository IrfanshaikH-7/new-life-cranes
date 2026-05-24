import type { ObjectId } from "mongodb";

export type Role = "admin" | "staff";

export interface UserDoc {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
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

export interface SubmissionDoc {
  _id?: ObjectId;
  userId: string;
  userName: string;
  placeOfWork: string;
  workDescription: string;
  images: string[]; // base64 data URLs, max 4
  createdAt: Date;
}
