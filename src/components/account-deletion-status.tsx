"use client";

import { useSearchParams } from "next/navigation";

export default function AccountDeletionStatus() {
  const params = useSearchParams();
  const status = params.get("status");
  const messages: Record<string, { title: string; body: string }> = {
    completed: { title: "Hesabınız silindi", body: "Hesap giriş bilgileriniz ve oturumlarınız kaldırıldı. İşletmenin ortak kayıtları diğer yetkili kullanıcılar için korunur." },
    "owner-transfer": { title: "Önce işletme sahipliği devredilmeli", body: "E-posta adresiniz doğrulandı. Hesabınız bir veya daha fazla işletmenin sahibi olduğu için silme işlemi beklemede. Uygulamaya giriş yapıp Ekip bölümünden başka bir kullanıcıya sahipliği devredin; ardından Hesabım ve Verilerim bölümünden silmeyi tamamlayın. Giriş yapamıyorsanız destek adresine yazın." },
    invalid: { title: "Talep doğrulanamadı", body: "Bağlantı geçersiz, süresi dolmuş veya daha önce kullanılmış olabilir. Yeni talep oluşturabilirsiniz." },
    error: { title: "İşlem tamamlanamadı", body: "Silme işlemi sırasında bir hata oluştu. Lütfen destek ekibiyle iletişime geçin." },
  };
  if (!status || !messages[status]) return null;
  const item = messages[status];
  return <div role="status" className="mt-5 rounded-xl border border-purple-400/25 bg-purple-500/10 p-4"><h2 className="font-semibold text-white">{item.title}</h2><p className="mt-2 text-sm leading-6 text-zinc-300">{item.body}</p></div>;
}
