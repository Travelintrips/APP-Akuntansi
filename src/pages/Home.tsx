import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import COAList from "@/components/coa/COAList";

export default function Home() {
  return (
    <>
      <Navbar />
      <div className="container py-8 max-w-5xl">
        <div className="flex flex-col items-center justify-center gap-6 mb-8">
          <h1 className="text-3xl font-bold">Sistem Akuntansi</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Selamat datang di aplikasi sistem akuntansi. Silahkan pilih menu di
            bawah ini.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-md mt-4">
            <Button asChild className="w-full">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild className="w-full">
              <Link to="/reports">Laporan Keuangan</Link>
            </Button>
            <Button asChild className="w-full">
              <Link to="/balance-sheet">Neraca (Balance Sheet)</Link>
            </Button>
          </div>
        </div>

        <COAList />
      </div>
    </>
  );
}
