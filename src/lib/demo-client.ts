/**
 * DEMO MODU İÇİN BELLEK İÇİ PRISMA BENZERİ İSTEMCİ
 * =================================================
 * Veritabanı bağlantısı olmadan uygulamanın TÜM sayfa ve server action'larının
 * çalışabilmesi için Prisma'nın bu projede kullanılan sorgu alt kümesini taklit
 * eder. `src/lib/db.ts` demo modundayken gerçek PrismaClient yerine bunu kullanır;
 * mevcut sayfa/action kodlarında değişiklik gerekmez.
 *
 *  - `withTenant()` / `withPlatform()` içindeki `set_config` çağrıları
 *    AsyncLocalStorage ile "RLS bağlamı" olarak tutulur; tenant'a ait
 *    tablolarda sadece o işletmenin satırları görünür.
 *  - Yazma işlemleri aynı Node süreci boyunca kalıcıdır (globalThis), işlem
 *    (transaction) hata verirse başlangıç durumuna geri alınır.
 *  - GERÇEK modda bu dosya kullanılmaz: `DEMO_ACTIVE` kapalıdır.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import { buildDemoStore, type DemoRow, type DemoStore } from "@/lib/demo-data";

type Row = DemoRow;
type Args = Record<string, any>;
type Scope = { tenantId: string | null; platform: boolean };

interface Relation {
  model: string;
  kind: "one" | "many";
  /** Bu satırdaki foreign key (one). */
  fk?: string;
  /** İlişkili tablodaki foreign key (one/many). */
  refFk?: string;
}

/** RLS korumalı (tenantId'li) tablolar. */
const TENANT_SCOPED = new Set([
  "membership",
  "storeSettings",
  "category",
  "product",
  "stockMovement",
  "customer",
  "supplier",
  "goodsReceipt",
  "goodsReceiptItem",
  "order",
  "orderItem",
  "auditLog",
  "payment",
  "supportTicket",
]);

/** Bu projede kullanılan ilişkiler (include/select/_count için). */
const RELATIONS: Record<string, Record<string, Relation>> = {
  plan: { tenants: { model: "tenant", kind: "many", refFk: "planId" } },
  user: {
    memberships: { model: "membership", kind: "many", refFk: "userId" },
    sessions: { model: "session", kind: "many", refFk: "userId" },
    supportTickets: { model: "supportTicket", kind: "many", refFk: "createdById" },
  },
  session: { user: { model: "user", kind: "one", fk: "userId" } },
  tenant: {
    supportTickets: { model: "supportTicket", kind: "many", refFk: "tenantId" },
    plan: { model: "plan", kind: "one", fk: "planId" },
    storeSettings: { model: "storeSettings", kind: "one", refFk: "tenantId" },
    memberships: { model: "membership", kind: "many", refFk: "tenantId" },
    categories: { model: "category", kind: "many", refFk: "tenantId" },
    products: { model: "product", kind: "many", refFk: "tenantId" },
    orders: { model: "order", kind: "many", refFk: "tenantId" },
    payments: { model: "payment", kind: "many", refFk: "tenantId" },
    auditLogs: { model: "auditLog", kind: "many", refFk: "tenantId" },
  },
  membership: {
    user: { model: "user", kind: "one", fk: "userId" },
    tenant: { model: "tenant", kind: "one", fk: "tenantId" },
  },
  storeSettings: { tenant: { model: "tenant", kind: "one", fk: "tenantId" } },
  category: {
    tenant: { model: "tenant", kind: "one", fk: "tenantId" },
    products: { model: "product", kind: "many", refFk: "categoryId" },
  },
  product: {
    tenant: { model: "tenant", kind: "one", fk: "tenantId" },
    category: { model: "category", kind: "one", fk: "categoryId" },
    movements: { model: "stockMovement", kind: "many", refFk: "productId" },
    orderItems: { model: "orderItem", kind: "many", refFk: "productId" },
    goodsReceiptItems: { model: "goodsReceiptItem", kind: "many", refFk: "productId" },
  },
  stockMovement: {
    tenant: { model: "tenant", kind: "one", fk: "tenantId" },
    product: { model: "product", kind: "one", fk: "productId" },
  },
  customer: {
    tenant: { model: "tenant", kind: "one", fk: "tenantId" },
    orders: { model: "order", kind: "many", refFk: "customerId" },
  },
  supplier: {
    tenant: { model: "tenant", kind: "one", fk: "tenantId" },
    goodsReceipts: { model: "goodsReceipt", kind: "many", refFk: "supplierId" },
  },
  goodsReceipt: {
    tenant: { model: "tenant", kind: "one", fk: "tenantId" },
    supplier: { model: "supplier", kind: "one", fk: "supplierId" },
    items: { model: "goodsReceiptItem", kind: "many", refFk: "receiptId" },
  },
  goodsReceiptItem: {
    receipt: { model: "goodsReceipt", kind: "one", fk: "receiptId" },
    product: { model: "product", kind: "one", fk: "productId" },
  },
  order: {
    tenant: { model: "tenant", kind: "one", fk: "tenantId" },
    customer: { model: "customer", kind: "one", fk: "customerId" },
    items: { model: "orderItem", kind: "many", refFk: "orderId" },
  },
  orderItem: {
    order: { model: "order", kind: "one", fk: "orderId" },
    product: { model: "product", kind: "one", fk: "productId" },
  },
  auditLog: { tenant: { model: "tenant", kind: "one", fk: "tenantId" } },
  payment: { tenant: { model: "tenant", kind: "one", fk: "tenantId" } },
  supportTicket: {
    tenant: { model: "tenant", kind: "one", fk: "tenantId" },
    creator: { model: "user", kind: "one", fk: "createdById" },
  },
};

const MODELS = [
  "plan",
  "user",
  "session",
  "tenant",
  "membership",
  "storeSettings",
  "category",
  "product",
  "stockMovement",
  "customer",
  "supplier",
  "goodsReceipt",
  "goodsReceiptItem",
  "order",
  "orderItem",
  "auditLog",
  "payment",
  "featureFlag",
  "platformAuditLog",
  "supportTicket",
];

const scopeStorage = new AsyncLocalStorage<Scope>();
const globalForDemo = globalThis as unknown as {
  __tivartoDemoStore?: DemoStore;
};

function store(): DemoStore {
  if (!globalForDemo.__tivartoDemoStore) {
    globalForDemo.__tivartoDemoStore = buildDemoStore();
  }
  return globalForDemo.__tivartoDemoStore;
}

function rows(model: string): Row[] {
  const db = store();
  if (!db[model]) db[model] = [];
  return db[model];
}

/** RLS bağlamına göre görünür satırlar (nesneler store'daki asıl kayıtlardır). */
function visible(model: string): Row[] {
  const scope = scopeStorage.getStore();
  const all = rows(model);
  if (TENANT_SCOPED.has(model) && scope?.tenantId && !scope.platform) {
    return all.filter((r) => r.tenantId === scope.tenantId);
  }
  return all;
}

function snapshot(): DemoStore {
  const snap: DemoStore = {};
  for (const [model, list] of Object.entries(store())) {
    snap[model] = structuredClone(list);
  }
  return snap;
}

function restore(snap: DemoStore): void {
  const db = store();
  for (const model of Object.keys(db)) {
    if (snap[model]) db[model] = snap[model];
  }
}

function newId(model: string): string {
  return `demo-${model}-${randomUUID().slice(0, 12)}`;
}

function cloneValue(value: any): any {
  if (value instanceof Date) return new Date(value.getTime());
  if (Array.isArray(value)) return value.map(cloneValue);
  if (value && typeof value === "object") return { ...value };
  return value;
}

function comparable(value: any): any {
  if (value === undefined) return null;
  if (value instanceof Date) return value.getTime();
  return value;
}

function equals(a: any, b: any): boolean {
  return comparable(a) === comparable(b);
}

function compare(a: any, b: any): number {
  const x = comparable(a);
  const y = comparable(b);
  if (x === y) return 0;
  if (x === null || x === undefined) return -1;
  if (y === null || y === undefined) return 1;
  if (typeof x === "number" && typeof y === "number") return x < y ? -1 : 1;
  const xs = String(x);
  const ys = String(y);
  return xs < ys ? -1 : 1;
}

function isCondition(value: any): boolean {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

function matchOne(row: Row, key: string, condition: any): boolean {
  const value = comparable(row[key]);
  if (condition === undefined) return true;
  if (!isCondition(condition)) return equals(value, condition);

  for (const [op, operand] of Object.entries(condition)) {
    if (operand === undefined) continue;
    switch (op) {
      case "equals":
        if (!equals(value, operand)) return false;
        break;
      case "not":
        if (equals(value, operand)) return false;
        break;
      case "in":
        if (!Array.isArray(operand) || !operand.some((v) => equals(value, v))) return false;
        break;
      case "notIn":
        if (Array.isArray(operand) && operand.some((v) => equals(value, v))) return false;
        break;
      case "gt":
        if (!(compare(value, operand) > 0)) return false;
        break;
      case "gte":
        if (!(compare(value, operand) >= 0)) return false;
        break;
      case "lt":
        if (!(compare(value, operand) < 0)) return false;
        break;
      case "lte":
        if (!(compare(value, operand) <= 0)) return false;
        break;
      case "contains":
        if (!String(value ?? "").includes(String(operand))) return false;
        break;
      case "startsWith":
        if (!String(value ?? "").startsWith(String(operand))) return false;
        break;
      case "endsWith":
        if (!String(value ?? "").endsWith(String(operand))) return false;
        break;
      default:
        break;
    }
  }
  return true;
}

function matchWhere(row: Row, where: Args | undefined): boolean {
  if (!where) return true;
  for (const [key, condition] of Object.entries(where)) {
    if (condition === undefined) continue;
    if (key === "AND") {
      const list = Array.isArray(condition) ? condition : [condition];
      if (!list.every((w) => matchWhere(row, w))) return false;
      continue;
    }
    if (key === "OR") {
      const list = Array.isArray(condition) ? condition : [condition];
      if (!list.some((w) => matchWhere(row, w))) return false;
      continue;
    }
    if (key === "NOT") {
      const list = Array.isArray(condition) ? condition : [condition];
      if (list.some((w) => matchWhere(row, w))) return false;
      continue;
    }
    if (!matchOne(row, key, condition)) return false;
  }
  return true;
}

function sorted(list: Row[], orderBy: any): Row[] {
  if (!orderBy) return list;
  const specs: Args[] = Array.isArray(orderBy) ? orderBy : [orderBy];
  return [...list].sort((a, b) => {
    for (const spec of specs) {
      for (const [key, direction] of Object.entries(spec)) {
        const result = compare(a[key], b[key]);
        if (result !== 0) return direction === "desc" ? -result : result;
      }
    }
    return 0;
  });
}

function resolveRelation(row: Row, rel: Relation): Row | Row[] | null {
  const all = visible(rel.model);
  const fk = rel.fk;
  const refFk = rel.refFk ?? "id";
  if (rel.kind === "one") {
    if (fk) {
      const foreignId = row[fk];
      if (foreignId === null || foreignId === undefined) return null;
      return all.find((r) => r.id === foreignId) ?? null;
    }
    return all.find((r) => r[refFk] === row.id) ?? null;
  }
  return all.filter((r) => r[refFk] === row.id);
}

function shape(model: string, row: Row, args: Args = {}): Row {
  const out: Row = {};
  const select: Args | undefined =
    args.select && typeof args.select === "object" ? args.select : undefined;

  const shapeRelation = (key: string, spec: any) => {
    const rel = RELATIONS[model]?.[key];
    if (!rel) return;
    const related = resolveRelation(row, rel);
    const nested: Args = spec && typeof spec === "object" ? spec : {};
    out[key] = Array.isArray(related)
      ? related.map((r) => shape(rel.model, r, nested))
      : related
        ? shape(rel.model, related, nested)
        : null;
  };

  const shapeCount = (spec: any) => {
    const selected: Args =
      spec && typeof spec === "object" && spec.select ? spec.select : spec ?? {};
    const counts: Row = {};
    for (const key of Object.keys(selected)) {
      if (!selected[key]) continue;
      const rel = RELATIONS[model]?.[key];
      if (!rel) {
        counts[key] = 0;
        continue;
      }
      const related = resolveRelation(row, rel);
      counts[key] = Array.isArray(related) ? related.length : related ? 1 : 0;
    }
    out._count = counts;
  };

  if (select) {
    for (const [key, spec] of Object.entries(select)) {
      if (!spec) continue;
      if (key === "_count") {
        shapeCount(spec);
        continue;
      }
      if (RELATIONS[model]?.[key]) {
        shapeRelation(key, spec);
        continue;
      }
      out[key] = row[key] === undefined ? null : cloneValue(row[key]);
    }
  } else {
    for (const [key, value] of Object.entries(row)) out[key] = cloneValue(value);
  }

  const include: Args | undefined =
    args.include && typeof args.include === "object" ? args.include : undefined;
  if (include) {
    for (const [key, spec] of Object.entries(include)) {
      if (!spec) continue;
      if (key === "_count") {
        shapeCount(spec);
        continue;
      }
      shapeRelation(key, spec);
    }
  }
  return out;
}

function defaultsFor(model: string): Row {
  const time = new Date();
  const base: Row = { createdAt: time, updatedAt: time };
  switch (model) {
    case "user":
      return { ...base, isPlatformAdmin: false, passwordHash: null, name: "" };
    case "tenant":
      return { ...base, status: "ACTIVE" };
    case "membership":
      return { role: "STAFF" };
    case "storeSettings":
      return { theme: "default", logoUrl: null, coverUrl: null, description: null, phone: null, whatsapp: null, address: null, mapsUrl: null };
    case "category":
      return { sortOrder: 0 };
    case "product":
      return { ...base, categoryId: null, description: null, imageUrl: null, barcode: null, sku: null, buyPrice: null, stock: 0, minStock: 0, isActive: true };
    case "stockMovement":
      return { ...base, note: null, createdBy: null };
    case "customer":
      return { ...base, phone: null, email: null, address: null };
    case "supplier":
      return { ...base, contactPerson: null, phone: null, email: null, address: null };
    case "goodsReceipt":
      return { ...base, supplierId: null, status: "PENDING", note: null, receivedAt: null };
    case "goodsReceiptItem":
      return { expectedQuantity: 0, receivedQuantity: 0, missingQuantity: 0, damagedQuantity: 0, note: null };
    case "order":
      return { ...base, customerId: null, status: "NEW", customerAddress: null, note: null };
    case "orderItem":
      return {};
    case "auditLog":
      return { ...base, userId: null, entityId: null };
    case "payment":
      return { ...base, status: "PENDING", description: null, paidAt: null };
    case "session":
      return { ...base, activeTenantId: null };
    default:
      return {};
  }
}

function applyData(row: Row, data: Args): void {
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (value && typeof value === "object" && !(value instanceof Date)) {
      if (typeof value.increment === "number") {
        row[key] = Number(row[key] ?? 0) + value.increment;
        continue;
      }
      if (typeof value.decrement === "number") {
        row[key] = Number(row[key] ?? 0) - value.decrement;
        continue;
      }
      if (typeof value.set === "number" || value.set === null) {
        row[key] = value.set;
        continue;
      }
    }
    row[key] = cloneValue(value);
  }
  if ("updatedAt" in row) row.updatedAt = new Date();
}

function makeDelegate(model: string) {
  const find = (args: Args = {}) =>
    sorted(visible(model).filter((r) => matchWhere(r, args.where)), args.orderBy);

  return {
    async findMany(args: Args = {}): Promise<Row[]> {
      let list = find(args);
      if (args.skip) list = list.slice(args.skip);
      if (typeof args.take === "number") list = list.slice(0, args.take);
      return list.map((r) => shape(model, r, args));
    },
    async findFirst(args: Args = {}): Promise<Row | null> {
      const row = find(args)[0];
      return row ? shape(model, row, args) : null;
    },
    async findUnique(args: Args = {}): Promise<Row | null> {
      const row = visible(model).find((r) => matchWhere(r, args.where));
      return row ? shape(model, row, args) : null;
    },
    async count(args: Args = {}): Promise<number> {
      return visible(model).filter((r) => matchWhere(r, args.where)).length;
    },
    async aggregate(args: Args = {}): Promise<Row> {
      const list = visible(model).filter((r) => matchWhere(r, args.where));
      const result: Row = {};
      if (args._sum) {
        const sums: Row = {};
        for (const [field, enabled] of Object.entries(args._sum as Args)) {
          if (enabled) {
            sums[field] = list.reduce((sum, r) => sum + Number(r[field] ?? 0), 0);
          }
        }
        result._sum = sums;
      }
      if (args._count) result._count = list.length;
      return result;
    },
    async groupBy(args: Args = {}): Promise<Row[]> {
      const list = visible(model).filter((r) => matchWhere(r, args.where));
      const by: string[] = Array.isArray(args.by) ? args.by : [args.by];
      const groups = new Map<string, Row[]>();
      for (const row of list) {
        const key = JSON.stringify(by.map((field) => comparable(row[field])));
        const group = groups.get(key) ?? [];
        group.push(row);
        groups.set(key, group);
      }
      return [...groups.entries()].map(([key, group]) => {
        const out: Row = {};
        const values = JSON.parse(key);
        by.forEach((field, index) => {
          out[field] = values[index];
        });
        if (args._count) {
          const counts: Row = {};
          if (args._count._all) counts._all = group.length;
          out._count = counts;
        }
        return out;
      });
    },
    async create(args: Args): Promise<Row> {
      const data: Args = args.data ?? {};
      const row: Row = { ...defaultsFor(model), ...{ id: data.id ?? newId(model) } };
      applyData(row, data);
      rows(model).push(row);
      return shape(model, row, args);
    },
    async createMany(args: Args): Promise<{ count: number }> {
      const list: Args[] = Array.isArray(args.data) ? args.data : [args.data];
      for (const data of list) {
        const row: Row = { ...defaultsFor(model), ...{ id: data.id ?? newId(model) } };
        applyData(row, data);
        rows(model).push(row);
      }
      return { count: list.length };
    },
    async update(args: Args): Promise<Row> {
      const row = visible(model).find((r) => matchWhere(r, args.where));
      if (!row) throw new Error(`Demo kayıt bulunamadı: ${model}`);
      applyData(row, args.data ?? {});
      return shape(model, row, args);
    },
    async updateMany(args: Args): Promise<{ count: number }> {
      const list = visible(model).filter((r) => matchWhere(r, args.where));
      for (const row of list) applyData(row, args.data ?? {});
      return { count: list.length };
    },
    async delete(args: Args): Promise<Row> {
      const row = visible(model).find((r) => matchWhere(r, args.where));
      if (!row) throw new Error(`Demo kayıt bulunamadı: ${model}`);
      const db = store();
      db[model] = db[model].filter((r) => r !== row);
      return shape(model, row, args);
    },
    async deleteMany(args: Args = {}): Promise<{ count: number }> {
      const doomed = visible(model).filter((r) => matchWhere(r, args.where));
      const ids = new Set(doomed);
      const db = store();
      db[model] = db[model].filter((r) => !ids.has(r));
      return { count: doomed.length };
    },
    async upsert(args: Args): Promise<Row> {
      const row = visible(model).find((r) => matchWhere(r, args.where));
      if (row) {
        applyData(row, args.update ?? {});
        return shape(model, row, args);
      }
      return makeDelegate(model).create({ data: args.create ?? {} });
    },
  };
}

export function createDemoClient(): any {
  const client: Args = {
    async $transaction(fnOrArray: any): Promise<any> {
      const parent = scopeStorage.getStore();
      const scope: Scope = {
        tenantId: parent?.tenantId ?? null,
        platform: parent?.platform ?? false,
      };
      const snap = snapshot();
      try {
        return await scopeStorage.run(scope, async () => {
          if (typeof fnOrArray === "function") return fnOrArray(client);
          if (Array.isArray(fnOrArray)) return Promise.all(fnOrArray);
          return undefined;
        });
      } catch (error) {
        restore(snap);
        throw error;
      }
    },
    async $executeRaw(strings: TemplateStringsArray, ...values: any[]): Promise<number> {
      const scope = scopeStorage.getStore();
      for (let index = 0; index < values.length; index++) {
        const before = strings.slice(0, index + 1).join("");
        if (!scope) continue;
        if (before.includes("app.tenant_id")) {
          scope.tenantId = String(values[index]);
        } else if (before.includes("app.platform")) {
          scope.platform = values[index] === "on" || values[index] === true;
        }
      }
      return 1;
    },
    async $executeRawUnsafe(): Promise<number> {
      return 1;
    },
    async $queryRaw(): Promise<Row[]> {
      return [{ "?column?": 1 }];
    },
    async $connect(): Promise<void> {},
    async $disconnect(): Promise<void> {},
  };

  for (const model of MODELS) client[model] = makeDelegate(model);
  return client;
}
