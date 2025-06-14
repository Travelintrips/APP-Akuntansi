import { Link } from "react-router-dom";
import CartButton from "./cart/CartButton";

const Navbar = () => {
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
      <CartButton />
    </nav>
  );
};

export default Navbar;
