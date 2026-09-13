// Generates a unique, human-readable SKU based on the category name,
// e.g. "ELE-001" for Electronics. Ensures uniqueness against existing SKUs.
export function generateSku(categoryName, existingSkus) {
  const prefixLetters = categoryName.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const prefix = (prefixLetters.slice(0, 3) || "GEN").padEnd(3, "X");
  const existing = new Set(existingSkus.map((s) => s.toUpperCase()));

  let n = 1;
  let sku = `${prefix}-${String(n).padStart(3, "0")}`;
  while (existing.has(sku)) {
    n += 1;
    sku = `${prefix}-${String(n).padStart(3, "0")}`;
  }
  return sku;
}
