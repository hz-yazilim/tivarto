import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { getSession } from "@/lib/session.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Map<string, string>([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

// Dosya imzaları (magic number) — uzantıya güvenmiyoruz.
function detectImageExtension(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return ".png";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return ".jpg";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return ".webp";
  }
  if (buffer.subarray(0, 3).toString("ascii") === "GIF") return ".gif";
  return null;
}

export async function POST(req: Request) {
  try {
    // Yükleme yalnızca giriş yapmış kullanıcılar için.
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Dosya gönderilmedi." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Dosya en fazla 5 MB olabilir." },
        { status: 413 }
      );
    }
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: "Sadece PNG, JPEG, WEBP veya GIF yükleyebilirsiniz." },
        { status: 415 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = detectImageExtension(buffer);
    if (!ext) {
      return NextResponse.json(
        { error: "Dosya içeriği geçerli bir görsel değil." },
        { status: 415 }
      );
    }

    const filename = `${crypto.randomBytes(16).toString("hex")}${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error("upload error", error);
    return NextResponse.json({ error: "Yükleme başarısız." }, { status: 500 });
  }
}
