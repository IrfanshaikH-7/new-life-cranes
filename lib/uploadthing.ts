import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getSession } from "./session";

const f = createUploadthing();

export const uploadRouter = {
  /** Up to 4 site photos, max 4 MB each */
  sitePhotos: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
    .middleware(async () => {
      const session = await getSession();
      if (!session) throw new Error("Unauthorized");
      return { userId: session.userId };
    })
    .onUploadComplete(() => {}),

  /** Single bill/receipt photo, max 4 MB */
  billPhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getSession();
      if (!session) throw new Error("Unauthorized");
      return { userId: session.userId };
    })
    .onUploadComplete(() => {}),

  /** Staff profile avatar, max 2 MB */
  avatar: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getSession();
      if (!session || session.role !== "admin") throw new Error("Unauthorized");
      return { userId: session.userId };
    })
    .onUploadComplete(() => {}),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
