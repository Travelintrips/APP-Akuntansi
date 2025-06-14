import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bus, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/components/ui/use-toast";
import supabase from "@/lib/supabase";
import BackButton from "@/components/common/BackButton";
import CartButton from "@/components/cart/CartButton";

export default function AirportTransferPage() {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    kode_transaksi: "",
    tanggal: "",
    jenis_kendaraan: "",
    rute: "",
    tanggal_jemput: "",
    waktu_jemput: "",
    jumlah_penumpang: "1",
    harga_jual: "",
    harga_basic: "",
    fee_sales: "",
    profit: "",
    keterangan: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // No need to calculate total anymore
      if (name === "harga_jual") {
        // Calculation removed
      }

      // Calculate profit
      if (
        name === "harga_jual" ||
        name === "harga_basic" ||
        name === "fee_sales"
      ) {
        const hargaJual = parseFloat(newData.harga_jual) || 0;
        const hargaBasic = parseFloat(newData.harga_basic) || 0;
        const feeSales = parseFloat(newData.fee_sales) || 0;
        newData.profit = Math.max(
          0,
          hargaJual - hargaBasic - feeSales,
        ).toString();
      }

      return newData;
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value === "") {
      setSelectedCategory(null);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSearchTerm(""); // Clear the search term when a category is selected
    // You can also update form data based on the selected category if needed
  };

  const categories = [
    "Avanza",
    "Innova",
    "Hiace",
    "Alphard",
    "Fortuner",
    "Pajero",
  ];

  const filteredCategories = categories.filter((category) =>
    category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Here you would typically save to your database
      // For demonstration, we'll just log the data and show success
      console.log("Form data submitted:", formData);

      // Example of how you might save this to Supabase
      // Uncomment and modify as needed for your schema
      /*
      const { error } = await supabase
        .from('airport_transfer_transactions')
        .insert([
          {
            kode_transaksi: formData.kode_transaksi,
            tanggal: formData.tanggal,
            jenis_kendaraan: formData.jenis_kendaraan,
            rute: formData.rute,
            tanggal_jemput: formData.tanggal_jemput,
            waktu_jemput: formData.waktu_jemput,
            jumlah_penumpang: parseInt(formData.jumlah_penumpang),
            harga: parseFloat(formData.harga),
            total: parseFloat(formData.total),
            keterangan: formData.keterangan,
          }
        ]);
      
      if (error) throw error;
      */

      setSuccess(true);
      // Reset form after successful submission
      setFormData({
        kode_transaksi: "",
        tanggal: "",
        jenis_kendaraan: "",
        rute: "",
        tanggal_jemput: "",
        waktu_jemput: "",
        jumlah_penumpang: "1",
        harga_jual: "",
        harga_basic: "",
        fee_sales: "",
        profit: "",
        keterangan: "",
      });
      setSelectedCategory(null);
      setSearchTerm("");
    } catch (err: any) {
      console.error("Error submitting form:", err);
      setError(err.message || "Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BackButton to="/sub-account" />
              <Bus className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Airport Transfer</h1>
            </div>
            <CartButton />
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-6">
              Form Transaksi Airport Transfer
            </h2>

            {/* Category Search Section */}
            <div className="mb-6">
              <Label htmlFor="category-search">Search Category</Label>
              <div className="relative">
                <Input
                  id="category-search"
                  placeholder="Search for a category..."
                  value={selectedCategory || searchTerm}
                  onChange={handleSearchChange}
                  className="mb-2"
                />
                {selectedCategory && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(null);
                        setSearchTerm("");
                      }}
                      className="h-6 px-2"
                    >
                      ×
                    </Button>
                  </div>
                )}
              </div>

              {!selectedCategory && searchTerm && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {filteredCategories.map((category) => (
                    <Button
                      key={category}
                      variant="outline"
                      onClick={() => handleCategorySelect(category)}
                      className="justify-start"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              )}

              {!selectedCategory && !searchTerm && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant="outline"
                      onClick={() => handleCategorySelect(category)}
                      className="justify-start"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mb-6">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 text-green-800 p-3 rounded-md text-sm mb-6">
                Data berhasil disimpan!
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="kode_transaksi">Kode Transaksi</Label>
                  <Input
                    id="kode_transaksi"
                    name="kode_transaksi"
                    value={formData.kode_transaksi}
                    onChange={handleChange}
                    placeholder="AT-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal">Tanggal Transaksi</Label>
                  <Input
                    id="tanggal"
                    name="tanggal"
                    type="date"
                    value={formData.tanggal}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jenis_kendaraan">Jenis Kendaraan</Label>
                  <Input
                    id="jenis_kendaraan"
                    name="jenis_kendaraan"
                    value={formData.jenis_kendaraan || selectedCategory || ""}
                    onChange={handleChange}
                    placeholder="Avanza"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rute">Rute</Label>
                  <Input
                    id="rute"
                    name="rute"
                    value={formData.rute}
                    onChange={handleChange}
                    placeholder="Bandara Soekarno-Hatta - Hotel"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal_jemput">Tanggal Jemput</Label>
                  <Input
                    id="tanggal_jemput"
                    name="tanggal_jemput"
                    type="date"
                    value={formData.tanggal_jemput}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="waktu_jemput">Waktu Jemput</Label>
                  <Input
                    id="waktu_jemput"
                    name="waktu_jemput"
                    type="time"
                    value={formData.waktu_jemput}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jumlah_penumpang">Jumlah Penumpang</Label>
                  <Input
                    id="jumlah_penumpang"
                    name="jumlah_penumpang"
                    type="number"
                    min="1"
                    value={formData.jumlah_penumpang}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="harga_jual">Harga Jual (Rp)</Label>
                  <Input
                    id="harga_jual"
                    name="harga_jual"
                    type="number"
                    value={formData.harga_jual}
                    onChange={handleChange}
                    placeholder="300000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="harga_basic">Harga Basic (Rp)</Label>
                  <Input
                    id="harga_basic"
                    name="harga_basic"
                    type="number"
                    value={formData.harga_basic}
                    onChange={handleChange}
                    placeholder="250000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fee_sales">Fee Sales (Rp)</Label>
                  <Input
                    id="fee_sales"
                    name="fee_sales"
                    type="number"
                    value={formData.fee_sales}
                    onChange={handleChange}
                    placeholder="15000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profit">Profit (Rp)</Label>
                  <Input
                    id="profit"
                    name="profit"
                    value={formData.profit}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan</Label>
                <Input
                  id="keterangan"
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleChange}
                  placeholder="Keterangan tambahan..."
                />
              </div>

              <div className="pt-4 flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => {
                    // Validate required fields
                    if (
                      !formData.kode_transaksi ||
                      !formData.tanggal ||
                      !formData.jenis_kendaraan ||
                      !formData.rute ||
                      !formData.tanggal_jemput ||
                      !formData.waktu_jemput ||
                      !formData.harga_jual ||
                      !formData.harga_basic ||
                      !formData.fee_sales
                    ) {
                      toast({
                        title: "Error",
                        description: "Harap isi semua field yang diperlukan",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Add to cart
                    const newItem = {
                      id: uuidv4(),
                      type: "airport-transfer",
                      name: `Airport Transfer ${formData.jenis_kendaraan}`,
                      details: `${formData.rute} - ${formData.tanggal_jemput} ${formData.waktu_jemput}`,
                      price: parseFloat(formData.harga_jual) || 0,
                      quantity: 1,
                      date: formData.tanggal,
                      kode_transaksi: formData.kode_transaksi,
                      additionalData: {
                        ...formData,
                        harga_jual: parseFloat(formData.harga_jual) || 0,
                        harga_basic: parseFloat(formData.harga_basic) || 0,
                        fee_sales: parseFloat(formData.fee_sales) || 0,
                        profit: parseFloat(formData.profit) || 0,
                        jumlah_penumpang:
                          parseInt(formData.jumlah_penumpang) || 1,
                      },
                    };

                    console.log("Adding item to cart:", newItem);
                    addItem(newItem);

                    toast({
                      title: "Berhasil",
                      description: "Item berhasil ditambahkan ke keranjang",
                    });
                  }}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Tambah ke Keranjang
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
