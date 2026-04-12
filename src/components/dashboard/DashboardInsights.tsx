import { useMemo } from 'react';
import { Award, TrendingUp, IndianRupee, AlertTriangle } from 'lucide-react';
import { ErrorState, EmptyState, LoadingState } from '@/components/ui';
import { formatNumber } from '@/utils/numberFormat';

interface SaleRow {
  id: string;
  date: string;
  quantity: number;
  unit_price: number;
  total: number;
  variant?: {
    variant_name?: string;
    model?: {
      name?: string;
      brand?: { name?: string };
    };
  };
  product?: { name?: string; brand?: string };
}

interface DashboardInsightsProps {
  sales: SaleRow[];
  loading: boolean;
  error?: string;
  lowStock?: Array<{ id: string; name: string; stock: number; threshold: number }>;
}

export default function DashboardInsights({ sales, loading, error, lowStock = [] }: DashboardInsightsProps) {
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();

    const getOriginalName = (sale: SaleRow): string => {
      if (sale.variant?.variant_name) {
        const fullVariantName = [
          sale.variant.model?.brand?.name,
          sale.variant.model?.name,
          sale.variant.variant_name,
        ]
          .filter(Boolean)
          .join(' ')
          .trim();

        if (fullVariantName) return fullVariantName;
        return sale.variant.variant_name;
      }

      if (sale.product?.name) {
        const fullProductName = [sale.product.brand, sale.product.name]
          .filter(Boolean)
          .join(' ')
          .trim();
        return fullProductName || sale.product.name;
      }

      return 'Unknown';
    };

    sales.forEach((sale) => {
      const name = getOriginalName(sale);
      const current = map.get(name) || { name, quantity: 0, revenue: 0 };
      current.quantity += Number(sale.quantity || 0);
      current.revenue += Number(sale.total || 0);
      map.set(name, current);
    });

    return [...map.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [sales]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* Top Products - Left Section */}
      <section className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-900/50">
        <div className="mb-4 flex items-center gap-2">
          <Award size={20} className="text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Top Performing Products</h3>
        </div>

        {loading ? <LoadingState type="skeleton" variant="card" /> : null}
        {!loading && error ? <ErrorState title="Failed to load top products" message={error} /> : null}
        {!loading && !error ? (
          topProducts.length ? (
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
              {topProducts.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="group relative rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all duration-300 hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-blue-500"
                >
                  {/* Rank Badge */}
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-sm font-bold text-white">
                    #{index + 1}
                  </div>

                  {/* Product Info */}
                  <p className="mb-2 break-words text-sm font-semibold leading-5 text-slate-900 group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                    {item.name}
                  </p>

                  {/* Stats */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 shrink-0">
                        <TrendingUp size={14} /> Units
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatNumber(item.quantity)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 shrink-0">
                        <IndianRupee size={14} /> Revenue
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-right">
                        ₹{formatNumber(item.revenue)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                      style={{
                        width: `${(item.quantity / Math.max(...topProducts.map(p => p.quantity), 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No product data" />
          )
        ) : null}
      </section>

      {/* Low Stock Alerts - Right Section */}
      <section className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 shadow-sm dark:border-amber-700/40 dark:from-amber-900/20 dark:to-amber-800/10">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
          <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200">Low Stock Items</h3>
        </div>

        {loading ? <LoadingState type="skeleton" variant="card" /> : null}
        {!loading && error ? <ErrorState title="Failed to load low stock items" message={error} /> : null}
        {!loading && !error ? (
          lowStock.length ? (
            <div className="space-y-2">
              {lowStock.slice(0, 10).map((item) => (
                <div
                  key={item.id}
                  className="group rounded-lg border border-amber-200 bg-white/70 p-3 transition-all duration-200 hover:border-amber-300 hover:bg-white dark:border-amber-700/50 dark:bg-slate-800/50 dark:hover:border-amber-600"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <p className="truncate font-semibold text-amber-900 group-hover:text-amber-700 dark:text-amber-200 dark:group-hover:text-amber-100">
                      {item.name}
                    </p>
                    <span className="inline-flex items-center justify-center rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
                      {item.stock}
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Threshold: {item.threshold}
                  </p>
                  {/* Warning indicator */}
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-amber-200 dark:bg-amber-900/30">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-red-500 transition-all duration-300"
                      style={{
                        width: `${Math.min((item.stock / item.threshold) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No low stock items" />
          )
        ) : null}
      </section>
    </div>
  );
}
