import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "/app/uploads/screenshots";
const PUBLIC_URL = process.env.PUBLIC_URL || "https://ryuukakkoii.site";

export async function saveScreenshot(buffer: Buffer, mimeType: string): Promise<string> {
  // Ensure directory exists
  await mkdir(UPLOAD_DIR, { recursive: true });

  // Generate unique filename
  const ext = mimeType.split("/")[1] || "jpg";
  const filename = `${Date.now()}-${randomUUID()}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);

  // Save file
  await writeFile(filepath, buffer);

  // Return public URL
  return `${PUBLIC_URL}/uploads/screenshots/${filename}`;
}
