import { Layers, TrendingDown, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { StatCard } from "../components/StatCard";
import { Badge } from "../components/Badge";
import { warehouses, warehouseForProduct } from "../data/Physical Store.js";

// Format a number as Philippine Peso.
const peso = (n) =>
  n.toLocaleString("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

// Turn a timestamp into a short "x min ago" style label.
function formatSyncedAt(iso) {
  if (!iso) return "Never synced";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Synced just now";
  if (minutes < 60) return `Synced ${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Synced ${hours}h ago`;
  return `Synced ${Math.round(hours / 24)}d ago`;
}

// Pick the right progress-bar color based on how full the store is.
function fillClass(percent) {
  if (percent >= 90) return "progress-fill progress-fill-red";
  if (percent >= 70) return "progress-fill progress-fill-amber";
  return "progress-fill";
}

export function Dashboard({ inventory, onNavigate, shopeeSync }) {
  const { products, categories, transactions } = inventory;
  const { lastSyncedAt, syncing } = shopeeSync;

  // Store capacity usage.
  const warehouse = warehouses.map((wh) => {
    const stockUnits = products
      .filter((p) => warehouseForProduct(p.id).id === wh.id)
      .reduce((sum, p) => sum + p.quantity, 0);
    const utilization = Math.min(100, Math.round((stockUnits / wh.capacity) * 100));
    return { ...wh, stockUnits, utilization };
  })[0];

  // Headline numbers.
  const totalStockValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const totalStocks = products.reduce((sum, p) => sum + p.quantity, 0);
  const syncedStocks = products
    .filter((p) => p.syncedToShopee)
    .reduce((sum, p) => sum + p.quantity, 0);
  const lowStock = products.filter((p) => p.quantity <= p.reorderLevel);
  const outOfStock = products.filter((p) => p.quantity === 0);

  // Bar chart data: total stocks per category.
  const categoryData = categories.map((cat) => ({
    name: cat.name,
    units: products.filter((p) => p.categoryId === cat.id).reduce((sum, p) => sum + p.quantity, 0),
    color: cat.color,
  }));

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  const productById = new Map(products.map((p) => [p.id, p]));

  return (
    <div className="stack">
      {/* Top statistics */}
      <div className="stat-grid">
        <StatCard
          label="Total Products"
          value={products.length.toString()}
          trend={{ value: `${categories.length} categories tracked`, positive: true }}
        />
        <StatCard
          label="Inventory Value"
          value={peso(totalStockValue)}
          trend={{ value: `${totalStocks.toLocaleString()} stocks in total`, positive: true }}
        />
        <StatCard
          label="Low Stock Alerts"
          value={lowStock.length.toString()}
          trend={{
            value: lowStock.length ? "Needs reordering soon" : "All stock levels healthy",
            positive: lowStock.length === 0,
            danger: lowStock.length > 0,
          }}
        />
        <StatCard
          label="Out of Stock"
          value={outOfStock.length.toString()}
          trend={{
            value: outOfStock.length ? "Immediate action required" : "No stockouts",
            positive: outOfStock.length === 0,
          }}
        />
      </div>

      {/* Shopee sync + physical store */}
      <div className="card-grid two-columns">
        <div className="card stat-card">
          <p className="stat-label">Shopee Sync</p>
          <p className="stat-value">
            {syncedStocks.toLocaleString()} <span className="stat-value-unit">stocks</span>
          </p>
          <p className="stat-status">
            <span className={`badge-dot sync-status-dot ${syncing ? "sync-status-dot-active" : "sync-status-dot-ready"}`} />
            {syncing ? "Syncing stock with Shopee..." : `Stock synced · ${formatSyncedAt(lastSyncedAt)}`}
          </p>
        </div>

        <div className="card stat-card">
          <p className="stat-label">Physical Store</p>
          <p className="stat-value">
            {warehouse.stockUnits.toLocaleString()} <span className="stat-value-unit">stocks</span>
          </p>
        </div>
      </div>

      {/* Stock by category chart */}
      <div className="card">
        <div className="chart-header">
          <div>
            <h3 className="card-title">Stock by Category</h3>
            <p className="card-subtitle">Stocks currently held per category</p>
          </div>
          <Layers size={16} className="muted" />
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={categoryData} barSize={34}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: "#f8fafc" }} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
            <Bar dataKey="units" radius={[8, 8, 0, 0]}>
              {categoryData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Low stock + recent activity */}
      <div className="dashboard-columns">
        <div className="card">
          <div className="section-header">
            <h3 className="card-title">Low Stock Items</h3>
            <button className="link-btn" onClick={() => onNavigate("products")}>
              View all products
            </button>
          </div>

          {lowStock.length === 0 ? (
            <p className="list-empty">Nothing to reorder right now.</p>
          ) : (
            <div className="list">
              {lowStock.slice(0, 6).map((p) => (
                <div key={p.id} className="low-stock-row">
                  <div className="row-left">
                    <img src={p.image} alt={p.name} className="thumb" />
                    <div>
                      <p className="item-name">{p.name}</p>
                      <p className="item-sub">{p.sku}</p>
                    </div>
                  </div>
                  <Badge variant={p.quantity === 0 ? "red" : "amber"}>
                    {p.quantity} left / reorder at {p.reorderLevel}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-header">
            <h3 className="card-title">Recent Activity</h3>
            <button className="link-btn" onClick={() => onNavigate("transactions")}>
              View all
            </button>
          </div>

          <div className="list">
            {recentTransactions.map((t) => {
              const product = productById.get(t.productId);
              const isIncoming = t.type === "in";
              return (
                <div key={t.id} className="activity-row">
                  <span className={`activity-icon ${isIncoming ? "activity-icon-in" : "activity-icon-out"}`}>
                    {isIncoming ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  </span>
                  <div className="activity-main">
                    <p className="activity-name">{product?.name ?? "Deleted product"}</p>
                    <p className="activity-note">{t.note}</p>
                  </div>
                  <p className={`activity-amount ${isIncoming ? "amount-in" : "amount-out"}`}>
                    {isIncoming ? "+" : "-"}
                    {t.quantity}
                  </p>
                </div>
              );
            })}
            {recentTransactions.length === 0 && <p className="list-empty">No activity yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
