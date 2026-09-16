import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { CategoryModal } from "../components/CategoryModal";
import { ConfirmDialog } from "../components/ConfirmDialog";

export function Categories({ inventory, operationSecurity }) {
  const { categories, products, addCategory, updateCategory, deleteCategory } = inventory;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [authorizationToken, setAuthorizationToken] = useState(null);

  const openAdd = async () => {
    const grant = await operationSecurity.authorize("category.add");
    if (operationSecurity.enabled && !grant) return;
    setAuthorizationToken(grant);
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = async (c) => {
    const grant = await operationSecurity.authorize("category.update");
    if (operationSecurity.enabled && !grant) return;
    setAuthorizationToken(grant);
    setEditing(c);
    setModalOpen(true);
  };

  const handleSave = (data) => {
    if (editing) updateCategory(editing.id, data, authorizationToken);
    else addCategory(data, authorizationToken);
    setAuthorizationToken(null);
    setModalOpen(false);
  };

  const deletingCategory = categories.find((c) => c.id === deletingId);
  const countProducts = (id) => products.filter((p) => p.categoryId === id).length;
  const countStocks = (id) =>
    products.filter((p) => p.categoryId === id).reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p>Organize products into groups</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} />
          Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="card">
          <p className="list-empty">No categories yet. Add one to start organizing products.</p>
        </div>
      ) : (
        <div className="card-grid">
          {categories.map((c) => (
            <div key={c.id} className="card">
              <div className="entity-card-head">
                <div className="row-left">
                  <span className="avatar">{c.name.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <p className="entity-name">{c.name}</p>
                    <p className="entity-sub">{countProducts(c.id)} products</p>
                  </div>
                </div>
                <div className="row-actions">
                  <button className="icon-btn icon-btn-brand" onClick={() => openEdit(c)}>
                    <Pencil size={15} />
                  </button>
                  <button className="icon-btn icon-btn-danger" onClick={async () => {
                    const grant = await operationSecurity.authorize("category.delete");
                    if (operationSecurity.enabled && !grant) return;
                    setAuthorizationToken(grant);
                    setDeletingId(c.id);
                  }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className="entity-footer">
                <span className="muted">Total stocks</span>
                <span className="entity-total">{countStocks(c.id)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} initial={editing} />

      <ConfirmDialog
        open={!!deletingId}
        title="Delete category?"
        message={`"${deletingCategory?.name}" will be removed. Products in this category will show as uncategorized.`}
        onConfirm={() => {
          if (deletingId) deleteCategory(deletingId, authorizationToken);
          setAuthorizationToken(null);
          setDeletingId(null);
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
