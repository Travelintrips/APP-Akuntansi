import { Link } from "react-router-dom";
import CartButton from "./cart/CartButton";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import supabase from "@/lib/supabase";

const Navbar = () => {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Navigation will be handled by the auth state listener in App.tsx
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav className="flex justify-between items-center p-4 bg-primary text-primary-foreground">
      <div>
        <Link to="/dashboard" className="mr-4">
          Dashboard
        </Link>
        <Link to="/ledger" className="mr-4">
          Ledger
        </Link>
        <Link to="/reports" className="mr-4">
          Laporan Keuangan
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <CartButton />
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;
