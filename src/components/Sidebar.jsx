import { X } from "lucide-react";
import { cn } from "../utils/cn";
import { supabase } from "../lib/supabase";

// The four main navigation destinations.
const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "products", label: "Products" },
  { id: "categories", label: "Categories" },
  { id: "transactions", label: "Transactions" },
];

export function Sidebar({ page, onNavigate, open, onClose, user }) {
  return (
    <>
      {/* Dark overlay shown behind the sidebar on mobile */}
      {open && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={cn("sidebar", open ? "sidebar-visible" : "sidebar-hidden")}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="StockBase logo"
              className="sidebar-logo"
            />
            <p className="sidebar-brand-name">StockBase</p>
          </div>
          <button className="icon-btn sidebar-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={cn("nav-item", page === item.id && "nav-item-active")}
              onClick={() => {
                onNavigate(item.id);
                onClose();
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        {user && (
          <div className="sidebar-account">
            <p className="sidebar-account-email">{user.email}</p>
            <button className="sidebar-signout" onClick={() => supabase.auth.signOut()} type="button">
              <span aria-hidden="true">↪</span>
              Sign out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
