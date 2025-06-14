import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hotel, ShoppingCart } from "lucide-react";
import supabase from "@/lib/supabase";
import { createJournalEntryFromSubAccount } from "@/lib/journalEntries";
import { useCart } from "@/context/CartContext";
import { v4 as uuidv4 } from "uuid";
import { toast } from "@/components/ui/use-toast";
import BackButton from "@/components/common/BackButton";
import CartButton from "@/components/cart/CartButton";

export default function HotelPage() {
  const { addItem } = useCart();
  const [formData, setFormData] = useState({
    kode_transaksi: "",
    tanggal: "",
    nama_hotel: "",
    lokasi: "",
    tanggal_checkin: "",
    tanggal_checkout: "",
    jumlah_kamar: "1",
    harga_jual: "",
    harga_basic: "",
    fee_sales: "",
    profit: "",
    total_malam: "1",
    keterangan: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // No need to calculate total anymore
      if (
        name === "harga_jual" ||
        name === "total_malam" ||
        name === "jumlah_kamar"
      ) {
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

      // Calculate total nights if check-in and check-out dates are set
      if (
        (name === "tanggal_checkin" || name === "tanggal_checkout") &&
        newData.tanggal_checkin &&
        newData.tanggal_checkout
      ) {
        const checkin = new Date(newData.tanggal_checkin);
        const checkout = new Date(newData.tanggal_checkout);
        if (checkout > checkin) {
          const diffTime = Math.abs(checkout.getTime() - checkin.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          newData.total_malam = diffDays.toString();

          // No need to update total anymore
        }
      }

      return newData;
    });
  };

  // Removed handleSubmit function as we no longer need it

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BackButton to="/sub-account" />
              <Hotel className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Penjualan Hotel</h1>
            </div>
            <CartButton />
          </div>

          <div className="bg-card p-8 rounded-xl border shadow-sm">
            <h2 className="text-2xl font-bold mb-8 text-primary">
              Form Transaksi Hotel
            </h2>

            {error && (
              <div className="bg-destructive/10 text-destructive p-5 rounded-lg text-base mb-8 shadow-sm border border-destructive/20">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-100 text-green-800 p-6 rounded-lg mb-8 border border-green-200 shadow-sm">
                <h3 className="font-bold text-xl mb-4 text-green-900">
                  Receipt Transaksi Hotel
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Kode Transaksi:</span>
                    <span>{formData.kode_transaksi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Tanggal:</span>
                    <span>{formData.tanggal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Hotel:</span>
                    <span>{formData.nama_hotel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Lokasi:</span>
                    <span>{formData.lokasi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Check-in:</span>
                    <span>{formData.tanggal_checkin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Check-out:</span>
                    <span>{formData.tanggal_checkout}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Jumlah Kamar:</span>
                    <span>{formData.jumlah_kamar}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Malam:</span>
                    <span>{formData.total_malam}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Harga per Malam:</span>
                    <span>
                      Rp{" "}
                      {parseFloat(formData.harga_jual).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="border-t pt-4 mt-3">
                    <div className="flex justify-between font-bold">
                      <span>Total:</span>
                      <span>
                        Rp{" "}
                        {(
                          parseFloat(formData.harga_jual) *
                          parseInt(formData.jumlah_kamar) *
                          parseInt(formData.total_malam)
                        ).toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSuccess(false)}
                    className="w-full"
                  >
                    Tutup Receipt
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
                    placeholder="HTL-001"
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
                  <Label htmlFor="nama_hotel">Nama Hotel</Label>
                  <Input
                    id="nama_hotel"
                    name="nama_hotel"
                    value={formData.nama_hotel}
                    onChange={handleChange}
                    placeholder="Grand Hyatt"
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
                    placeholder="Jakarta"
                    required
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal_checkin">Tanggal Check-in</Label>
                  <Input
                    id="tanggal_checkin"
                    name="tanggal_checkin"
                    type="date"
                    value={formData.tanggal_checkin}
                    onChange={handleChange}
                    required
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal_checkout">Tanggal Check-out</Label>
                  <Input
                    id="tanggal_checkout"
                    name="tanggal_checkout"
                    type="date"
                    value={formData.tanggal_checkout}
                    onChange={handleChange}
                    required
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jumlah_kamar">Jumlah Kamar</Label>
                  <Input
                    id="jumlah_kamar"
                    name="jumlah_kamar"
                    type="number"
                    min="1"
                    value={formData.jumlah_kamar}
                    onChange={handleChange}
                    required
                    className="tosca-emboss"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="harga_jual">Harga Jual per Malam (Rp)</Label>
                  <Input
                    id="harga_jual"
                    name="harga_jual"
                    type="number"
                    value={formData.harga_jual}
                    onChange={handleChange}
                    placeholder="1000000"
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
                    placeholder="800000"
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
                    placeholder="50000"
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
                  <Label htmlFor="total_malam">Total Malam</Label>
                  <Input
                    id="total_malam"
                    name="total_malam"
                    type="number"
                    min="1"
                    value={formData.total_malam}
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
                  className="tosca-emboss-button flex items-center gap-2 w-full h-12 text-base font-medium rounded-lg transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => {
                    // Validate form data
                    if (
                      !formData.kode_transaksi ||
                      !formData.tanggal ||
                      !formData.nama_hotel ||
                      !formData.lokasi ||
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
                      parseInt(formData.jumlah_kamar) *
                      parseInt(formData.total_malam);

                    // Add to cart
                    addItem({
                      id: uuidv4(),
                      type: "hotel",
                      name: `Hotel ${formData.nama_hotel}`,
                      details: `${formData.lokasi} - ${formData.jumlah_kamar} kamar, ${formData.total_malam} malam`,
                      price: parseFloat(formData.harga_jual),
                      quantity: parseInt(formData.jumlah_kamar),
                      date: formData.tanggal,
                      kode_transaksi: formData.kode_transaksi,
                      additionalData: {
                        ...formData,
                        harga_jual: parseFloat(formData.harga_jual),
                        harga_basic: parseFloat(formData.harga_basic),
                        fee_sales: parseFloat(formData.fee_sales),
                        profit: parseFloat(formData.profit),
                        jumlah_kamar: parseInt(formData.jumlah_kamar),
                        total_malam: parseInt(formData.total_malam),
                        totalAmount: totalAmount,
                      },
                    });

                    // Show receipt
                    setSuccess(true);

                    toast({
                      title: "Berhasil ditambahkan",
                      description: `Hotel ${formData.nama_hotel} (${formData.lokasi}) telah ditambahkan ke keranjang`,
                    });
                  }}
                >
                  <ShoppingCart className="h-4 w-4" />
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
