"use server";

import { requireTenantContext } from '@/lib/session.server';
import { withTenant } from '@/lib/db';

const DAY = 24 * 60 * 60 * 1000;

export async function getBusinessInsights() {
  const { tenant } = await requireTenantContext();
  const now = new Date();
  const last30Start = new Date(now.getTime() - 30 * DAY);
  const last60Start = new Date(now.getTime() - 60 * DAY);

  const data = await withTenant(tenant.id, async (tx) => {
    const [products, orders] = await Promise.all([
      tx.product.findMany({
        where: { tenantId: tenant.id, isActive: true },
        select: {
          id: true,
          name: true,
          stock: true,
          minStock: true,
          buyPrice: true,
          sellPrice: true,
          createdAt: true,
          category: { select: { name: true } },
        },
      }),
      tx.order.findMany({
        where: {
          tenantId: tenant.id,
          createdAt: { gte: last60Start },
          status: { not: 'CANCELLED' },
        },
        orderBy: { createdAt: 'desc' },
        take: 2000,
        select: {
          id: true,
          customerId: true,
          customerName: true,
          total: true,
          createdAt: true,
          items: {
            select: {
              productId: true,
              name: true,
              quantity: true,
              unitPrice: true,
            },
          },
        },
      }),
    ]);
    return { products, orders };
  });

  const recentOrders = data.orders.filter((order) => order.createdAt >= last30Start);
  const previousOrders = data.orders.filter((order) => order.createdAt < last30Start);
  const revenue30 = recentOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const revenuePrevious30 = previousOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const revenueChangePercent = revenuePrevious30 > 0
    ? ((revenue30 - revenuePrevious30) / revenuePrevious30) * 100
    : null;

  const productById = new Map(data.products.map((product) => [product.id, product]));
  const productSales = new Map<string, { current: number; previous: number; revenue: number }>();

  for (const order of data.orders) {
    const isRecent = order.createdAt >= last30Start;
    for (const item of order.items) {
      const current = productSales.get(item.productId) ?? { current: 0, previous: 0, revenue: 0 };
      if (isRecent) {
        current.current += item.quantity;
        current.revenue += Number(item.unitPrice) * item.quantity;
      } else {
        current.previous += item.quantity;
      }
      productSales.set(item.productId, current);
    }
  }

  const reorderSuggestions = data.products
    .map((product) => {
      const sales = productSales.get(product.id) ?? { current: 0, previous: 0, revenue: 0 };
      const averageDaily = sales.current / 30;
      const coverageDays = averageDaily > 0 ? product.stock / averageDaily : null;
      const needsReorder =
        (product.minStock > 0 && product.stock <= product.minStock) ||
        (coverageDays !== null && coverageDays < 14);
      const suggestedQuantity = Math.max(
        0,
        Math.ceil(averageDaily * 21 - product.stock),
        product.minStock > 0 ? product.minStock * 2 - product.stock : 0,
      );
      return {
        id: product.id,
        name: product.name,
        category: product.category?.name ?? 'Kategorisiz',
        stock: product.stock,
        minStock: product.minStock,
        averageDaily,
        coverageDays,
        suggestedQuantity,
        sales30: sales.current,
      };
    })
    .filter((item) => item.suggestedQuantity > 0)
    .sort((a, b) => (a.coverageDays ?? 9999) - (b.coverageDays ?? 9999))
    .slice(0, 12);

  const deadStock = data.products
    .filter((product) => {
      const sales = productSales.get(product.id);
      return product.createdAt < last30Start && product.stock > 0 && (!sales || sales.current === 0);
    })
    .map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      unitCost: Number(product.buyPrice ?? 0),
      tiedCapital: Number(product.buyPrice ?? 0) * product.stock,
    }))
    .sort((a, b) => b.tiedCapital - a.tiedCapital)
    .slice(0, 10);

  const topProducts = data.products
    .map((product) => {
      const sales = productSales.get(product.id) ?? { current: 0, previous: 0, revenue: 0 };
      const changePercent = sales.previous > 0
        ? ((sales.current - sales.previous) / sales.previous) * 100
        : null;
      return {
        id: product.id,
        name: product.name,
        quantity: sales.current,
        revenue: sales.revenue,
        changePercent,
      };
    })
    .filter((item) => item.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  const customerMap = new Map<string, {
    id: string;
    name: string;
    orderCount: number;
    revenue: number;
    lastOrderAt: Date;
  }>();
  for (const order of data.orders) {
    if (!order.customerId) continue;
    const existing = customerMap.get(order.customerId) ?? {
      id: order.customerId,
      name: order.customerName,
      orderCount: 0,
      revenue: 0,
      lastOrderAt: order.createdAt,
    };
    existing.orderCount += 1;
    existing.revenue += Number(order.total);
    if (order.createdAt > existing.lastOrderAt) existing.lastOrderAt = order.createdAt;
    customerMap.set(order.customerId, existing);
  }

  const customersToReconnect = [...customerMap.values()]
    .map((customer) => ({
      ...customer,
      daysSinceLastOrder: Math.floor((now.getTime() - customer.lastOrderAt.getTime()) / DAY),
    }))
    .filter((customer) => customer.orderCount >= 2 && customer.daysSinceLastOrder >= 21)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const stockValue = data.products.reduce(
    (sum, product) => sum + Number(product.buyPrice ?? 0) * product.stock,
    0,
  );
  const deadStockValue = deadStock.reduce((sum, product) => sum + product.tiedCapital, 0);
  const estimatedGrossProfit = recentOrders.reduce((sum, order) => {
    return sum + order.items.reduce((lineSum, item) => {
      const product = productById.get(item.productId);
      const cost = Number(product?.buyPrice ?? 0);
      return lineSum + (Number(item.unitPrice) - cost) * item.quantity;
    }, 0);
  }, 0);

  return {
    generatedAt: now.toISOString(),
    historyLimited: data.orders.length === 2000,
    productCount: data.products.length,
    orderCount30: recentOrders.length,
    revenue30,
    revenuePrevious30,
    revenueChangePercent,
    estimatedGrossProfit,
    stockValue,
    deadStockValue,
    reorderSuggestions,
    deadStock,
    topProducts,
    customersToReconnect,
    hasHistory: data.orders.length > 0,
  };
}
