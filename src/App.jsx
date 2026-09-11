import { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Dashboard } from "./pages/Dashboard";
import { Products } from "./pages/Products";
import { Categories } from "./pages/Categories";
import { Transactions } from "./pages/Transactions";
import { useInventory } from "./hooks/useInventory";
import { useShopeeSync } from "./hooks/useShopeeSync";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inventory = useInventory();
  const shopeeSync = useShopeeSync();

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={setPage} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-main-column">
        <Topbar page={page} onMenuClick={() => setSidebarOpen(true)} />

        <main className="page-content">
          {page === "dashboard" && (
            <Dashboard inventory={inventory} onNavigate={setPage} shopeeSync={shopeeSync} />
          )}
          {page === "products" && <Products inventory={inventory} shopeeSync={shopeeSync} />}
          {page === "categories" && <Categories inventory={inventory} />}
          {page === "transactions" && <Transactions inventory={inventory} />}
        </main>
      </div>
    </div>
  );
}
