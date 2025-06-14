import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, ShoppingCart } from "lucide-react";
import supabase from "@/lib/supabase";
import { createJournalEntryFromSubAccount } from "@/lib/journalEntries";
import { useCart } from "@/context/CartContext";
import { v4 as uuidv4 } from "uuid";
import BackButton from "@/components/common/BackButton";
import CartButton from "@/components/cart/CartButton";

export default function PassengerHandlingPage() {
  const { addItem } = useCart();
  const [formData, setFormData] = useState({
    kode_transaksi: "",
    tanggal: "",
    nama_layanan: "",
    lokasi: "",
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
  const [addedToCart, setAddedToCart] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // No need to calculate total anymore
      if (name === "harga_jual" || name === "jumlah_penumpang") {
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
    "Airport Assistance",
    "VIP Meet & Greet",
    "Fast Track",
    "Lounge Access",
    "Baggage Handling",
    "Wheelchair Service",
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
        .from('passenger_handling_transactions')
        .insert([
          {
            kode_transaksi: formData.kode_transaksi,
            tanggal: formData.tanggal,
            nama_layanan: formData.nama_layanan,
            lokasi: formData.lokasi,
            jumlah_penumpang: parseInt(formData.jumlah_penumpang),
            harga_jual: parseFloat(formData.harga_jual),
            keterangan: formData.keterangan,
          }
        ]);
      
      if (error) throw error;
      */

      // Create journal entry automatically
      // Fetch the account IDs for Passenger Handling transactions
      const { data: pendapatanAccount, error: pendapatanError } = await supabase
        .from("chart_of_accounts")
        .select("id")
        .eq("account_code", "4103") // Pendapatan Passenger Handling
        .single();

      if (pendapatanError)
        throw new Error("Akun Pendapatan Passenger Handling tidak ditemukan");

      // Get Kas account
      const { data: kasAccount, error: kasError } = await supabase
        .from("chart_of_accounts")
        .select("id")
        .eq("account_code", "1101") // Kas
        .single();

      if (kasError) throw new Error("Akun Kas tidak ditemukan");

      const totalAmount =
        parseFloat(formData.harga_jual) * parseInt(formData.jumlah_penumpang);

      const journalResult = await createJournalEntryFromSubAccount({
        date: formData.tanggal,
        description: `Penjualan Passenger Handling - ${formData.nama_layanan} (${formData.lokasi})`,
        accountDebit: kasAccount.id, // Kas (Debit)
        accountCredit: pendapatanAccount.id, // Pendapatan Passenger Handling (Credit)
        amount: totalAmount,
        reference: formData.kode_transaksi,
      });

      if (!journalResult.success) {
        throw new Error(journalResult.error || "Gagal membuat jurnal entri");
      }

      setSuccess(true);
      // Reset form after successful submission
      setFormData({
        kode_transaksi: "",
        tanggal: "",
        nama_layanan: "",
        lokasi: "",
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
              <Users className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Passenger Handling</h1>
            </div>
            <CartButton />
          </div>

          <div className="bg-card p-8 rounded-xl border shadow-sm border-teal-200 tosca-emboss">
            <h2 className="text-2xl font-bold mb-8 text-primary">
              Form Transaksi Passenger Handling
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
                  className="mb-2 tosca-emboss"
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
              <div className="bg-destructive/10 text-destructive p-5 rounded-lg text-base mb-8 shadow-sm border border-destructive/20">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 text-green-800 p-5 rounded-lg text-base mb-8 shadow-sm border border-green-200">
                Data berhasil disimpan!
              </div>
            )}

            {addedToCart && (
              <div className="bg-green-100 text-green-800 p-5 rounded-lg text-base mb-8 shadow-sm border border-green-200 flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Item berhasil ditambahkan ke keranjang!
                <div className="ml-auto">
                  <Button
                    variant="link"
                    className="text-green-800 p-0 h-auto"
                    onClick={() => setAddedToCart(false)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            )}

            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="kode_transaksi">Kode Transaksi</Label>
                  <Input
                    id="kode_transaksi"
                    name="kode_transaksi"
                    value={formData.kode_transaksi}
                    onChange={handleChange}
                    placeholder="PH-001"
                    required
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal">Tanggal</Label>
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
                  <Label htmlFor="nama_layanan">Nama Layanan</Label>
                  <Input
                    id="nama_layanan"
                    name="nama_layanan"
                    value={formData.nama_layanan || selectedCategory || ""}
                    onChange={handleChange}
                    placeholder="Airport Assistance"
                    required
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lokasi">Lokasi</Label>
                  <Input
                    id="lokasi"
                    name="lokasi"
                    value={formData.lokasi}
                    onChange={handleChange}
                    placeholder="Bandara Soekarno-Hatta"
                    required
                    className="tosca-emboss"
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
                    className="tosca-emboss"
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
                    placeholder="500000"
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
                    placeholder="400000"
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
                    placeholder="25000"
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

              <div className="pt-6 flex gap-2">
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    // Validate required fields
                    if (
                      !formData.kode_transaksi ||
                      !formData.tanggal ||
                      !formData.nama_layanan ||
                      !formData.lokasi ||
                      !formData.harga_jual
                    ) {
                      setError(
                        "Harap isi semua field yang diperlukan sebelum menambahkan ke keranjang",
                      );
                      return;
                    }

                    // Add to cart
                    const totalPrice =
                      parseFloat(formData.harga_jual) *
                      parseInt(formData.jumlah_penumpang);

                    addItem({
                      id: uuidv4(),
                      type: "passenger-handling",
                      name: formData.nama_layanan,
                      details: `${formData.lokasi} - ${formData.jumlah_penumpang} orang`,
                      price: parseFloat(formData.harga_jual),
                      quantity: parseInt(formData.jumlah_penumpang),
                      date: formData.tanggal,
                      kode_transaksi: formData.kode_transaksi,
                      additionalData: { ...formData },
                    });

                    // Show success message
                    setAddedToCart(true);
                    setTimeout(() => setAddedToCart(false), 3000);

                    // Reset form after adding to cart
                    setFormData({
                      kode_transaksi: "",
                      tanggal: "",
                      nama_layanan: "",
                      lokasi: "",
                      jumlah_penumpang: "1",
                      harga_jual: "",
                      harga_basic: "",
                      fee_sales: "",
                      profit: "",
                      keterangan: "",
                    });
                    setSelectedCategory(null);
                    setSearchTerm("");

                    // Show success message
                    setSuccess(true);
                    setTimeout(() => setSuccess(false), 3000);
                  }}
                  disabled={loading}
                  className="h-12 text-base font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] tosca-emboss-button"
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
