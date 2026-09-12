import { useEffect, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Dashboard } from "./pages/Dashboard";
import { Products } from "./pages/Products";
import { Categories } from "./pages/Categories";
import { Transactions } from "./pages/Transactions";
import { Settings } from "./pages/Settings";
import { useInventory } from "./hooks/useInventory";
import { useShopeeSync } from "./hooks/useShopeeSync";
import { Auth } from "./components/Auth";
import { supabase } from "./lib/supabase";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const inventory = useInventory(user);
  const shopeeSync = useShopeeSync();

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }
    let active = true;
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        console.error("Supabase session is invalid. Signing out locally.", error);
        await supabase.auth.signOut({ scope: "local" });
      }
      if (active) {
        setUser(error ? null : data.session?.user ?? null);
        setAuthLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setPage("settings");
        setPasswordRecovery(true);
      }
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (authLoading) return <div className="app-status app-status-loading">Loading...</div>;
  if (!supabase) {
    return (
      <main className="auth-page">
        <section className="auth-card card">
          <div className="auth-mobile-brand">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" />
            <span>StockBase</span>
          </div>
          <h1>Supabase connection required</h1>
          <p className="auth-subtitle">
            This deployment is missing its Supabase environment configuration.
            Add the required variables in Vercel and redeploy.
          </p>
          <p className="auth-message">
            Required: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
          </p>
        </section>
      </main>
    );
  }
  if (supabase && !user) return <Auth supabase={supabase} />;

  return (
    <div className="app-shell">
      {inventory.loading && <div className="app-status app-status-loading">Loading inventory...</div>}
      {inventory.error && (
        <button className="app-status app-status-error" onClick={inventory.dismissError}>
          {inventory.error} (click to dismiss)
        </button>
      )}
      <Sidebar page={page} onNavigate={setPage} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-main-column">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="page-content">
          {page === "dashboard" && (
            <Dashboard inventory={inventory} onNavigate={setPage} shopeeSync={shopeeSync} />
          )}
          {page === "products" && <Products inventory={inventory} shopeeSync={shopeeSync} />}
          {page === "categories" && <Categories inventory={inventory} />}
          {page === "transactions" && <Transactions inventory={inventory} />}
          {page === "settings" && (
            <Settings
              supabase={supabase}
              user={user}
              passwordRecovery={passwordRecovery}
              onRecoveryComplete={() => setPasswordRecovery(false)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
