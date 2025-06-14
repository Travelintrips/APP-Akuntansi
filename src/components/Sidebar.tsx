import { Link } from "react-router-dom";
import {
  BookOpen,
  FileText,
  BarChart3,
  PieChart,
  Home,
  ListTree,
  ChevronDown,
  ChevronRight,
  Plane,
  Hotel,
  Users,
  Briefcase,
  Car,
  Bus,
  ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import Cart from "../components/cart/Cart";

interface SidebarProps {
  onNavItemClick?: (item: string) => void;
  activeItem?: string;
}

const Sidebar = ({ onNavItemClick, activeItem }: SidebarProps) => {
  const [subAccountsOpen, setSubAccountsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <div className="h-screen w-64 bg-card border-r p-4 flex flex-col">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold">Akuntansi App</h2>
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 rounded-full hover:bg-accent transition-colors"
          aria-label="Open cart"
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {isCartOpen && <Cart onClose={() => setIsCartOpen(false)} />}

      <nav className="space-y-1 flex-1">
        <Link
          to="/dashboard"
          className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors ${activeItem === "dashboard" ? "bg-accent" : ""}`}
        >
          <Home className="h-5 w-5" />
          <span>Dashboard</span>
        </Link>
        <Link
          to="/coa"
          className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors ${activeItem === "coa" ? "bg-accent" : ""}`}
        >
          <ListTree className="h-5 w-5" />
          <span>Bagan Akun</span>
        </Link>

        {/* Sub Accounts Category */}
        <div className="space-y-1">
          <button
            onClick={() => setSubAccountsOpen(!subAccountsOpen)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors ${activeItem?.startsWith("sub-account") ? "bg-accent" : ""}`}
          >
            <div className="flex items-center gap-3">
              <ListTree className="h-5 w-5" />
              <span>Sub Akun COA</span>
            </div>
            {subAccountsOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {subAccountsOpen && (
            <div className="pl-6 space-y-1">
              <Link
                to="/sub-account"
                className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors ${activeItem === "sub-account" ? "bg-accent" : ""}`}
              >
                <ListTree className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/sub-account/tiket-pesawat"
                className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors ${activeItem === "sub-account-tiket-pesawat" ? "bg-accent" : ""}`}
              >
                <Plane className="h-4 w-4" />
                <span>Tiket Pesawat</span>
              </Link>
              <Link
                to="/sub-account/hotel"
                className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors ${activeItem === "sub-account-hotel" ? "bg-accent" : ""}`}
              >
                <Hotel className="h-4 w-4" />
                <span>Hotel</span>
              </Link>
              <Link
                to="/sub-account/passenger-handling"
                className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors ${activeItem === "sub-account-passenger-handling" ? "bg-accent" : ""}`}
              >
                <Users className="h-4 w-4" />
                <span>Passenger Handling</span>
              </Link>
              <Link
                to="/sub-account/travel"
                className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors ${activeItem === "sub-account-travel" ? "bg-accent" : ""}`}
              >
                <Briefcase className="h-4 w-4" />
                <span>Travel</span>
              </Link>
              <Link
                to="/sub-account/airport-transfer"
                className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors ${activeItem === "sub-account-airport-transfer" ? "bg-accent" : ""}`}
              >
                <Bus className="h-4 w-4" />
                <span>Airport Transfer</span>
              </Link>
              <Link
                to="/sub-account/rental-car"
                className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors ${activeItem === "sub-account-rental-car" ? "bg-accent" : ""}`}
              >
                <Car className="h-4 w-4" />
                <span>Rental Car</span>
              </Link>
            </div>
          )}
        </div>

        <Link
          to="/journal"
          className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors ${activeItem === "journal" ? "bg-accent" : ""}`}
        >
          <BookOpen className="h-5 w-5" />
          <span>Jurnal</span>
        </Link>
        <Link
          to="/ledger"
          className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors ${activeItem === "ledger" ? "bg-accent" : ""}`}
        >
          <FileText className="h-5 w-5" />
          <span>Buku Besar</span>
        </Link>
        <Link
          to="/reports"
          className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors ${activeItem === "reports" ? "bg-accent" : ""}`}
        >
          <BarChart3 className="h-5 w-5" />
          <span>Laporan</span>
        </Link>
        <Link
          to="/balance-sheet"
          className={`flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors ${activeItem === "balance-sheet" ? "bg-accent" : ""}`}
        >
          <PieChart className="h-5 w-5" />
          <span>Neraca</span>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
