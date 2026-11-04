import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import crypto from "crypto";
import { getTenantContext } from "@/lib/session.server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Map<string, string>([["image/png", ".png"], ["image/jpeg", ".jpg"], ["image/webp", ".webp"], ["image/gif", ".gif"]]);
function detectImageExtension(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return ".png";
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return ".jpg";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return ".webp";
  if (buffer.subarray(0, 3).toString("ascii") === "GIF") return ".gif";
  return null;
}
export async function POST(req: Request) {
  try {
    let context: Awaited<ReturnType<typeof getTenantContext>>;
    try { context = await getTenantContext(); } catch { return NextResponse.json({ error: "İşletme oturumu gerekli." }, { status: 403 }); }
    if (context.tenant.status !== "ACTIVE") return NextResponse.json({ error: "Askıya alınmış işletmeler dosya yükleyemez." }, { status: 403 });
    if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Kalıcı dosya depolama şu anda yapılandırılmamış." }, { status: 503 });
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Dosya gönderilmedi." }, { status: 400 });
    if (file.size <= 0) return NextResponse.json({ error: "Boş dosya yüklenemez." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "Dosya en fazla 5 MB olabilir." }, { status: 413 });
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Sadece PNG, JPEG, WEBP veya GIF yükleyebilirsiniz." }, { status: 415 });
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = detectImageExtension(buffer);
    if (!ext || ALLOWED.get(file.type) !== ext) return NextResponse.json({ error: "Dosya içeriği seçilen görsel türüyle eşleşmiyor." }, { status: 415 });
    const pathname = `tenants/${context.tenant.id}/${crypto.randomBytes(16).toString("hex")}${ext}`;
    const blob = await put(pathname, buffer, { access: "public", addRandomSuffix: false, contentType: file.type, cacheControlMaxAge: 31536000 });
    return NextResponse.json({ url: blob.url, pathname: blob.pathname }, { status: 201 });
  } catch (error) {
    console.error("persistent upload error", error);
    return NextResponse.json({ error: "Görsel kalıcı depolamaya yüklenemedi. Lütfen tekrar deneyin." }, { status: 500 });
  }
}
