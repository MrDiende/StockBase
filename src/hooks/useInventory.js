import { useCallback, useEffect, useState } from "react";
import { seedCategories, seedProducts, seedTransactions } from "../data/seed";

const STORAGE_KEY = "inventory-app-state-v2";

// Load the saved inventory from the browser, or start with the (empty) seed data.
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore corrupt storage
  }
  return {
    products: seedProducts,
    categories: seedCategories,
    transactions: seedTransactions,
  };
}

// Small helper for creating unique ids like "prod-a1b2c3".
const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

// Central store for products, categories and transactions.
// State is kept in React and mirrored to localStorage so it survives refreshes.
export function useInventory() {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addProduct = useCallback((product) => {
    setState((prev) => ({
      ...prev,
      products: [...prev.products, { ...product, id: uid("prod"), createdAt: new Date().toISOString() }],
    }));
  }, []);

  const updateProduct = useCallback((id, patch) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const deleteProduct = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
      transactions: prev.transactions.filter((t) => t.productId !== id),
    }));
  }, []);

  const addCategory = useCallback((category) => {
    setState((prev) => ({
      ...prev,
      categories: [...prev.categories, { ...category, id: uid("cat") }],
    }));
  }, []);

  const updateCategory = useCallback((id, patch) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const deleteCategory = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  }, []);

  // Records a stock movement and updates the product quantity accordingly.
  const recordTransaction = useCallback((productId, type, quantity, note) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id !== productId) return p;
        let nextQty = p.quantity;
        if (type === "in") nextQty += quantity;
        else if (type === "out") nextQty = Math.max(0, nextQty - quantity);
        else nextQty = quantity;
        return { ...p, quantity: nextQty };
      }),
      transactions: [
        { id: uid("txn"), productId, type, quantity, date: new Date().toISOString(), note },
        ...prev.transactions,
      ],
    }));
  }, []);

  const resetData = useCallback(() => {
    setState({
      products: seedProducts,
      categories: seedCategories,
      transactions: seedTransactions,
    });
  }, []);

  return {
    ...state,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    recordTransaction,
    resetData,
  };
}
