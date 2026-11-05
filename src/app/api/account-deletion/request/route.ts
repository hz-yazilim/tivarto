import { NextResponse } from "next/server";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 3;

function genericResponse() {
  return NextResponse.json(
    { message: "Bu e-posta bir Tivarto hesabıyla eşleşiyorsa, silme talebini doğrulamak için bir e-posta gönderilecektir." },
    { status: 202 }
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const rateSalt = process.env.ACCOUNT_DELETION_RATE_LIMIT_SALT;
  if (!apiKey || !from || !rateSalt) {
    return NextResponse.json(
      { error: "Hesap silme talep sistemi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin." },
      { status: 503 }
    );
  }

  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const requestFingerprint = createHmac("sha256", rateSalt).update(ip).digest("hex");
  const now = new Date();

  try {
    const recentCount = await prisma.accountDeletionRequest.count({
      where: {
        requestFingerprint,
        createdAt: { gte: new Date(now.getTime() - WINDOW_MS) },
      },
    });
    if (recentCount >= MAX_REQUESTS_PER_WINDOW) {
      return NextResponse.json(
        { error: "Çok fazla talep gönderildi. Lütfen bir süre sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });

    // Same response for known and unknown addresses prevents account enumeration.
    if (!user) return genericResponse();

    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const deletionRequest = await prisma.accountDeletionRequest.create({
      data: {
        userId: user.id,
        tokenHash,
        requestFingerprint,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
      select: { id: true },
    });

    const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL || "https://tivarto.vercel.app");
    if (appUrl.protocol !== "https:") {
      await prisma.accountDeletionRequest.delete({ where: { id: deletionRequest.id } });
      return NextResponse.json({ error: "Hesap silme bağlantısı güvenli HTTPS adresinde yapılandırılmalıdır." }, { status: 503 });
    }
    const verifyUrl = new URL("/hesap-silme/dogrula", appUrl);
    verifyUrl.searchParams.set("token", token);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [user.email],
        subject: "Tivarto hesap silme talebinizi doğrulayın",
        text: [
          "Tivarto hesabınızın silinmesi için talep alındı.",
          "",
          "Talebi onaylamak için aşağıdaki güvenli bağlantıyı 24 saat içinde açın:",
          verifyUrl.toString(),
          "",
          "Bu talebi siz oluşturmadıysanız bu e-postayı yok sayabilirsiniz. Hesabınız silinmez.",
        ].join("\n"),
      }),
    });

    if (!emailResponse.ok) {
      await prisma.accountDeletionRequest.delete({ where: { id: deletionRequest.id } });
      console.error("account deletion email provider rejected request", emailResponse.status);
      return NextResponse.json({ error: "Doğrulama e-postası gönderilemedi. Lütfen daha sonra tekrar deneyin." }, { status: 503 });
    }

    return genericResponse();
  } catch (error) {
    console.error("external account deletion request failed", error);
    return NextResponse.json({ error: "Talep şu anda işlenemiyor. Lütfen daha sonra tekrar deneyin." }, { status: 503 });
  }
}
