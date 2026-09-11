import { useMemo, useState } from "react";
import { ArrowRightLeft, Search, TrendingDown, TrendingUp } from "lucide-react";
import { Badge } from "../components/Badge";

export function Transactions({ inventory }) {
  const { transactions, products } = inventory;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  // Newest first, filtered by search text and transaction type.
  const visibleTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((t) => {
        const product = productById.get(t.productId);
        const query = search.toLowerCase();
        const matchesSearch =
          !search || product?.name.toLowerCase().includes(query) || t.note.toLowerCase().includes(query);
        const matchesType = typeFilter === "all" || t.type === typeFilter;
        return matchesSearch && matchesType;
      });
  }, [transactions, productById, search, typeFilter]);

  const totalIn = transactions.filter((t) => t.type === "in").reduce((s, t) => s + t.quantity, 0);
  const totalOut = transactions.filter((t) => t.type === "out").reduce((s, t) => s + t.quantity, 0);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>Full history of stock movements</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="summary-grid">
        <div className="card stat-card">
          <p className="stat-label">Total Stock In</p>
          <p className="stat-value amount-in">
            <TrendingUp size={20} /> {totalIn}
          </p>
        </div>
        <div className="card stat-card">
          <p className="stat-label">Total Stock Out</p>
          <p className="stat-value amount-out">
            <TrendingDown size={20} /> {totalOut}
          </p>
        </div>
        <div className="card stat-card">
          <p className="stat-label">Total Records</p>
          <p className="stat-value" style={{ color: "var(--brand-600)" }}>
            <ArrowRightLeft size={20} /> {transactions.length}
          </p>
        </div>
      </div>

      {/* Search + type filter */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product or note..."
          />
        </div>
        <select className="select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="in">Stock In</option>
          <option value="out">Stock Out</option>
          <option value="adjust">Adjustment</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="data-table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Note</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {visibleTransactions.map((t) => {
                const product = productById.get(t.productId);
                return (
                  <tr key={t.id}>
                    <td>
                      <div className="product-cell">
                        {product ? (
                          <img src={product.image} alt={product.name} className="thumb" style={{ height: 32, width: 32 }} />
                        ) : (
                          <span className="avatar" style={{ height: 32, width: 32 }}>?</span>
                        )}
                        <span className="item-name">{product?.name ?? "Deleted product"}</span>
                      </div>
                    </td>
                    <td>
                      {t.type === "in" && <Badge variant="green">Stock In</Badge>}
                      {t.type === "out" && <Badge variant="red">Stock Out</Badge>}
                      {t.type === "adjust" && <Badge variant="sky">Adjustment</Badge>}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      {t.type === "out" ? "-" : t.type === "in" ? "+" : ""}
                      {t.quantity}
                    </td>
                    <td className="muted">{t.note}</td>
                    <td className="muted">
                      {new Date(t.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                );
              })}
              {visibleTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-empty">
                    No transactions match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
