import { useCallback, useEffect, useState } from "react";
import { seedCategories, seedProducts, seedTransactions } from "../data/seed";
import { supabase, supabaseConfigMissing } from "../lib/supabase";

const STORAGE_KEY = "inventory-app-state-v2";

const emptyState = {
  products: seedProducts,
  categories: seedCategories,
  transactions: seedTransactions,
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw));
  } catch (error) {
    console.error("Could not load local inventory data.", error);
  }
  return normalizeState(emptyState);
}

function normalizeState(value) {
  const productsByName = new Map();
  const productIdMap = new Map();
  (value.products ?? []).forEach((product) => {
    const key = product.name.trim().toLowerCase();
    const existing = productsByName.get(key);
    if (existing) {
      existing.quantity += Number(product.quantity) || 0;
      productIdMap.set(product.id, existing.id);
    } else {
      const canonical = { ...product, quantity: Number(product.quantity) || 0 };
      productsByName.set(key, canonical);
      productIdMap.set(product.id, canonical.id);
    }
  });

  const categories = uniqueBy(
    value.categories ?? [],
    (category) => category.name.trim().toLowerCase()
  );
  const categoryIdMap = new Map();
  (value.categories ?? []).forEach((category) => {
    const canonical = categories.find(
      (item) => item.name.trim().toLowerCase() === category.name.trim().toLowerCase()
    );
    if (canonical) categoryIdMap.set(category.id, canonical.id);
  });

  return {
    categories,
    products: [...productsByName.values()].map((product) => ({
      ...product,
      categoryId: categoryIdMap.get(product.categoryId) ?? product.categoryId,
    })),
    transactions: uniqueBy(value.transactions ?? [], (transaction) => transaction.id).map((transaction) => ({
      ...transaction,
      productId: productIdMap.get(transaction.productId) ?? transaction.productId,
    })),
  };
}

const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

function uniqueBy(items, key) {
  const seen = new Set();
  return items.filter((item) => {
    const value = key(item);
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

const toProduct = (row) => ({
  id: row.id,
  name: row.name,
  sku: row.sku,
  categoryId: row.category_id,
  price: Number(row.price),
  quantity: Number(row.quantity),
  reorderLevel: Number(row.reorder_level),
  image: row.image,
  warehouseId: row.warehouse_id,
  syncedToShopee: row.synced_to_shopee,
  createdAt: row.created_at,
});

const toCategory = (row) => ({
  id: row.id,
  name: row.name,
  color: row.color,
  createdAt: row.created_at,
});

const toTransaction = (row) => ({
  id: row.id,
  productId: row.product_id,
  type: row.type,
  quantity: Number(row.quantity),
  date: row.date,
  note: row.note,
});

const productRow = (product, userId) => ({
  id: product.id,
  name: product.name,
  sku: product.sku,
  category_id: product.categoryId,
  price: product.price,
  quantity: product.quantity,
  reorder_level: product.reorderLevel,
  image: product.image,
  warehouse_id: product.warehouseId,
  synced_to_shopee: product.syncedToShopee,
  created_at: product.createdAt,
  user_id: userId,
});

const categoryRow = (category, userId) => ({
  id: category.id,
  name: category.name,
  color: category.color,
  created_at: category.createdAt,
  user_id: userId,
});

export function useInventory(user) {
  const [state, setState] = useState(() => (supabase ? normalizeState(emptyState) : loadState()));
  const [loading, setLoading] = useState(Boolean(supabase));
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!supabase || !user) {
      if (supabaseConfigMissing) {
        setError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the deployment environment.");
      }
      setLoading(false);
      return;
    }

    let active = true;
    async function loadRemoteState() {
      const [categoriesResult, productsResult, transactionsResult] = await Promise.all([
        supabase.from("categories").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("products").select("*").eq("user_id", user.id).order("created_at"),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      ]);
      const failure = categoriesResult.error || productsResult.error || transactionsResult.error;
      if (failure) {
        console.error("Could not load inventory from Supabase.", failure);
        if (active) setError(`Supabase connection error: ${failure.message}`);
      } else if (active) {
        setState(normalizeState({
          categories: categoriesResult.data.map(toCategory),
          products: productsResult.data.map(toProduct),
          transactions: transactionsResult.data.map(toTransaction),
        }));
      }
      if (active) setLoading(false);
    }
    loadRemoteState();
    const channel = supabase
      .channel(`inventory-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories", filter: `user_id=eq.${user.id}` },
        loadRemoteState
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products", filter: `user_id=eq.${user.id}` },
        loadRemoteState
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
        loadRemoteState
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          setError("Realtime inventory updates are unavailable. Refresh to load the latest data.");
        }
      });
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const reportError = useCallback((message, details) => {
    console.error(message, details);
    setError(`${message} ${details.message}`);
  }, []);

  const addProduct = useCallback((product) => {
    const next = { ...product, id: uid("prod"), createdAt: new Date().toISOString() };
    const duplicate = state.products.find((item) => item.name.trim().toLowerCase() === next.name.trim().toLowerCase());
    if (duplicate) {
      setError(`A product named "${next.name}" already exists.`);
      return;
    }
    setState((prev) => ({ ...prev, products: [...prev.products, next] }));
    if (supabase) supabase.from("products").insert(productRow(next, user.id)).then(({ error: insertError }) => {
      if (insertError) reportError("Could not save product.", insertError);
    });
    return next.id;
  }, [reportError, state.products, user]);

  const updateProduct = useCallback((id, patch) => {
    if (patch.name) {
      const duplicate = state.products.find(
        (product) =>
          product.id !== id && product.name.trim().toLowerCase() === patch.name.trim().toLowerCase()
      );
      if (duplicate) {
        setError(`A product named "${patch.name}" already exists.`);
        return;
      }
    }
    setState((prev) => ({
      ...prev,
      products: prev.products.map((product) => (product.id === id ? { ...product, ...patch } : product)),
    }));
    if (supabase) {
      const update = {};
      if ("name" in patch) update.name = patch.name;
      if ("sku" in patch) update.sku = patch.sku;
      if ("categoryId" in patch) update.category_id = patch.categoryId;
      if ("price" in patch) update.price = patch.price;
      if ("quantity" in patch) update.quantity = patch.quantity;
      if ("reorderLevel" in patch) update.reorder_level = patch.reorderLevel;
      if ("image" in patch) update.image = patch.image;
      if ("warehouseId" in patch) update.warehouse_id = patch.warehouseId;
      if ("syncedToShopee" in patch) update.synced_to_shopee = patch.syncedToShopee;
      supabase.from("products").update(update).eq("id", id).eq("user_id", user.id).then(({ error: updateError }) => {
        if (updateError) reportError("Could not update product.", updateError);
      });
    }
  }, [reportError, state.products, user]);

  const deleteProduct = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      products: prev.products.filter((product) => product.id !== id),
      transactions: prev.transactions.filter((transaction) => transaction.productId !== id),
    }));
    if (supabase) supabase.from("products").delete().eq("id", id).eq("user_id", user.id).then(({ error: deleteError }) => {
      if (deleteError) reportError("Could not delete product.", deleteError);
    });
  }, [reportError, user]);

  const addCategory = useCallback((category) => {
    const next = { ...category, id: uid("cat"), createdAt: new Date().toISOString() };
    const duplicate = state.categories.find((item) => item.name.trim().toLowerCase() === next.name.trim().toLowerCase());
    if (duplicate) {
      setError(`A category named "${next.name}" already exists.`);
      return;
    }
    setState((prev) => ({ ...prev, categories: [...prev.categories, next] }));
    if (supabase) supabase.from("categories").insert(categoryRow(next, user.id)).then(({ error: insertError }) => {
      if (insertError) reportError("Could not save category.", insertError);
    });
  }, [reportError, state.categories, user]);

  const updateCategory = useCallback((id, patch) => {
    if (patch.name) {
      const duplicate = state.categories.find(
        (category) => category.id !== id && category.name.trim().toLowerCase() === patch.name.trim().toLowerCase()
      );
      if (duplicate) {
        setError(`A category named "${patch.name}" already exists.`);
        return;
      }
    }
    setState((prev) => ({
      ...prev,
      categories: prev.categories.map((category) => (category.id === id ? { ...category, ...patch } : category)),
    }));
    if (supabase)     supabase.from("categories").update(patch).eq("id", id).eq("user_id", user.id).then(({ error: updateError }) => {
      if (updateError) reportError("Could not update category.", updateError);
    });
  }, [reportError, state.categories, user]);

  const deleteCategory = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((category) => category.id !== id),
    }));
    if (supabase) supabase.from("categories").delete().eq("id", id).eq("user_id", user.id).then(({ error: deleteError }) => {
      if (deleteError) reportError("Could not delete category.", deleteError);
    });
  }, [reportError, user]);

  const recordTransaction = useCallback((productId, type, quantity, note) => {
    const transaction = {
      id: uid("txn"),
      productId,
      type,
      quantity,
      date: new Date().toISOString(),
      note,
    };
    setState((prev) => ({
      ...prev,
      products: prev.products.map((product) => {
        if (product.id !== productId) return product;
        const nextQuantity =
          type === "in" ? product.quantity + quantity :
          type === "out" ? Math.max(0, product.quantity - quantity) : quantity;
        return { ...product, quantity: nextQuantity };
      }),
      transactions: [transaction, ...prev.transactions],
    }));
    if (supabase) {
      const product = state.products.find((item) => item.id === productId);
      const nextQuantity =
        type === "in" ? product.quantity + quantity :
        type === "out" ? Math.max(0, product.quantity - quantity) : quantity;
      Promise.all([
        supabase.from("products").update({ quantity: nextQuantity }).eq("id", productId).eq("user_id", user.id),
        supabase.from("transactions").insert({
          id: transaction.id,
          product_id: productId,
          type,
          quantity,
          date: transaction.date,
          note,
          user_id: user.id,
        }),
      ]).then(([productResult, transactionResult]) => {
        const failure = productResult.error || transactionResult.error;
        if (failure) reportError("Could not save stock movement.", failure);
      });
    }
  }, [reportError, state.products, user]);

  const resetData = useCallback(() => {
    setState(emptyState);
    if (supabase) {
      Promise.all([
        supabase.from("transactions").delete().eq("user_id", user.id),
        supabase.from("products").delete().eq("user_id", user.id),
        supabase.from("categories").delete().eq("user_id", user.id),
      ]).catch((resetError) => reportError("Could not reset remote inventory.", resetError));
    }
  }, [reportError, user]);

  return {
    ...state,
    loading,
    error,
    dismissError: () => setError(""),
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
