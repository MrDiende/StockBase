import { useEffect, useRef, useState } from "react";
import { ImagePlus, RefreshCw, X } from "lucide-react";
import { Modal } from "./Modal";
import { generatePlaceholderImage } from "../utils/placeholder";
import { generateSku } from "../utils/sku";
import { warehouses } from "../data/warehouses";

// Blank form used when adding a new product.
const emptyForm = {
  name: "",
  sku: "",
  categoryId: "",
  price: "",
  quantity: "",
  reorderLevel: "",
  image: "",
  warehouseId: "",
  syncToShopee: false,
};

export function ProductModal({ open, onClose, onSave, categories, products, initial, shopeeSync, onSyncProduct }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const { syncing } = shopeeSync;

  // Fill the form when the modal opens (with existing data when editing).
  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name,
        sku: initial.sku,
        categoryId: initial.categoryId,
        price: String(initial.price),
        quantity: String(initial.quantity),
        reorderLevel: String(initial.reorderLevel),
        image: initial.image,
        warehouseId: initial.warehouseId,
        syncToShopee: initial.syncedToShopee,
      });
    } else {
      setForm({
        ...emptyForm,
        categoryId: categories[0]?.id ?? "",
        warehouseId: warehouses[0]?.id ?? "",
      });
    }
    setError("");
  }, [open, initial, categories]);

  // Auto-generate the SKU from the category when creating a new product.
  useEffect(() => {
    if (!open || initial || !form.categoryId) return;
    const category = categories.find((c) => c.id === form.categoryId);
    if (!category) return;
    const nextSku = generateSku(category.name, products.map((p) => p.sku));
    setForm((f) => (f.sku === nextSku ? f : { ...f, sku: nextSku }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.categoryId, open, initial]);

  // Helper that returns an onChange handler for a text/select field.
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, image: reader.result }));
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim()) return setError("Product name is required.");
    if (!form.categoryId) return setError("Please select a category.");
    if (!form.warehouseId) return setError("Please select a physical store.");

    const price = Number(form.price);
    const quantity = Number(form.quantity);
    const reorderLevel = Number(form.reorderLevel);

    if ([price, quantity, reorderLevel].some((n) => Number.isNaN(n) || n < 0)) {
      return setError("Numeric fields must be valid, non-negative numbers.");
    }

    onSave({
      name: form.name.trim(),
      sku: form.sku.trim().toUpperCase(),
      categoryId: form.categoryId,
      price,
      quantity,
      reorderLevel,
      image: form.image || generatePlaceholderImage(form.name.trim()),
      warehouseId: form.warehouseId,
      // New physical-store stock stays local until the user explicitly syncs it.
      syncedToShopee: initial ? form.syncToShopee : false,
      syncToShopee: form.syncToShopee,
    });

  };

  const previewImage = form.image || generatePlaceholderImage(form.name.trim() || "New Product");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit Product" : "Add Product"}
      subtitle={initial ? "Update product details" : "Add a new item to your inventory"}
      width="xl"
    >
      <form className="form" onSubmit={handleSubmit}>
        {/* Product image */}
        <div className="field">
          <label className="field-label">Product Image</label>
          <div className="image-picker">
            <img src={previewImage} alt="Product preview" className="image-preview" />
            <div className="image-picker-actions">
              <div className="image-picker-buttons">
                <button type="button" className="btn btn-secondary btn-small" onClick={() => fileInputRef.current?.click()}>
                  <ImagePlus size={14} />
                  {form.image ? "Change Image" : "Upload Image"}
                </button>
                {form.image && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-small text-danger"
                    onClick={() => setForm((f) => ({ ...f, image: "" }))}
                  >
                    <X size={14} />
                    Remove
                  </button>
                )}
              </div>
              <p className="field-hint field-hint-small">
                PNG or JPG. A placeholder is used if none is set.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden-file-input"
            />
          </div>
        </div>

        {/* Main details */}
        <div className="form-grid">
          <div className="field form-grid-full">
            <label className="field-label">Product Name</label>
            <input className="input" value={form.name} onChange={set("name")} placeholder="e.g. Wireless Mouse" />
          </div>

          <div className="field form-grid-full">
            <label className="field-label">
              SKU <span className="field-hint">(auto-generated)</span>
            </label>
            <input className="input input-readonly" value={form.sku} readOnly disabled />
          </div>

          <div className="field form-grid-full">
            <label className="field-label">Category</label>
            <select className="select" value={form.categoryId} onChange={set("categoryId")}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field-label">Price (₱)</label>
            <input className="input" type="number" step="0.01" value={form.price} onChange={set("price")} />
          </div>

          <div className="field">
            <label className="field-label">Quantity</label>
            <input className="input" type="number" value={form.quantity} onChange={set("quantity")} />
          </div>

          <div className="field">
            <label className="field-label">Reorder Level</label>
            <input className="input" type="number" value={form.reorderLevel} onChange={set("reorderLevel")} />
          </div>
        </div>

        {/* Fulfillment: physical store + Shopee sync */}
        <div className="fieldset">
          <p className="fieldset-legend">Fulfillment</p>

          <div className="field">
            <label className="field-label">Physical Store</label>
            <select className="select" value={form.warehouseId} onChange={set("warehouseId")}>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <label className="sync-row">
            <span className="sync-info">
              <span className="sync-title">
                <span className="shopee-badge">S</span>
                Sync to Shopee
              </span>
              <span className="sync-desc">List and keep this product's stock updated on Shopee.</span>
            </span>

            <span className="sync-check">
              {syncing && <RefreshCw size={13} className="spin muted" />}
              <input
                type="checkbox"
                className="checkbox"
                checked={form.syncToShopee}
                disabled={syncing}
                onChange={(e) => {
                  const on = e.target.checked;
                  setForm((f) => ({ ...f, syncToShopee: on }));
                  // When editing, turning the checkbox on immediately syncs the product.
                  if (initial && on) onSyncProduct(initial.id);
                }}
              />
            </span>
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary btn-block" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-block">
            {initial ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
