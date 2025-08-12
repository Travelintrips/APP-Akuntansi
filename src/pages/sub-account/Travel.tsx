import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Briefcase, ShoppingCart, Check, ChevronsUpDown } from "lucide-react";
import supabase from "@/lib/supabase";
// Removed accounting imports - accounting integration disabled
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
    jumlah_peserta: "1",
    nama_penumpang: "",
    no_telepon: "",
    foto_penumpang: "",
    harga_jual: "",
    harga_basic: "",
    fee_sales: "",
    profit: "",
    keterangan: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [open, setOpen] = useState(false);

  // Generate next travel number
  const generateNextTravelNumber = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings_trips")
        .select("kode_booking, created_at")
        .like("kode_booking", "TRV-%")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching latest travel booking:", error);
        return "TRV-001";
      }

      if (!data || data.length === 0) {
        return "TRV-001";
      }

      let highestNumber = 0;
      data.forEach((booking) => {
        const match = booking.kode_booking.match(/TRV-(\d+)/);
        if (match) {
          const number = parseInt(match[1]);
          if (number > highestNumber) {
            highestNumber = number;
          }
        }
      });

      const nextNumber = highestNumber + 1;
      return `TRV-${nextNumber.toString().padStart(3, "0")}`;
    } catch (error) {
      console.error("Error generating travel number:", error);
      return "TRV-001";
    }
  };

  // Initialize travel number on component mount
  useEffect(() => {
    const initializeTravelNumber = async () => {
      const nextTravelNumber = await generateNextTravelNumber();
      setFormData((prev) => ({
        ...prev,
        kode_transaksi: nextTravelNumber,
      }));
    };

    initializeTravelNumber();
  }, []);

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

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    // Update form data based on the selected category
    setFormData((prev) => ({
      ...prev,
      nama_paket: category,
      tujuan: category.split(" - ")[1] || "",
    }));
  };

  const categories = [
    // Jawa
    "CGK - Jakarta",
    "CGK - Bandung",
    "CGK - Yogyakarta",
    "CGK - Solo",
    "CGK - Semarang",
    "CGK - Surabaya",
    "CGK - Malang",
    "CGK - Bromo",
    "CGK - Bogor",
    "CGK - Cirebon",
    // Bali
    "CGK - Denpasar",
    "CGK - Ubud",
    "CGK - Sanur",
    "CGK - Kuta",
    "CGK - Nusa Dua",
    // Sumatra
    "CGK - Medan",
    "CGK - Palembang",
    "CGK - Padang",
    "CGK - Pekanbaru",
    "CGK - Jambi",
    "CGK - Bengkulu",
    "CGK - Bandar Lampung",
    // Lombok
    "CGK - Mataram",
    "CGK - Senggigi",
    "CGK - Gili Trawangan",
    // Madura
    "CGK - Pamekasan",
    "CGK - Sumenep",
    "CGK - Bangkalan",
    // NTB
    "CGK - Bima",
    "CGK - Dompu",
    "CGK - Sumbawa",
    // NTT
    "CGK - Kupang",
    "CGK - Ende",
    "CGK - Maumere",
    "CGK - Labuan Bajo",
  ];

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
        jumlah_peserta: "1",
        nama_penumpang: "",
        no_telepon: "",
        foto_penumpang: "",
        harga_jual: "",
        harga_basic: "",
        fee_sales: "",
        profit: "",
        keterangan: "",
      });
      setSelectedCategory("");
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
              <h1 className="text-3xl font-bold">Travel Antar Kota</h1>
            </div>
            <CartButton />
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-6">
              Form Transaksi Travel Antar Kota
            </h2>

            {/* Category Selection */}
            <div className="mb-6">
              <Label htmlFor="category-select">Pilih Kategori Rute</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {selectedCategory
                      ? categories.find(
                          (category) => category === selectedCategory,
                        )
                      : "Pilih rute perjalanan..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Cari rute perjalanan..." />
                    <CommandList>
                      <CommandEmpty>
                        Tidak ada rute yang ditemukan.
                      </CommandEmpty>
                      <CommandGroup>
                        {categories.map((category) => (
                          <CommandItem
                            key={category}
                            value={category}
                            onSelect={(currentValue) => {
                              const selectedValue =
                                currentValue === selectedCategory
                                  ? ""
                                  : currentValue;
                              setSelectedCategory(selectedValue);
                              handleCategorySelect(selectedValue);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedCategory === category
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {category}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
                    value={formData.nama_paket}
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
                  <Label htmlFor="nama_penumpang">Nama Penumpang</Label>
                  <Input
                    id="nama_penumpang"
                    name="nama_penumpang"
                    value={formData.nama_penumpang}
                    onChange={handleChange}
                    placeholder="Nama lengkap penumpang"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="no_telepon">No. Telepon</Label>
                  <Input
                    id="no_telepon"
                    name="no_telepon"
                    value={formData.no_telepon}
                    onChange={handleChange}
                    placeholder="08123456789"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="foto_penumpang">Foto Penumpang</Label>
                  <Input
                    id="foto_penumpang"
                    name="foto_penumpang"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData((prev) => ({
                          ...prev,
                          foto_penumpang: file.name,
                        }));
                      }
                    }}
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
                  onClick={async (e) => {
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

                    try {
                      // Calculate total amount
                      const totalAmount =
                        parseFloat(formData.harga_jual) *
                        parseInt(formData.jumlah_peserta);

                      // Accounting integration removed - no journal entry created

                      // Add to cart (CartContext will handle database save)
                      await addItem({
                        id: uuidv4(),
                        type: "travel",
                        name: `Travel ${formData.nama_paket}`,
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
                          nama_paket: formData.nama_paket,
                          tujuan: formData.tujuan,
                          tanggal_berangkat: formData.tanggal_berangkat,
                          nama_penumpang: formData.nama_penumpang,
                          no_telepon: formData.no_telepon,
                          foto_penumpang: formData.foto_penumpang,
                          keterangan: formData.keterangan,
                        },
                      });

                      // Show success message
                      setSuccess(true);

                      // Reset form
                      const nextTravelNumber = await generateNextTravelNumber();
                      setFormData({
                        kode_transaksi: nextTravelNumber,
                        tanggal: "",
                        nama_paket: "",
                        tujuan: "",
                        tanggal_berangkat: "",
                        jumlah_peserta: "1",
                        nama_penumpang: "",
                        no_telepon: "",
                        foto_penumpang: "",
                        harga_jual: "",
                        harga_basic: "",
                        fee_sales: "",
                        profit: "",
                        keterangan: "",
                      });
                      setSelectedCategory("");

                      toast({
                        title: "Berhasil ditambahkan",
                        description: (
                          <div className="flex flex-col gap-2">
                            <div>
                              Travel {formData.nama_paket} ({formData.tujuan})
                              telah ditambahkan ke keranjang dan database
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
                    } catch (err: any) {
                      console.error("Error saving booking:", err);
                      toast({
                        title: "Error",
                        description: `Gagal menyimpan booking: ${err.message}`,
                        variant: "destructive",
                      });
                    }
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
