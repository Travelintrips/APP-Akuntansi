import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Briefcase, ShoppingCart } from "lucide-react";
import supabase from "@/lib/supabase";
import { createJournalEntryFromSubAccount } from "@/lib/journalEntries";
import { useCart } from "@/context/CartContext";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";
import BackButton from "@/components/common/BackButton";
import CartButton from "@/components/cart/CartButton";

export default function TravelPage() {
  const { addItem } = useCart();
  const [formData, setFormData] = useState({
    kode_transaksi: "",
    tanggal: "",
    nama_paket: "",
    tujuan: "",
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

      // No need to calculate total anymore
      if (name === "harga_jual" || name === "jumlah_peserta") {
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
    "Paket Wisata Bali",
    "Paket Wisata Lombok",
    "Paket Wisata Yogyakarta",
    "Paket Wisata Bandung",
    "Paket Wisata Malang",
    "Paket Wisata Bromo",
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
        .from('travel_transactions')
        .insert([
          {
            kode_transaksi: formData.kode_transaksi,
            tanggal: formData.tanggal,
            nama_paket: formData.nama_paket,
            tujuan: formData.tujuan,
            tanggal_berangkat: formData.tanggal_berangkat,
            tanggal_pulang: formData.tanggal_pulang,
            jumlah_peserta: parseInt(formData.jumlah_peserta),
            harga_per_orang: parseFloat(formData.harga_per_orang),
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
        nama_paket: "",
        tujuan: "",
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
    <div className="min-h-screen bg-background">
      <div className="p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BackButton to="/sub-account" />
              <Briefcase className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Travel</h1>
            </div>
            <CartButton />
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-6">
              Form Transaksi Travel
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
                    placeholder="TRV-001"
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
                  <Label htmlFor="nama_paket">Nama Paket</Label>
                  <Input
                    id="nama_paket"
                    name="nama_paket"
                    value={formData.nama_paket || selectedCategory || ""}
                    onChange={handleChange}
                    placeholder="Paket Wisata Bali"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tujuan">Tujuan</Label>
                  <Input
                    id="tujuan"
                    name="tujuan"
                    value={formData.tujuan}
                    onChange={handleChange}
                    placeholder="Bali"
                    required
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="harga_jual">Harga Jual per Orang (Rp)</Label>
                  <Input
                    id="harga_jual"
                    name="harga_jual"
                    type="number"
                    value={formData.harga_jual}
                    onChange={handleChange}
                    placeholder="5000000"
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
                    placeholder="4000000"
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
                    placeholder="250000"
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
                <Button
                  type="button"
                  className="flex items-center gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    // Validate form data
                    if (
                      !formData.kode_transaksi ||
                      !formData.tanggal ||
                      !formData.nama_paket ||
                      !formData.tujuan ||
                      !formData.harga_jual
                    ) {
                      toast({
                        title: "Data tidak lengkap",
                        description:
                          "Mohon lengkapi data transaksi sebelum menambahkan ke keranjang",
                        variant: "destructive",
                      });
                      return;
                    }

                    // Calculate total amount
                    const totalAmount =
                      parseFloat(formData.harga_jual) *
                      parseInt(formData.jumlah_peserta);

                    // Add to cart
                    addItem({
                      id: uuidv4(),
                      type: "travel",
                      name: `Paket ${formData.nama_paket}`,
                      details: `${formData.tujuan} - ${formData.jumlah_peserta} peserta`,
                      price: parseFloat(formData.harga_jual),
                      quantity: parseInt(formData.jumlah_peserta),
                      date: formData.tanggal,
                      kode_transaksi: formData.kode_transaksi,
                      additionalData: {
                        ...formData,
                        harga_jual: parseFloat(formData.harga_jual),
                        harga_basic: parseFloat(formData.harga_basic),
                        fee_sales: parseFloat(formData.fee_sales),
                        profit: parseFloat(formData.profit),
                        jumlah_peserta: parseInt(formData.jumlah_peserta),
                        totalAmount: totalAmount,
                      },
                    });

                    // Show success message
                    setSuccess(true);

                    // Reset form
                    setFormData({
                      kode_transaksi: "",
                      tanggal: "",
                      nama_paket: "",
                      tujuan: "",
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

                    toast({
                      title: "Berhasil ditambahkan",
                      description: (
                        <div className="flex flex-col gap-2">
                          <div>
                            Paket {formData.nama_paket} ({formData.tujuan})
                            telah ditambahkan ke keranjang
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="self-end"
                            onClick={() => {
                              const closeToast = document.querySelector(
                                "[data-radix-toast-close]",
                              );
                              if (closeToast instanceof HTMLElement) {
                                closeToast.click();
                              }
                            }}
                          >
                            Tutup
                          </Button>
                        </div>
                      ),
                    });
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Tambahkan ke Keranjang
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
