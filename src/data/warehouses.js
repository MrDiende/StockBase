export const warehouses = [{ id: "wh-1", name: "Physical Store", capacity: 1600 }];

// Deterministically assigns a product to one of the warehouses based on its id,
// so the distribution stays stable across renders without needing extra state.
export function warehouseForProduct(productId) {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = productId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % warehouses.length;
  return warehouses[index];
}
