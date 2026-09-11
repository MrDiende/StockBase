import { Menu } from "lucide-react";

// Title and subtitle shown in the header for each page.
const titles = {
  dashboard: { title: "Dashboard", subtitle: "Overview of your inventory health" },
  products: { title: "Products", subtitle: "Manage your product catalog" },
  categories: { title: "Categories", subtitle: "Group products for easy tracking" },
  transactions: { title: "Transactions", subtitle: "Stock movement history" },
};

export function Topbar({ page, onMenuClick }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <div>
          <h1 className="topbar-title">{titles[page].title}</h1>
          <p className="topbar-subtitle">{titles[page].subtitle}</p>
        </div>
      </div>
    </header>
  );
}
