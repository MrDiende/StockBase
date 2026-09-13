import { X } from "lucide-react";
import { cn } from "../utils/classNames";

// The four main navigation destinations.
const navItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "products", label: "Products" },
  { id: "categories", label: "Categories" },
  { id: "transactions", label: "Transactions" },
  { id: "settings", label: "Settings" },
];

export function Sidebar({ page, onNavigate, open, onClose }) {
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
      </aside>
    </>
  );
}
