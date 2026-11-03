/**
 * Veritabanı olmadan çalışan yönetici önizlemesi.
 * Sahte işletme, müşteri, personel, sipariş veya ödeme kayıtları üretilmez.
 * Yönetici paneli boş başlangıç verileriyle açılır.
 */
import { DEMO_USERS } from "@/lib/constants";

export type DemoRow = Record<string, unknown>;
export type DemoStore = Record<string, DemoRow[]>;

export function buildDemoStore(): DemoStore {
  return {
    plan: [],
    user: [
      {
        ...DEMO_USERS.admin,
        passwordHash: "demo",
        createdAt: new Date(),
      },
    ],
    session: [],
    tenant: [],
    membership: [],
    storeSettings: [],
    category: [],
    product: [],
    stockMovement: [],
    customer: [],
    supplier: [],
    goodsReceipt: [],
    goodsReceiptItem: [],
    order: [],
    orderItem: [],
    auditLog: [],
    payment: [],
    featureFlag: [],
    platformAuditLog: [],
    supportTicket: [],
  };
}
