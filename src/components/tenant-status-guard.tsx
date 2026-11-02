/**
 * İşletme askıya alınmışsa panelde uyarı gösterir.
 * Veriyi silmez; sadece bilgilendirir (platform yöneticisi durumu düzeltir).
 */
export default function TenantStatusGuard({ role }: { role: string }) {
  return (
    <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <strong>İşletme hesabınız askıya alınmış.</strong> Panel görüntülenebilir
      ancak vitrinde sipariş alınmaz. Detay için platform yönetimiyle iletişime
      geçin. {role === "OWNER" ? "(Hesap sahibi)" : ""}
    </div>
  );
}
