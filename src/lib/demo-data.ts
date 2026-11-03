/**
 * Demo modu için örnek veri (veritabanı olmadan çalışır).
 *
 * Bu dosyadaki veriler GERÇEK müşteri/işletme verisi değildir; tamamı
 * uydurulmuş kayıtlardır. Amaç: veritabanı bağlantısı kurulana kadar üç
 * panelin (platform / işletme / müşteri) gezilebilir olması.
 *
 * Veriler sunucu sürecinde globalThis üzerinde tutulur; demo sırasında
 * yapılan ekleme/silme işlemleri aynı süreç boyunca görünür kalır, süreç
 * yeniden başladığında bu dosyadaki başlangıç verisine döner.
 */
import {
  DEMO_CUSTOMER_PHONE,
  DEMO_TENANT_ID,
  DEMO_USERS,
} from "@/lib/constants";

export type DemoRow = Record<string, unknown>;
export type DemoStore = Record<string, DemoRow[]>;

const T = DEMO_TENANT_ID;
const T2 = "demo-tenant-kahve";
const T3 = "demo-tenant-teknoloji";

const now = new Date();
const ago = (days: number, hours = 0) =>
  new Date(now.getTime() - days * 86_400_000 - hours * 3_600_000);

const nullable = {
  logoUrl: null,
  coverUrl: null,
  description: null,
  phone: null,
  whatsapp: null,
  address: null,
  mapsUrl: null,
};

const products: DemoRow[] = [
  { id: "demo-p-01", tenantId: T, categoryId: "demo-c-baharat", name: "Karabiber Öğütülmüş 100 g", description: "Taze öğütülmüş, yoğun aromalı karabiber.", imageUrl: null, barcode: "8690000000011", sku: "BH-001", buyPrice: 52, sellPrice: 89.9, stock: 4, minStock: 10, isActive: true, createdAt: ago(55) },
  { id: "demo-p-02", tenantId: T, categoryId: "demo-c-baharat", name: "Pul Biber 100 g", description: "Orta acılıkta, kırmızı pul biber.", imageUrl: null, barcode: "8690000000028", sku: "BH-002", buyPrice: 44, sellPrice: 74.5, stock: 62, minStock: 10, isActive: true, createdAt: ago(54) },
  { id: "demo-p-03", tenantId: T, categoryId: "demo-c-baharat", name: "Sumak 100 g", description: "Salatalar ve kebaplar için ekşi sumak.", imageUrl: null, barcode: "8690000000035", sku: "BH-003", buyPrice: 40, sellPrice: 69.9, stock: 3, minStock: 8, isActive: true, createdAt: ago(52) },
  { id: "demo-p-04", tenantId: T, categoryId: "demo-c-baharat", name: "Tarçın Çubuk 50 g", description: "Seylan tarçın, çubuk formunda.", imageUrl: null, barcode: "8690000000042", sku: "BH-004", buyPrice: 31, sellPrice: 55, stock: 28, minStock: 5, isActive: true, createdAt: ago(48) },
  { id: "demo-p-05", tenantId: T, categoryId: "demo-c-cay", name: "Siyah Çay 500 g", description: "Rize yöresi harmanı, dökme çay.", imageUrl: null, barcode: "8690000000059", sku: "CY-001", buyPrice: 120, sellPrice: 189, stock: 40, minStock: 10, isActive: true, createdAt: ago(46) },
  { id: "demo-p-06", tenantId: T, categoryId: "demo-c-cay", name: "Türk Kahvesi 250 g", description: "Orta kavrulmuş, ince öğütülmüş.", imageUrl: null, barcode: "8690000000066", sku: "CY-002", buyPrice: 145, sellPrice: 219.9, stock: 18, minStock: 8, isActive: true, createdAt: ago(44) },
  { id: "demo-p-07", tenantId: T, categoryId: "demo-c-kuruyemis", name: "Antep Fıstığı 250 g", description: "Kavrulmuş, tuzlu Antep fıstığı.", imageUrl: null, barcode: "8690000000073", sku: "KY-001", buyPrice: 230, sellPrice: 329, stock: 0, minStock: 5, isActive: true, createdAt: ago(41) },
  { id: "demo-p-08", tenantId: T, categoryId: "demo-c-kuruyemis", name: "Badem İçi 250 g", description: "Çiğ badem içi, katkısız.", imageUrl: null, barcode: "8690000000080", sku: "KY-002", buyPrice: 165, sellPrice: 249, stock: 22, minStock: 6, isActive: true, createdAt: ago(38) },
  { id: "demo-p-09", tenantId: T, categoryId: "demo-c-bakliyat", name: "Kırmızı Mercimek 1 kg", description: "Yeni sezon, elenmiş.", imageUrl: null, barcode: "8690000000097", sku: "BK-001", buyPrice: 58, sellPrice: 94.5, stock: 55, minStock: 12, isActive: true, createdAt: ago(35) },
  { id: "demo-p-10", tenantId: T, categoryId: "demo-c-bakliyat", name: "Nohut 1 kg", description: "İri taneli koçbaşı nohut.", imageUrl: null, barcode: "8690000000103", sku: "BK-002", buyPrice: 55, sellPrice: 89, stock: 33, minStock: 10, isActive: true, createdAt: ago(33) },
  { id: "demo-p-11", tenantId: T, categoryId: "demo-c-genel", name: "Natürel Sızma Zeytinyağı 1 L", description: "Soğuk sıkım, asitliği düşük.", imageUrl: null, barcode: "8690000000110", sku: "GN-001", buyPrice: 240, sellPrice: 349, stock: 12, minStock: 5, isActive: true, createdAt: ago(29) },
  { id: "demo-p-12", tenantId: T, categoryId: "demo-c-genel", name: "Çiçek Balı 500 g", description: "Yerli üretim süzme çiçek balı.", imageUrl: null, barcode: "8690000000127", sku: "GN-002", buyPrice: 185, sellPrice: 279, stock: 9, minStock: 10, isActive: true, createdAt: ago(24) },
  { id: "demo-p-13", tenantId: T, categoryId: "demo-c-genel", name: "Kuru Nane 50 g (Eski Seri)", description: "Satışı durdurulmuş eski seri ürün.", imageUrl: null, barcode: "8690000000134", sku: "GN-003", buyPrice: 20, sellPrice: 39.9, stock: 0, minStock: 3, isActive: false, createdAt: ago(20) },
  // Diğer işletmeler (platform panelinde kullanım sayıları görünsün diye)
  { id: "demo-p-t2-1", tenantId: T2, categoryId: "demo-c-t2", name: "Filtre Kahve 250 g", description: "Orta kavrum öğütülmüş kahve.", imageUrl: null, barcode: null, sku: "KF-001", buyPrice: 160, sellPrice: 259, stock: 34, minStock: 8, isActive: true, createdAt: ago(30) },
  { id: "demo-p-t2-2", tenantId: T2, categoryId: "demo-c-t2", name: "V60 Kağıt Filtre 100'lü", description: "Beyaz kağıt filtre.", imageUrl: null, barcode: null, sku: "KF-002", buyPrice: 60, sellPrice: 99, stock: 15, minStock: 5, isActive: true, createdAt: ago(28) },
  { id: "demo-p-t3-1", tenantId: T3, categoryId: "demo-c-t3", name: "USB-C HUB 6'sı 1 Arada", description: "HDMI + USB 3.0 + PD.", imageUrl: null, barcode: null, sku: "TK-001", buyPrice: 420, sellPrice: 699, stock: 11, minStock: 4, isActive: true, createdAt: ago(26) },
];

for (const p of products) p.updatedAt = p.createdAt;
const productById = new Map(products.map((p) => [String(p.id), p]));

interface OrderSpec {
  id: string;
  days: number;
  customerName: string;
  customerPhone: string;
  customerId: string | null;
  status: string;
  note?: string;
  lines: { productId: string; quantity: number }[];
}

const orderSpecs: OrderSpec[] = [
  { id: "demo-o-01", days: 0.2, customerName: "Zeynep Kaya", customerPhone: DEMO_CUSTOMER_PHONE, customerId: "demo-cust-01", status: "NEW", note: "Akşam teslim rica ediyorum.", lines: [{ productId: "demo-p-05", quantity: 2 }, { productId: "demo-p-06", quantity: 1 }] },
  { id: "demo-o-02", days: 2, customerName: "Zeynep Kaya", customerPhone: DEMO_CUSTOMER_PHONE, customerId: "demo-cust-01", status: "PREPARING", lines: [{ productId: "demo-p-02", quantity: 2 }, { productId: "demo-p-03", quantity: 1 }] },
  { id: "demo-o-03", days: 14, customerName: "Zeynep Kaya", customerPhone: DEMO_CUSTOMER_PHONE, customerId: "demo-cust-01", status: "COMPLETED", lines: [{ productId: "demo-p-11", quantity: 1 }] },
  { id: "demo-o-04", days: 0.6, customerName: "Ali Demir", customerPhone: "0532 111 22 33", customerId: "demo-cust-02", status: "NEW", lines: [{ productId: "demo-p-09", quantity: 3 }, { productId: "demo-p-10", quantity: 2 }] },
  { id: "demo-o-05", days: 4, customerName: "Elif Çelik", customerPhone: "0542 444 55 66", customerId: "demo-cust-03", status: "CONFIRMED", lines: [{ productId: "demo-p-04", quantity: 2 }, { productId: "demo-p-08", quantity: 1 }] },
  { id: "demo-o-06", days: 9, customerName: "Mehmet Şahin", customerPhone: "0551 777 88 99", customerId: "demo-cust-04", status: "COMPLETED", lines: [{ productId: "demo-p-01", quantity: 1 }, { productId: "demo-p-02", quantity: 1 }, { productId: "demo-p-05", quantity: 1 }] },
  { id: "demo-o-07", days: 20, customerName: "Kalem Ofis Ltd.", customerPhone: "0212 555 00 11", customerId: "demo-cust-05", status: "CANCELLED", note: "Müşteri vazgeçti.", lines: [{ productId: "demo-p-12", quantity: 2 }] },
];

const orderItems: DemoRow[] = [];
const orders: DemoRow[] = orderSpecs.map((spec) => {
  const lines = spec.lines.map((line, index) => {
    const product = productById.get(line.productId)!;
    const unitPrice = Number(product.sellPrice);
    return {
      id: `${spec.id}-item-${index + 1}`,
      tenantId: T,
      orderId: spec.id,
      productId: line.productId,
      name: product.name,
      unitPrice,
      quantity: line.quantity,
    };
  });
  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  orderItems.push(...lines);
  return {
    id: spec.id,
    tenantId: T,
    customerId: spec.customerId,
    status: spec.status,
    customerName: spec.customerName,
    customerPhone: spec.customerPhone,
    customerAddress: spec.customerId === "demo-cust-01" ? "Caferağa Mah. Moda Cad. No:8 D:3 Kadıköy / İstanbul" : null,
    note: spec.note ?? null,
    total,
    createdAt: ago(spec.days),
  };
});

const receiptSpecs = [
  { id: "demo-gr-01", days: 12, supplierId: "demo-sup-01", status: "RECEIVED", note: "Haftalık baharat sevkiyatı.", lines: [{ productId: "demo-p-02", expected: 40, received: 40, missing: 0, damaged: 0 }, { productId: "demo-p-04", expected: 20, received: 20, missing: 0, damaged: 0 }] },
  { id: "demo-gr-02", days: 5, supplierId: "demo-sup-02", status: "PARTIAL", note: "1 koli hasarlı geldi.", lines: [{ productId: "demo-p-05", expected: 30, received: 24, missing: 4, damaged: 2 }, { productId: "demo-p-06", expected: 15, received: 15, missing: 0, damaged: 0 }] },
];

const goodsReceiptItems: DemoRow[] = [];
const goodsReceipts: DemoRow[] = receiptSpecs.map((spec) => {
  spec.lines.forEach((line, index) => {
    goodsReceiptItems.push({
      id: `${spec.id}-item-${index + 1}`,
      tenantId: T,
      receiptId: spec.id,
      productId: line.productId,
      expectedQuantity: line.expected,
      receivedQuantity: line.received,
      missingQuantity: line.missing,
      damagedQuantity: line.damaged,
      note: null,
    });
  });
  return {
    id: spec.id,
    tenantId: T,
    supplierId: spec.supplierId,
    status: spec.status,
    note: spec.note,
    receivedAt: ago(spec.days),
    createdAt: ago(spec.days),
    updatedAt: ago(spec.days),
  };
});

export function buildDemoStore(): DemoStore {
  return {
    plan: [
      { id: "demo-plan-1", name: "Başlangıç", priceMonthly: 399, maxProducts: 500, maxStorageMb: 5000 },
      { id: "demo-plan-2", name: "Profesyonel", priceMonthly: 799, maxProducts: 5000, maxStorageMb: 25000 },
      { id: "demo-plan-3", name: "Kurumsal", priceMonthly: 1499, maxProducts: 50000, maxStorageMb: 100000 },
    ],
    user: [
      { ...DEMO_USERS.admin, passwordHash: "demo", createdAt: ago(90) },
      { ...DEMO_USERS.business, passwordHash: "demo", createdAt: ago(80) },
      { id: "demo-user-staff", email: "personel@tiverto.dev", passwordHash: "demo", name: "Mehmet Demir", isPlatformAdmin: false, createdAt: ago(70) },
      { ...DEMO_USERS.customer, passwordHash: "demo", createdAt: ago(40) },
      { id: "demo-user-kahve", email: "kahve@tiverto.dev", passwordHash: "demo", name: "Deniz Arslan", isPlatformAdmin: false, createdAt: ago(50) },
      { id: "demo-user-teknoloji", email: "teknoloji@tiverto.dev", passwordHash: "demo", name: "Burak Koç", isPlatformAdmin: false, createdAt: ago(45) },
    ],
    session: [],
    tenant: [
      { id: T, slug: "demo", name: "Demo Baharat & Gıda", status: "ACTIVE", planId: "demo-plan-2", createdAt: ago(80) },
      { id: T2, slug: "kahve-dunyasi", name: "Kahve Dünyası", status: "ACTIVE", planId: "demo-plan-1", createdAt: ago(50) },
      { id: T3, slug: "teknoloji-market", name: "Teknoloji Market", status: "SUSPENDED", planId: "demo-plan-3", createdAt: ago(45) },
    ],
    membership: [
      // Demo kolaylığı: platform yöneticisi de işletme panelini gezebilir.
      { id: "demo-m-0", tenantId: T, userId: DEMO_USERS.admin.id, role: "OWNER" },
      { id: "demo-m-1", tenantId: T, userId: DEMO_USERS.business.id, role: "OWNER" },
      { id: "demo-m-2", tenantId: T, userId: "demo-user-staff", role: "STAFF" },
      { id: "demo-m-3", tenantId: T2, userId: "demo-user-kahve", role: "OWNER" },
      { id: "demo-m-4", tenantId: T3, userId: "demo-user-teknoloji", role: "OWNER" },
    ],
    storeSettings: [
      { id: "demo-ss-1", tenantId: T, ...nullable, theme: "default", description: "Kadıköy'den 1986'dan beri baharat, çay, kuruyemiş ve bakliyat. Tüm ürünlerimiz özenle seçilir.", phone: "0216 330 12 45", whatsapp: "905321234567", address: "Caferağa Mah. Moda Cad. No:12, Kadıköy / İstanbul" },
      { id: "demo-ss-2", tenantId: T2, theme: "modern", ...nullable },
      { id: "demo-ss-3", tenantId: T3, theme: "minimal", ...nullable },
    ],
    category: [
      { id: "demo-c-genel", tenantId: T, name: "Genel", sortOrder: 1 },
      { id: "demo-c-baharat", tenantId: T, name: "Baharatlar", sortOrder: 2 },
      { id: "demo-c-cay", tenantId: T, name: "Çay & Kahve", sortOrder: 3 },
      { id: "demo-c-kuruyemis", tenantId: T, name: "Kuruyemiş", sortOrder: 4 },
      { id: "demo-c-bakliyat", tenantId: T, name: "Bakliyat", sortOrder: 5 },
      { id: "demo-c-t2", tenantId: T2, name: "Kahve", sortOrder: 1 },
      { id: "demo-c-t3", tenantId: T3, name: "Aksesuar", sortOrder: 1 },
    ],
    product: products.map((p) => ({ ...p })),
    stockMovement: [
      { id: "demo-sm-01", tenantId: T, productId: "demo-p-02", type: "IN", quantity: 40, note: "Mal kabul: demo-gr-01", createdBy: DEMO_USERS.business.id, createdAt: ago(12) },
      { id: "demo-sm-02", tenantId: T, productId: "demo-p-04", type: "IN", quantity: 20, note: "Mal kabul: demo-gr-01", createdBy: DEMO_USERS.business.id, createdAt: ago(12) },
      { id: "demo-sm-03", tenantId: T, productId: "demo-p-05", type: "IN", quantity: 24, note: "Mal kabul: demo-gr-02", createdBy: DEMO_USERS.business.id, createdAt: ago(5) },
      { id: "demo-sm-04", tenantId: T, productId: "demo-p-06", type: "IN", quantity: 15, note: "Mal kabul: demo-gr-02", createdBy: DEMO_USERS.business.id, createdAt: ago(5) },
      { id: "demo-sm-05", tenantId: T, productId: "demo-p-05", type: "OUT", quantity: 1, note: "Vitrin siparişi: demo-o-01", createdBy: "storefront", createdAt: ago(0.2) },
      { id: "demo-sm-06", tenantId: T, productId: "demo-p-06", type: "OUT", quantity: 1, note: "Vitrin siparişi: demo-o-01", createdBy: "storefront", createdAt: ago(0.2) },
      { id: "demo-sm-07", tenantId: T, productId: "demo-p-11", type: "OUT", quantity: 1, note: "Vitrin siparişi: demo-o-03", createdBy: "storefront", createdAt: ago(14) },
      { id: "demo-sm-08", tenantId: T, productId: "demo-p-01", type: "ADJUST", quantity: 2, note: "Stok sayımı ile azaltıldı", createdBy: DEMO_USERS.business.id, createdAt: ago(18) },
    ],
    customer: [
      { id: "demo-cust-01", tenantId: T, name: "Zeynep Kaya", phone: DEMO_CUSTOMER_PHONE, email: "musteri@tiverto.dev", address: "Caferağa Mah. Moda Cad. No:8 D:3 Kadıköy / İstanbul", createdAt: ago(40) },
      { id: "demo-cust-02", tenantId: T, name: "Ali Demir", phone: "0532 111 22 33", email: "ali@ornek.com", address: "Moda / İstanbul", createdAt: ago(30) },
      { id: "demo-cust-03", tenantId: T, name: "Elif Çelik", phone: "0542 444 55 66", email: "elif@ornek.com", address: null, createdAt: ago(25) },
      { id: "demo-cust-04", tenantId: T, name: "Mehmet Şahin", phone: "0551 777 88 99", email: null, address: "Üsküdar / İstanbul", createdAt: ago(20) },
      { id: "demo-cust-05", tenantId: T, name: "Kalem Ofis Ltd.", phone: "0212 555 00 11", email: "siparis@kalemofis.com", address: "Levent / İstanbul", createdAt: ago(28) },
    ],
    supplier: [
      { id: "demo-sup-01", tenantId: T, name: "Bahar Tedarik A.Ş.", contactPerson: "Hakan Usta", phone: "0216 441 10 10", email: "siparis@bahartedarik.com", address: "Mersin", createdAt: ago(60) },
      { id: "demo-sup-02", tenantId: T, name: "Rize Çay Deposu", contactPerson: "Selin Aksoy", phone: "0464 222 33 44", email: null, address: "Rize", createdAt: ago(55) },
      { id: "demo-sup-03", tenantId: T, name: "Anadolu Kuruyemiş", contactPerson: "Osman Yıldız", phone: "0342 333 22 11", email: null, address: "Gaziantep", createdAt: ago(48) },
    ],
    goodsReceipt: goodsReceipts.map((r) => ({ ...r })),
    goodsReceiptItem: goodsReceiptItems.map((r) => ({ ...r })),
    order: orders.map((o) => ({ ...o })),
    orderItem: orderItems.map((o) => ({ ...o })),
    auditLog: [
      { id: "demo-log-01", tenantId: T, userId: DEMO_USERS.business.id, action: "order.create.storefront", entity: "Order", entityId: "demo-o-01", createdAt: ago(0.2) },
      { id: "demo-log-02", tenantId: T, userId: DEMO_USERS.business.id, action: "goodsReceipt.create", entity: "GoodsReceipt", entityId: "demo-gr-02", createdAt: ago(5) },
      { id: "demo-log-03", tenantId: T, userId: DEMO_USERS.business.id, action: "storeSettings.update", entity: "StoreSettings", entityId: T, createdAt: ago(8) },
      { id: "demo-log-04", tenantId: T, userId: "demo-user-staff", action: "product.update", entity: "Product", entityId: "demo-p-01", createdAt: ago(18) },
      { id: "demo-log-05", tenantId: T, userId: DEMO_USERS.business.id, action: "order.status.completed", entity: "Order", entityId: "demo-o-03", createdAt: ago(14) },
      { id: "demo-log-06", tenantId: T, userId: null, action: "payment.create", entity: "Payment", entityId: "demo-pay-01", createdAt: ago(30) },
      { id: "demo-log-07", tenantId: T2, userId: null, action: "tenant.create", entity: "Tenant", entityId: T2, createdAt: ago(50) },
      { id: "demo-log-08", tenantId: T3, userId: null, action: "tenant.status.suspended", entity: "Tenant", entityId: T3, createdAt: ago(3) },
    ],
    payment: [
      { id: "demo-pay-01", tenantId: T, amount: 799, status: "PAID", description: "Ekim 2026 abonelik", paidAt: ago(30), createdAt: ago(30) },
      { id: "demo-pay-02", tenantId: T, amount: 799, status: "PAID", description: "Eylül 2026 abonelik", paidAt: ago(60), createdAt: ago(60) },
      { id: "demo-pay-03", tenantId: T2, amount: 399, status: "PAID", description: "Ekim 2026 abonelik", paidAt: ago(28), createdAt: ago(28) },
      { id: "demo-pay-04", tenantId: T3, amount: 1499, status: "PENDING", description: "Ekim 2026 abonelik", paidAt: null, createdAt: ago(20) },
    ],
    featureFlag: [
      { id: "demo-flag-01", key: "new_inventory", name: "Yeni stok deneyimi", description: "Gelişmiş stok hareketleri ekranı", enabled: true, category: "product", updatedAt: ago(2), updatedBy: "system" },
      { id: "demo-flag-02", key: "beta_reports", name: "Gelişmiş raporlar", description: "Yeni rapor ekranları için kontrollü erişim", enabled: false, category: "product", updatedAt: ago(1), updatedBy: "system" },
      { id: "demo-flag-03", key: "maintenance_mode", name: "Bakım modu", description: "Yeni işletme işlemlerini geçici olarak sınırlar; uygulamada ayrıca kontrol edilmelidir", enabled: false, category: "operations", updatedAt: ago(4), updatedBy: "system" },
    ],
    platformAuditLog: [
      { id: "demo-pa-01", actorId: DEMO_USERS.admin.id, action: "tenant.status.suspended", targetType: "Tenant", targetId: T3, reason: "Örnek denetim kaydı", beforeData: { status: "ACTIVE" }, afterData: { status: "SUSPENDED" }, createdAt: ago(3) },
    ],
    supportTicket: [
      { id: "demo-ticket-01", tenantId: T, createdById: DEMO_USERS.business.id, subject: "Ürün fotoğrafı yüklenmiyor", description: "Ürün düzenleme ekranında görsel ekleyemiyorum.", status: "OPEN", priority: "NORMAL", resolutionNote: null, createdAt: ago(1), updatedAt: ago(1) },
      { id: "demo-ticket-02", tenantId: T2, createdById: DEMO_USERS.business.id, subject: "Vitrin adresi hakkında", description: "Mağaza bağlantımı değiştirmek istiyorum.", status: "IN_PROGRESS", priority: "HIGH", resolutionNote: null, createdAt: ago(2), updatedAt: ago(1) },
    ],
  };
}
