import { useMemo, useState } from "react";
import { ArrowUpDown, PackagePlus, Pencil, RefreshCw, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import { Badge } from "../components/Badge";
import { ProductModal } from "../components/ProductModal";
import { StockModal } from "../components/StockModal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { cn } from "../utils/classNames";

const peso = (n) => n.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

export function Products({ inventory, shopeeSync, operationSecurity }) {
  const { products, categories, addProduct, updateProduct, deleteProduct, recordTransaction } = inventory;

  // Lookups so we can show category / warehouse names quickly.
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  // Filter + sort controls.
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState(1);

  // Modal / dialog state.
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [authorizationToken, setAuthorizationToken] = useState(null);

  const visibleProducts = useMemo(() => {
    const matches = products.filter((p) => {
      const query = search.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
      const matchesCategory = categoryFilter === "all" || p.categoryId === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "low" && p.quantity > 0 && p.quantity <= p.reorderLevel) ||
        (statusFilter === "out" && p.quantity === 0);
      return matchesSearch && matchesCategory && matchesStatus;
    });

    return [...matches].sort((a, b) => {
      let diff = 0;
      if (sortKey === "name") diff = a.name.localeCompare(b.name);
      else if (sortKey === "quantity") diff = a.quantity - b.quantity;
      else if (sortKey === "price") diff = a.price - b.price;
      else if (sortKey === "value") diff = a.price * a.quantity - b.price * b.quantity;
      return diff * sortDir;
    });
  }, [products, search, categoryFilter, statusFilter, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(1);
    }
    setAuthorizationToken(null);
  };

  const openAdd = async () => {
    const grant = await operationSecurity.authorize("product.add");
    if (operationSecurity.enabled && !grant) return;
    setAuthorizationToken(grant);
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = async (p) => {
    const grant = await operationSecurity.authorize("product.update");
    if (operationSecurity.enabled && !grant) return;
    setAuthorizationToken(grant);
    setEditing(p);
    setModalOpen(true);
  };

  const handleSave = async (data) => {
    if (editing) {
      await updateProduct(editing.id, data, authorizationToken);
    } else {
      const { syncToShopee, ...product } = data;
      const productId = await addProduct(product, authorizationToken);
      if (productId && syncToShopee) handleSyncProduct(productId);
    }
    setModalOpen(false);
  };

  // Sync a single product to Shopee, then mark it as synced when finished.
  const handleSyncProduct = (productId) => {
    shopeeSync.sync(() => updateProduct(productId, { syncedToShopee: true }));
  };

  const deletingProduct = products.find((p) => p.id === deletingId);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Products</h1>
          <p>{visibleProducts.length} of {products.length} items shown</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <PackagePlus size={16} />
          Add Product
        </button>
      </div>

      {/* Search + filters */}
      <div className="toolbar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            className="input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
          />
        </div>
        <div className="toolbar-filters">
          <SlidersHorizontal size={15} className="muted" />
          <select className="select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products table */}
      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="data-table products-table">
            <thead>
              <tr>
                <th>
                  <button className="sort-btn" onClick={() => toggleSort("name")}>
                    Product <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>Category</th>
                <th>Fulfillment</th>
                <th>
                  <button className="sort-btn" onClick={() => toggleSort("price")}>
                    Price <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button className="sort-btn" onClick={() => toggleSort("quantity")}>
                    Stock <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>
                  <button className="sort-btn" onClick={() => toggleSort("value")}>
                    Value <ArrowUpDown size={12} />
                  </button>
                </th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((p) => {
                const category = categoryById.get(p.categoryId);
                const status = p.quantity === 0 ? "out" : p.quantity <= p.reorderLevel ? "low" : "ok";
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="product-cell">
                        <img src={p.image} alt={p.name} className="thumb" />
                        <div>
                          <p className="item-name">{p.name}</p>
                          <p className="item-sub">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {category && (
                        <Badge>
                          <span className={`badge-dot category-dot-${category.color.slice(1)}`} />
                          {category.name}
                        </Badge>
                      )}
                    </td>
                    <td>
                      <div className="fulfillment-cell">
                        <span className="fulfillment-store">
                          {p.physicalStore ? "Physical Store" : "Not in Physical Store"}
                        </span>
                        <button
                          className={cn("sync-pill", p.syncedToShopee ? "sync-pill-on" : "sync-pill-off")}
                          onClick={() => handleSyncProduct(p.id)}
                          disabled={shopeeSync.syncing}
                        >
                          <RefreshCw size={10} className={shopeeSync.syncing ? "spin" : ""} />
                          {p.syncedToShopee ? "Synced" : "Not synced"}
                        </button>
                      </div>
                    </td>
                    <td>{peso(p.price)}</td>
                    <td>
                      <button className="stock-btn" onClick={async () => {
                        const grant = await operationSecurity.authorize("transaction.add");
                        if (operationSecurity.enabled && !grant) return;
                        setAuthorizationToken(grant);
                        setStockProduct(p);
                      }}>
                        {p.quantity} stocks
                      </button>
                    </td>
                    <td>{peso(p.price * p.quantity)}</td>
                    <td>
                      {status === "out" && <Badge variant="red">Out of stock</Badge>}
                      {status === "low" && <Badge variant="red">Low stock</Badge>}
                      {status === "ok" && <Badge variant="green">In stock</Badge>}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn icon-btn-brand" onClick={() => openEdit(p)}>
                          <Pencil size={15} />
                        </button>
                        <button className="icon-btn icon-btn-danger" onClick={async () => {
                          const grant = await operationSecurity.authorize("product.delete");
                          if (operationSecurity.enabled && !grant) return;
                          setAuthorizationToken(grant);
                          setDeletingId(p.id);
                        }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visibleProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="table-empty">
                    No products match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        categories={categories}
        products={products}
        initial={editing}
        shopeeSync={shopeeSync}
        onSyncProduct={handleSyncProduct}
      />

      <StockModal
        open={!!stockProduct}
        product={stockProduct}
        onClose={() => setStockProduct(null)}
        onSubmit={(type, quantity, note) => {
          if (stockProduct) recordTransaction(stockProduct.id, type, quantity, note, authorizationToken);
          setAuthorizationToken(null);
          setStockProduct(null);
        }}
      />

      <ConfirmDialog
        open={!!deletingId}
        title="Delete product?"
        message={`This will permanently remove "${deletingProduct?.name}" and its transaction history.`}
        onConfirm={() => {
          if (deletingId) deleteProduct(deletingId, authorizationToken);
          setAuthorizationToken(null);
          setDeletingId(null);
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
