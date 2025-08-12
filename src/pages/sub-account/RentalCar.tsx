import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, ShoppingCart } from "lucide-react";
import supabase from "@/lib/supabase";
// Removed accounting imports - accounting integration disabled
import { useCart } from "@/context/CartContext";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/components/ui/use-toast";
import BackButton from "@/components/common/BackButton";
import CartButton from "@/components/cart/CartButton";

export default function RentalCarPage() {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    kode_transaksi: "",
    tanggal: "",
    nama_penumpang: "",
    no_telepon: "",
    jenis_kendaraan: "",
    nomor_plat: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
    harga_jual: "",
    harga_basic: "",
    fee_sales: "",
    profit: "",
    jumlah_hari: "1",
    keterangan: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate next rental car number
  const generateNextRCNumber = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings_trips")
        .select("kode_booking, created_at")
        .like("kode_booking", "RC-%")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching latest RC booking:", error);
        return "RC-001";
      }

      if (!data || data.length === 0) {
        return "RC-001";
      }

      let highestNumber = 0;
      data.forEach((booking) => {
        const match = booking.kode_booking.match(/RC-(\d+)/);
        if (match) {
          const number = parseInt(match[1]);
          if (number > highestNumber) {
            highestNumber = number;
          }
        }
      });

      const nextNumber = highestNumber + 1;
      return `RC-${nextNumber.toString().padStart(3, "0")}`;
    } catch (error) {
      console.error("Error generating RC number:", error);
      return "RC-001";
    }
  };

  // Initialize rental car number on component mount
  useEffect(() => {
    const initializeRCNumber = async () => {
      const nextRCNumber = await generateNextRCNumber();
      setFormData((prev) => ({
        ...prev,
        kode_transaksi: nextRCNumber,
      }));
    };

    initializeRCNumber();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Calculate days and profit when values change
      if (name === "harga_jual" || name === "jumlah_hari") {
        // No need to calculate total anymore
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

      // Calculate days if start and end dates are set
      if (
        (name === "tanggal_mulai" || name === "tanggal_selesai") &&
        newData.tanggal_mulai &&
        newData.tanggal_selesai
      ) {
        const startDate = new Date(newData.tanggal_mulai);
        const endDate = new Date(newData.tanggal_selesai);
        if (endDate >= startDate) {
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          newData.jumlah_hari = diffDays.toString();

          // No need to update total anymore
        }
      }

      return newData;
    });
  };

  const addToCart = () => {
    // Validate required fields
    if (
      !formData.kode_transaksi ||
      !formData.tanggal ||
      !formData.nama_penumpang ||
      !formData.no_telepon ||
      !formData.jenis_kendaraan ||
      !formData.nomor_plat ||
      !formData.tanggal_mulai ||
      !formData.tanggal_selesai ||
      !formData.harga_jual ||
      !formData.harga_basic ||
      !formData.fee_sales
    ) {
      setError("Harap isi semua field yang diperlukan");
      return false;
    }

    // Calculate total price
    const hargaJual = parseFloat(formData.harga_jual) || 0;
    const jumlahHari = parseInt(formData.jumlah_hari) || 1;
    const totalPrice = hargaJual * jumlahHari;

    // Add to cart
    addItem({
      id: uuidv4(),
      type: "rental-car",
      name: `Rental ${formData.jenis_kendaraan} (${formData.nomor_plat})`,
      details: `${jumlahHari} hari, ${formData.tanggal_mulai} s/d ${formData.tanggal_selesai}`,
      price: totalPrice,
      quantity: 1,
      date: formData.tanggal,
      kode_transaksi: formData.kode_transaksi,
      additionalData: { ...formData },
    });

    toast({
      title: "Ditambahkan ke keranjang",
      description: `${formData.jenis_kendaraan} (${formData.nomor_plat}) berhasil ditambahkan ke keranjang.`,
    });

    return true;
  };

  // Removed handleSubmit function as we're now handling everything in the button click

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BackButton to="/sub-account" />
              <Car className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Rental Mobil</h1>
            </div>
            <CartButton />
          </div>

          <div className="bg-card p-8 rounded-xl border shadow-sm border-teal-200 tosca-emboss">
            <h2 className="text-2xl font-bold mb-8 text-primary">
              Form Transaksi Rental Mobil
            </h2>

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

            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="kode_transaksi">Kode Transaksi</Label>
                  <Input
                    id="kode_transaksi"
                    name="kode_transaksi"
                    value={formData.kode_transaksi}
                    onChange={handleChange}
                    placeholder="RC-001"
                    required
                    readOnly
                    className="tosca-emboss bg-muted"
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
                  <Label htmlFor="nama_penumpang">Nama Penumpang</Label>
                  <Input
                    id="nama_penumpang"
                    name="nama_penumpang"
                    value={formData.nama_penumpang}
                    onChange={handleChange}
                    placeholder="Nama lengkap penumpang"
                    required
                    className="tosca-emboss"
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
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jenis_kendaraan">Jenis Kendaraan</Label>
                  <Input
                    id="jenis_kendaraan"
                    name="jenis_kendaraan"
                    value={formData.jenis_kendaraan}
                    onChange={handleChange}
                    placeholder="Toyota Avanza"
                    required
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nomor_plat">Nomor Plat</Label>
                  <Input
                    id="nomor_plat"
                    name="nomor_plat"
                    value={formData.nomor_plat}
                    onChange={handleChange}
                    placeholder="B 1234 ABC"
                    required
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal_mulai">Tanggal Mulai</Label>
                  <Input
                    id="tanggal_mulai"
                    name="tanggal_mulai"
                    type="date"
                    value={formData.tanggal_mulai}
                    onChange={handleChange}
                    required
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal_selesai">Tanggal Selesai</Label>
                  <Input
                    id="tanggal_selesai"
                    name="tanggal_selesai"
                    type="date"
                    value={formData.tanggal_selesai}
                    onChange={handleChange}
                    required
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="harga_jual">Harga Jual per Hari (Rp)</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="jumlah_hari">Jumlah Hari</Label>
                  <Input
                    id="jumlah_hari"
                    name="jumlah_hari"
                    type="number"
                    min="1"
                    value={formData.jumlah_hari}
                    onChange={handleChange}
                    required
                    className="tosca-emboss"
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
                  onClick={async (e) => {
                    e.preventDefault();
                    // Validate required fields
                    if (
                      !formData.kode_transaksi ||
                      !formData.tanggal ||
                      !formData.jenis_kendaraan ||
                      !formData.nomor_plat ||
                      !formData.tanggal_mulai ||
                      !formData.tanggal_selesai ||
                      !formData.harga_jual ||
                      !formData.harga_basic ||
                      !formData.fee_sales
                    ) {
                      setError("Harap isi semua field yang diperlukan");
                      return;
                    }

                    try {
                      // Calculate total price
                      const hargaJual = parseFloat(formData.harga_jual) || 0;
                      const jumlahHari = parseInt(formData.jumlah_hari) || 1;
                      const totalPrice = hargaJual * jumlahHari;

                      // Save to bookings_trips table
                      const { error: bookingError } = await supabase
                        .from("bookings_trips")
                        .insert([
                          {
                            kode_booking: formData.kode_transaksi,
                            service_type: "rental_car",
                            service_name: `Rental ${formData.jenis_kendaraan} (${formData.nomor_plat})`,
                            service_details: `${jumlahHari} hari, ${formData.tanggal_mulai} s/d ${formData.tanggal_selesai}`,
                            price: hargaJual,
                            harga_jual: hargaJual,
                            harga_basic: parseFloat(formData.harga_basic) || 0,
                            fee_sales: parseFloat(formData.fee_sales) || 0,
                            profit: parseFloat(formData.profit) || 0,
                            quantity: 1,
                            total_amount: totalPrice,
                            tanggal: formData.tanggal,
                            status: "confirmed",
                            nama_penumpang: formData.nama_penumpang,
                            no_telepon: parseInt(formData.no_telepon) || null,
                            keterangan: formData.keterangan,
                            additional_data: JSON.stringify({
                              jenis_kendaraan: formData.jenis_kendaraan,
                              nomor_plat: formData.nomor_plat,
                              tanggal_mulai: formData.tanggal_mulai,
                              tanggal_selesai: formData.tanggal_selesai,
                              jumlah_hari: jumlahHari,
                            }),
                          },
                        ]);

                      if (bookingError) {
                        throw bookingError;
                      }

                      // Accounting integration removed - no journal entry created

                      // Add to cart
                      addItem({
                        id: uuidv4(),
                        type: "rental-car",
                        name: `Rental ${formData.jenis_kendaraan} (${formData.nomor_plat})`,
                        details: `${jumlahHari} hari, ${formData.tanggal_mulai} s/d ${formData.tanggal_selesai}`,
                        price: totalPrice,
                        quantity: 1,
                        date: formData.tanggal,
                        kode_transaksi: formData.kode_transaksi,
                        additionalData: { ...formData },
                      });

                      // Show success message
                      setSuccess(true);

                      // Reset form
                      const nextRCNumber = await generateNextRCNumber();
                      setFormData({
                        kode_transaksi: nextRCNumber,
                        tanggal: "",
                        nama_penumpang: "",
                        no_telepon: "",
                        jenis_kendaraan: "",
                        nomor_plat: "",
                        tanggal_mulai: "",
                        tanggal_selesai: "",
                        harga_jual: "",
                        harga_basic: "",
                        fee_sales: "",
                        profit: "",
                        jumlah_hari: "1",
                        keterangan: "",
                      });

                      toast({
                        title: "Ditambahkan ke keranjang",
                        description: (
                          <div className="flex flex-col gap-2">
                            <div>
                              {formData.jenis_kendaraan} ({formData.nomor_plat})
                              berhasil ditambahkan ke keranjang dan database.
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
                      setError(`Gagal menyimpan booking: ${err.message}`);
                    }
                  }}
                  className="flex items-center gap-2 h-12 text-base font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] w-full tosca-emboss-button"
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
