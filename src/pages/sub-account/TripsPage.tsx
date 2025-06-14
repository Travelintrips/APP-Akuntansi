import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/components/ui/use-toast";
import supabase from "@/lib/supabase";

export default function TripsPage() {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    kode_transaksi: "",
    tanggal: "",
    jenis_trip: "",
    destinasi: "",
    tanggal_berangkat: "",
    tanggal_pulang: "",
    jumlah_peserta: "1",
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
    "Domestic",
    "International",
    "Adventure",
    "Cultural",
    "Beach",
    "Mountain",
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
      console.log("Form data submitted:", formData);

      setSuccess(true);
      // Reset form after successful submission
      setFormData({
        kode_transaksi: "",
        tanggal: "",
        jenis_trip: "",
        destinasi: "",
        tanggal_berangkat: "",
        tanggal_pulang: "",
        jumlah_peserta: "1",
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
    <div className="min-h-screen bg-background flex">
      <Sidebar activeItem="sub-account-trips" />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Briefcase className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Booking Trips</h1>
          </div>

          <div className="bg-card p-6 rounded-lg border border-teal-500 tosca-emboss">
            <h2 className="text-xl font-semibold mb-6">
              Form Transaksi Booking Trips
            </h2>

            {/* Category Stat Cards */}
            <div className="mb-6">
              <Label className="mb-2 block">Pilih Kategori Trip</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((category) => (
                  <div
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`p-4 rounded-lg border tosca-emboss cursor-pointer transition-all ${selectedCategory === category ? "bg-primary/10 border-primary" : "bg-card hover:bg-accent/50"}`}
                  >
                    <div className="font-medium">{category}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {category === "Domestic" && "Perjalanan dalam negeri"}
                      {category === "International" && "Perjalanan luar negeri"}
                      {category === "Adventure" && "Wisata petualangan"}
                      {category === "Cultural" && "Wisata budaya"}
                      {category === "Beach" && "Wisata pantai"}
                      {category === "Mountain" && "Wisata pegunungan"}
                    </div>
                  </div>
                ))}
              </div>
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
                    placeholder="TR-001"
                    required
                    className="tosca-emboss"
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
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jenis_trip">Jenis Trip</Label>
                  <Input
                    id="jenis_trip"
                    name="jenis_trip"
                    value={formData.jenis_trip || selectedCategory || ""}
                    onChange={handleChange}
                    placeholder="Domestic"
                    required
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="destinasi">Destinasi</Label>
                  <Input
                    id="destinasi"
                    name="destinasi"
                    value={formData.destinasi}
                    onChange={handleChange}
                    placeholder="Bali"
                    required
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal_berangkat">Tanggal Berangkat</Label>
                  <Input
                    id="tanggal_berangkat"
                    name="tanggal_berangkat"
                    type="date"
                    value={formData.tanggal_berangkat}
                    onChange={handleChange}
                    required
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal_pulang">Tanggal Pulang</Label>
                  <Input
                    id="tanggal_pulang"
                    name="tanggal_pulang"
                    type="date"
                    value={formData.tanggal_pulang}
                    onChange={handleChange}
                    required
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jumlah_peserta">Jumlah Peserta</Label>
                  <Input
                    id="jumlah_peserta"
                    name="jumlah_peserta"
                    type="number"
                    min="1"
                    value={formData.jumlah_peserta}
                    onChange={handleChange}
                    required
                    className="tosca-emboss"
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
                    placeholder="5000000"
                    required
                    className="tosca-emboss"
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
                    placeholder="4500000"
                    required
                    className="tosca-emboss"
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
                    placeholder="100000"
                    required
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profit">Profit (Rp)</Label>
                  <Input
                    id="profit"
                    name="profit"
                    value={formData.profit}
                    readOnly
                    className="bg-muted tosca-emboss"
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
                  className="tosca-emboss"
                />
              </div>

              <div className="pt-4 flex gap-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="tosca-emboss"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex items-center gap-2 tosca-emboss-button"
                  onClick={() => {
                    // Validate required fields
                    if (
                      !formData.kode_transaksi ||
                      !formData.tanggal ||
                      !formData.jenis_trip ||
                      !formData.destinasi ||
                      !formData.tanggal_berangkat ||
                      !formData.tanggal_pulang ||
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
                      type: "trips",
                      name: `Trip ${formData.jenis_trip} - ${formData.destinasi}`,
                      details: `${formData.tanggal_berangkat} s/d ${formData.tanggal_pulang} (${formData.jumlah_peserta} orang)`,
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
                        jumlah_peserta: parseInt(formData.jumlah_peserta) || 1,
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
