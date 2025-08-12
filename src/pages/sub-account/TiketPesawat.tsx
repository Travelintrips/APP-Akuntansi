import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plane, ShoppingCart } from "lucide-react";
import supabase from "@/lib/supabase";
// Removed accounting imports - accounting integration disabled
import { useCart } from "@/context/CartContext";
import { v4 as uuidv4 } from "uuid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import BackButton from "@/components/common/BackButton";
import CartButton from "@/components/cart/CartButton";

export default function TiketPesawatPage() {
  const { addItem, clearCart } = useCart();
  const [formData, setFormData] = useState({
    kode_transaksi: "",
    tanggal: new Date().toISOString().split("T")[0],
    tanggal_checkin: "",
    tanggal_checkout: "",
    nama_penumpang: "",
    no_telepon: "",
    maskapai: "",
    rute: "",
    harga_jual: "",
    harga_basic: "",
    fee_sales: "",
    profit: "",
    jumlah_penumpang: "1",
    keterangan: "",
    foto_penumpang: null as File | null,
    bukti_pemesanan: null as File | null,
    // Baggage fields
    baggage_option: "",
    baggage_weight: "20",
    overweight_kg: "0",
    overweight_fee: "0",
    total_baggage_fee: "0",
  });

  // Default Indonesian Airlines
  const indonesianAirlines = [
    "Garuda Indonesia",
    "Lion Air",
    "Sriwijaya Air",
    "Citilink",
    "Batik Air",
    "Wings Air",
    "Super Air Jet",
    "TransNusa",
    "Nam Air",
    "Pelita Air",
  ];

  // International Airlines
  const internationalAirlines = [
    "Singapore Airlines",
    "Malaysia Airlines",
    "Thai Airways",
    "AirAsia",
    "Cathay Pacific",
    "Emirates",
    "Qatar Airways",
    "Turkish Airlines",
    "Lufthansa",
    "KLM Royal Dutch Airlines",
    "Air France",
    "British Airways",
    "Japan Airlines (JAL)",
    "All Nippon Airways (ANA)",
    "Korean Air",
    "China Airlines",
    "EVA Air",
    "Philippine Airlines",
    "Cebu Pacific",
    "Vietnam Airlines",
    "Jetstar",
    "Scoot",
    "Vietjet Air",
    "IndiGo",
    "Air India",
  ];

  // Baggage rules for each airline
  const baggageRules = {
    "Garuda Indonesia": {
      free_weight: 20,
      overweight_fee_per_kg: 50000,
      options: ["20kg (Gratis)", "30kg (+Rp 200,000)", "40kg (+Rp 400,000)"],
    },
    "Lion Air": {
      free_weight: 20,
      overweight_fee_per_kg: 45000,
      options: ["20kg (Gratis)", "30kg (+Rp 180,000)", "40kg (+Rp 360,000)"],
    },
    "Sriwijaya Air": {
      free_weight: 20,
      overweight_fee_per_kg: 40000,
      options: ["20kg (Gratis)", "30kg (+Rp 160,000)", "40kg (+Rp 320,000)"],
    },
    Citilink: {
      free_weight: 20,
      overweight_fee_per_kg: 35000,
      options: ["20kg (Gratis)", "30kg (+Rp 140,000)", "40kg (+Rp 280,000)"],
    },
    "Batik Air": {
      free_weight: 20,
      overweight_fee_per_kg: 45000,
      options: ["20kg (Gratis)", "30kg (+Rp 180,000)", "40kg (+Rp 360,000)"],
    },
    "Wings Air": {
      free_weight: 10,
      overweight_fee_per_kg: 30000,
      options: ["10kg (Gratis)", "20kg (+Rp 100,000)", "30kg (+Rp 200,000)"],
    },
    "Super Air Jet": {
      free_weight: 20,
      overweight_fee_per_kg: 40000,
      options: ["20kg (Gratis)", "30kg (+Rp 160,000)", "40kg (+Rp 320,000)"],
    },
    TransNusa: {
      free_weight: 15,
      overweight_fee_per_kg: 35000,
      options: ["15kg (Gratis)", "25kg (+Rp 140,000)", "35kg (+Rp 280,000)"],
    },
    "Nam Air": {
      free_weight: 20,
      overweight_fee_per_kg: 40000,
      options: ["20kg (Gratis)", "30kg (+Rp 160,000)", "40kg (+Rp 320,000)"],
    },
    "Pelita Air": {
      free_weight: 20,
      overweight_fee_per_kg: 45000,
      options: ["20kg (Gratis)", "30kg (+Rp 180,000)", "40kg (+Rp 360,000)"],
    },
    // International Airlines
    "Singapore Airlines": {
      free_weight: 30,
      overweight_fee_per_kg: 75000,
      options: ["30kg (Gratis)", "40kg (+Rp 300,000)", "50kg (+Rp 600,000)"],
    },
    "Malaysia Airlines": {
      free_weight: 30,
      overweight_fee_per_kg: 70000,
      options: ["30kg (Gratis)", "40kg (+Rp 280,000)", "50kg (+Rp 560,000)"],
    },
    "Thai Airways": {
      free_weight: 30,
      overweight_fee_per_kg: 65000,
      options: ["30kg (Gratis)", "40kg (+Rp 260,000)", "50kg (+Rp 520,000)"],
    },
    AirAsia: {
      free_weight: 0,
      overweight_fee_per_kg: 25000,
      options: [
        "Tanpa Bagasi (Gratis)",
        "20kg (+Rp 200,000)",
        "30kg (+Rp 350,000)",
        "40kg (+Rp 500,000)",
      ],
    },
    "Cathay Pacific": {
      free_weight: 30,
      overweight_fee_per_kg: 80000,
      options: ["30kg (Gratis)", "40kg (+Rp 320,000)", "50kg (+Rp 640,000)"],
    },
    Emirates: {
      free_weight: 30,
      overweight_fee_per_kg: 85000,
      options: ["30kg (Gratis)", "40kg (+Rp 340,000)", "50kg (+Rp 680,000)"],
    },
    "Qatar Airways": {
      free_weight: 30,
      overweight_fee_per_kg: 80000,
      options: ["30kg (Gratis)", "40kg (+Rp 320,000)", "50kg (+Rp 640,000)"],
    },
    "Turkish Airlines": {
      free_weight: 30,
      overweight_fee_per_kg: 75000,
      options: ["30kg (Gratis)", "40kg (+Rp 300,000)", "50kg (+Rp 600,000)"],
    },
    Lufthansa: {
      free_weight: 23,
      overweight_fee_per_kg: 90000,
      options: ["23kg (Gratis)", "32kg (+Rp 360,000)", "46kg (+Rp 720,000)"],
    },
    "KLM Royal Dutch Airlines": {
      free_weight: 23,
      overweight_fee_per_kg: 85000,
      options: ["23kg (Gratis)", "32kg (+Rp 340,000)", "46kg (+Rp 680,000)"],
    },
    "Air France": {
      free_weight: 23,
      overweight_fee_per_kg: 85000,
      options: ["23kg (Gratis)", "32kg (+Rp 340,000)", "46kg (+Rp 680,000)"],
    },
    "British Airways": {
      free_weight: 23,
      overweight_fee_per_kg: 90000,
      options: ["23kg (Gratis)", "32kg (+Rp 360,000)", "46kg (+Rp 720,000)"],
    },
    "Japan Airlines (JAL)": {
      free_weight: 23,
      overweight_fee_per_kg: 80000,
      options: ["23kg (Gratis)", "32kg (+Rp 320,000)", "46kg (+Rp 640,000)"],
    },
    "All Nippon Airways (ANA)": {
      free_weight: 23,
      overweight_fee_per_kg: 80000,
      options: ["23kg (Gratis)", "32kg (+Rp 320,000)", "46kg (+Rp 640,000)"],
    },
    "Korean Air": {
      free_weight: 23,
      overweight_fee_per_kg: 75000,
      options: ["23kg (Gratis)", "32kg (+Rp 300,000)", "46kg (+Rp 600,000)"],
    },
    "China Airlines": {
      free_weight: 20,
      overweight_fee_per_kg: 70000,
      options: ["20kg (Gratis)", "30kg (+Rp 280,000)", "40kg (+Rp 560,000)"],
    },
    "EVA Air": {
      free_weight: 20,
      overweight_fee_per_kg: 70000,
      options: ["20kg (Gratis)", "30kg (+Rp 280,000)", "40kg (+Rp 560,000)"],
    },
    "Philippine Airlines": {
      free_weight: 23,
      overweight_fee_per_kg: 60000,
      options: ["23kg (Gratis)", "32kg (+Rp 240,000)", "46kg (+Rp 480,000)"],
    },
    "Cebu Pacific": {
      free_weight: 0,
      overweight_fee_per_kg: 20000,
      options: [
        "Tanpa Bagasi (Gratis)",
        "20kg (+Rp 150,000)",
        "30kg (+Rp 250,000)",
        "40kg (+Rp 350,000)",
      ],
    },
    "Vietnam Airlines": {
      free_weight: 23,
      overweight_fee_per_kg: 55000,
      options: ["23kg (Gratis)", "32kg (+Rp 220,000)", "46kg (+Rp 440,000)"],
    },
    Jetstar: {
      free_weight: 0,
      overweight_fee_per_kg: 25000,
      options: [
        "Tanpa Bagasi (Gratis)",
        "20kg (+Rp 200,000)",
        "30kg (+Rp 350,000)",
        "40kg (+Rp 500,000)",
      ],
    },
    Scoot: {
      free_weight: 0,
      overweight_fee_per_kg: 30000,
      options: [
        "Tanpa Bagasi (Gratis)",
        "20kg (+Rp 250,000)",
        "30kg (+Rp 400,000)",
        "40kg (+Rp 550,000)",
      ],
    },
    "Vietjet Air": {
      free_weight: 0,
      overweight_fee_per_kg: 20000,
      options: [
        "Tanpa Bagasi (Gratis)",
        "20kg (+Rp 150,000)",
        "30kg (+Rp 250,000)",
        "40kg (+Rp 350,000)",
      ],
    },
    IndiGo: {
      free_weight: 15,
      overweight_fee_per_kg: 35000,
      options: ["15kg (Gratis)", "25kg (+Rp 140,000)", "35kg (+Rp 280,000)"],
    },
    "Air India": {
      free_weight: 23,
      overweight_fee_per_kg: 65000,
      options: ["23kg (Gratis)", "32kg (+Rp 260,000)", "46kg (+Rp 520,000)"],
    },
  };

  // Default routes from CGK (Soekarno-Hatta)
  const defaultRoutes = [
    "CGK - DPS (Jakarta - Denpasar)",
    "CGK - MLG (Jakarta - Malang)",
    "CGK - JOG (Jakarta - Yogyakarta)",
    "CGK - SLO (Jakarta - Solo)",
    "CGK - SRG (Jakarta - Semarang)",
    "CGK - BDO (Jakarta - Bandung)",
    "CGK - PLM (Jakarta - Palembang)",
    "CGK - PKU (Jakarta - Pekanbaru)",
    "CGK - MDN (Jakarta - Medan)",
    "CGK - BTH (Jakarta - Batam)",
    "CGK - PNK (Jakarta - Pontianak)",
    "CGK - BPN (Jakarta - Balikpapan)",
    "CGK - MLK (Jakarta - Manado)",
    "CGK - UPG (Jakarta - Makassar)",
    "CGK - AMQ (Jakarta - Ambon)",
    "CGK - DJJ (Jakarta - Jayapura)",
  ];

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate next ticket number
  const generateNextTicketNumber = async () => {
    try {
      console.log("Generating next ticket number...");

      // Get the latest ticket number from bookings_trips table
      const { data, error } = await supabase
        .from("bookings_trips")
        .select("kode_booking, created_at")
        .like("kode_booking", "TKT-%")
        .order("created_at", { ascending: false })
        .limit(10);

      console.log("Database query result:", { data, error });

      if (error) {
        console.error("Error fetching latest ticket:", error);
        return "TKT-001";
      }

      if (!data || data.length === 0) {
        console.log("No existing tickets found, starting with TKT-001");
        return "TKT-001";
      }

      // Find the highest ticket number
      let highestNumber = 0;
      data.forEach((booking) => {
        const match = booking.kode_booking.match(/TKT-(\d+)/);
        if (match) {
          const number = parseInt(match[1]);
          if (number > highestNumber) {
            highestNumber = number;
          }
        }
      });

      const nextNumber = highestNumber + 1;
      return `TKT-${nextNumber.toString().padStart(3, "0")}`;
    } catch (error) {
      console.error("Error generating ticket number:", error);
      return "TKT-001";
    }
  };

  // Initialize ticket number on component mount
  useEffect(() => {
    const initializeTicketNumber = async () => {
      const nextTicketNumber = await generateNextTicketNumber();
      setFormData((prev) => ({
        ...prev,
        kode_transaksi: nextTicketNumber,
      }));
    };

    initializeTicketNumber();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target;
    setFormData((prev) => {
      let newData = { ...prev };

      if (type === "file") {
        newData = { ...prev, [name]: files ? files[0] : null };
      } else {
        newData = { ...prev, [name]: value };
      }

      // No need to calculate total anymore
      if (name === "harga_jual" || name === "jumlah_penumpang") {
        // Calculation removed
      }

      // Calculate baggage fees and overweight
      if (name === "baggage_weight" || name === "overweight_kg") {
        const selectedAirline = newData.maskapai;
        const baggageWeight = parseFloat(newData.baggage_weight) || 0;
        const overweightKg = parseFloat(newData.overweight_kg) || 0;

        if (
          selectedAirline &&
          baggageRules[selectedAirline as keyof typeof baggageRules]
        ) {
          const rules =
            baggageRules[selectedAirline as keyof typeof baggageRules];
          const freeWeight = rules.free_weight;
          const overweightFeePerKg = rules.overweight_fee_per_kg;

          // Calculate overweight fee
          const totalOverweight = Math.max(0, baggageWeight - freeWeight);
          const overweightFee = totalOverweight * overweightFeePerKg;

          newData.overweight_kg = totalOverweight.toString();
          newData.overweight_fee = overweightFee.toString();
          newData.total_baggage_fee = overweightFee.toString();
        }
      }

      // Calculate profit including baggage fees
      if (
        name === "harga_jual" ||
        name === "harga_basic" ||
        name === "fee_sales" ||
        name === "total_baggage_fee"
      ) {
        const hargaJual = parseFloat(newData.harga_jual) || 0;
        const hargaBasic = parseFloat(newData.harga_basic) || 0;
        const feeSales = parseFloat(newData.fee_sales) || 0;
        const baggageFee = parseFloat(newData.total_baggage_fee) || 0;

        // Add baggage fee to basic price for total cost calculation
        const totalBasicCost = hargaBasic + baggageFee;
        newData.profit = Math.max(
          0,
          hargaJual - totalBasicCost - feeSales,
        ).toString();
      }

      return newData;
    });
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Reset baggage options when airline changes
      if (name === "maskapai") {
        newData.baggage_option = "";
        newData.baggage_weight = "20";
        newData.overweight_kg = "0";
        newData.overweight_fee = "0";
        newData.total_baggage_fee = "0";
      }

      // Handle baggage option selection
      if (name === "baggage_option" && value && newData.maskapai) {
        const rules =
          baggageRules[newData.maskapai as keyof typeof baggageRules];
        if (rules) {
          // Extract weight from option (e.g., "20kg (Gratis)" -> 20)
          const weightMatch = value.match(/(\d+)kg/);
          if (weightMatch) {
            const selectedWeight = parseInt(weightMatch[1]);
            newData.baggage_weight = selectedWeight.toString();

            // Calculate overweight
            const freeWeight = rules.free_weight;
            const overweight = Math.max(0, selectedWeight - freeWeight);
            const overweightFee = overweight * rules.overweight_fee_per_kg;

            newData.overweight_kg = overweight.toString();
            newData.overweight_fee = overweightFee.toString();
            newData.total_baggage_fee = overweightFee.toString();
          }
        }
      }

      return newData;
    });
  };

  // Removed handleSubmit function as we only use cart-based booking

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BackButton to="/sub-account" />
              <Plane className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Penjualan Tiket Pesawat</h1>
            </div>
            <CartButton />
          </div>

          <div className="bg-card p-8 rounded-xl border shadow-sm border-teal-200 tosca-emboss">
            <h2 className="text-2xl font-bold mb-8 text-primary">
              Form Transaksi Tiket Pesawat
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
                    placeholder="TKT-001"
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
                  <Label htmlFor="maskapai">Maskapai</Label>
                  <Select
                    value={formData.maskapai}
                    onValueChange={(value) =>
                      handleSelectChange("maskapai", value)
                    }
                  >
                    <SelectTrigger id="maskapai" className="tosca-emboss">
                      <SelectValue placeholder="Pilih maskapai" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        value="__header_indonesian__"
                        disabled
                        className="font-semibold text-primary"
                      >
                        Maskapai Indonesia
                      </SelectItem>
                      {indonesianAirlines.map((airline) => (
                        <SelectItem key={airline} value={airline}>
                          {airline}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="__header_international__"
                        disabled
                        className="font-semibold text-primary mt-2"
                      >
                        Maskapai Internasional
                      </SelectItem>
                      {internationalAirlines.map((airline) => (
                        <SelectItem key={airline} value={airline}>
                          {airline}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rute">Rute</Label>
                  <Select
                    value={formData.rute}
                    onValueChange={(value) => handleSelectChange("rute", value)}
                  >
                    <SelectTrigger id="rute" className="tosca-emboss">
                      <SelectValue placeholder="Pilih rute" />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultRoutes.map((route) => (
                        <SelectItem key={route} value={route}>
                          {route}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">
                        Rute Lainnya (Custom)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.rute === "custom" && (
                    <Input
                      name="rute"
                      value={formData.rute}
                      onChange={handleChange}
                      placeholder="Masukkan rute custom"
                      className="tosca-emboss mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="harga_jual">Harga Jual (Rp)</Label>
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
              </div>

              {/* Baggage Section */}
              {formData.maskapai && (
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 space-y-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">
                    Pilihan Bagasi - {formData.maskapai}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="baggage_option">Pilihan Bagasi</Label>
                      <Select
                        value={formData.baggage_option}
                        onValueChange={(value) =>
                          handleSelectChange("baggage_option", value)
                        }
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Pilih opsi bagasi" />
                        </SelectTrigger>
                        <SelectContent>
                          {baggageRules[
                            formData.maskapai as keyof typeof baggageRules
                          ]?.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="baggage_weight">Berat Bagasi (kg)</Label>
                      <Input
                        id="baggage_weight"
                        name="baggage_weight"
                        type="number"
                        min="0"
                        value={formData.baggage_weight}
                        onChange={handleChange}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  {/* Overweight Information */}
                  {parseFloat(formData.overweight_kg) > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-800 mb-2">
                        Informasi Kelebihan Bagasi
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-yellow-700">
                            Berat Gratis
                          </Label>
                          <p className="font-medium">
                            {baggageRules[
                              formData.maskapai as keyof typeof baggageRules
                            ]?.free_weight || 0}{" "}
                            kg
                          </p>
                        </div>
                        <div>
                          <Label className="text-yellow-700">
                            Kelebihan Berat
                          </Label>
                          <p className="font-medium">
                            {formData.overweight_kg} kg
                          </p>
                        </div>
                        <div>
                          <Label className="text-yellow-700">
                            Biaya Kelebihan
                          </Label>
                          <p className="font-medium text-red-600">
                            Rp{" "}
                            {parseFloat(formData.overweight_fee).toLocaleString(
                              "id-ID",
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                        <p className="text-sm text-red-700">
                          <strong>Catatan:</strong> Biaya kelebihan bagasi Rp{" "}
                          {baggageRules[
                            formData.maskapai as keyof typeof baggageRules
                          ]?.overweight_fee_per_kg.toLocaleString("id-ID") || 0}
                          /kg akan ditambahkan ke harga basic.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Total Baggage Fee Display */}
                  {parseFloat(formData.total_baggage_fee) > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-green-800">
                          Total Biaya Bagasi:
                        </span>
                        <span className="font-bold text-green-600 text-lg">
                          Rp{" "}
                          {parseFloat(
                            formData.total_baggage_fee,
                          ).toLocaleString("id-ID")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="foto_penumpang">Foto Penumpang</Label>
                  <Input
                    id="foto_penumpang"
                    name="foto_penumpang"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="tosca-emboss"
                  />
                  {formData.foto_penumpang && (
                    <p className="text-sm text-muted-foreground">
                      File terpilih: {formData.foto_penumpang.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bukti_pemesanan">
                    Upload Bukti Pemesanan Tiket
                  </Label>
                  <Input
                    id="bukti_pemesanan"
                    name="bukti_pemesanan"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleChange}
                    className="tosca-emboss"
                  />
                  {formData.bukti_pemesanan && (
                    <p className="text-sm text-muted-foreground">
                      File terpilih: {formData.bukti_pemesanan.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-6 flex gap-2">
                <Button
                  type="button"
                  className="flex items-center gap-2 h-12 text-base font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] w-full tosca-emboss-button"
                  onClick={async (e) => {
                    e.preventDefault();
                    // Validate form data
                    if (
                      !formData.kode_transaksi ||
                      !formData.tanggal ||
                      !formData.tanggal_checkin ||
                      !formData.tanggal_checkout ||
                      !formData.nama_penumpang ||
                      !formData.maskapai ||
                      !formData.rute ||
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
                      // Add to cart only (database save handled in CartContext)
                      const totalAmount =
                        parseFloat(formData.harga_jual) *
                        parseInt(formData.jumlah_penumpang);

                      // Accounting integration removed - no journal entry created

                      await addItem({
                        id: uuidv4(),
                        type: "tiket-pesawat",
                        name: `Tiket ${formData.maskapai}`,
                        details: `${formData.rute} - ${formData.nama_penumpang} - ${formData.jumlah_penumpang} penumpang`,
                        price: parseFloat(formData.harga_jual),
                        quantity: parseInt(formData.jumlah_penumpang),
                        date: formData.tanggal,
                        kode_transaksi: formData.kode_transaksi,
                        additionalData: {
                          ...formData,
                          service_type: "tiket_pesawat",
                          maskapai: formData.maskapai, // Maps to service_name
                          nama_penumpang: formData.nama_penumpang, // Maps to nama_penumpang column
                          no_telepon: formData.no_telepon, // Maps to no_telepon column
                          rute: formData.rute, // Maps to service_details
                          tanggal_checkin: formData.tanggal_checkin, // Maps to tanggal_checkin column
                          tanggal_checkout: formData.tanggal_checkout, // Maps to tanggal_checkout column
                          harga_jual: parseFloat(formData.harga_jual), // Maps to harga_jual
                          harga_basic: parseFloat(formData.harga_basic), // Maps to harga_basic
                          fee_sales: parseFloat(formData.fee_sales), // Maps to fee_sales
                          profit: parseFloat(formData.profit), // Maps to profit
                          jumlah_penumpang: parseInt(formData.jumlah_penumpang),
                          totalAmount: totalAmount,
                          // Baggage information
                          baggage_option: formData.baggage_option,
                          baggage_weight: parseFloat(formData.baggage_weight),
                          overweight_kg: parseFloat(formData.overweight_kg),
                          overweight_fee: parseFloat(formData.overweight_fee),
                          total_baggage_fee: parseFloat(
                            formData.total_baggage_fee,
                          ),
                        },
                      });

                      // Show success message
                      setSuccess(true);

                      // Generate next ticket number and reset form
                      try {
                        const nextTicketNumber =
                          await generateNextTicketNumber();
                        console.log(
                          "Generated next ticket number:",
                          nextTicketNumber,
                        );

                        setFormData({
                          kode_transaksi: nextTicketNumber,
                          tanggal: new Date().toISOString().split("T")[0],
                          tanggal_checkin: "",
                          tanggal_checkout: "",
                          nama_penumpang: "",
                          no_telepon: "",
                          maskapai: "",
                          rute: "",
                          harga_jual: "",
                          harga_basic: "",
                          fee_sales: "",
                          profit: "",
                          jumlah_penumpang: "1",
                          keterangan: "",
                          foto_penumpang: null,
                          bukti_pemesanan: null,
                          baggage_option: "",
                          baggage_weight: "20",
                          overweight_kg: "0",
                          overweight_fee: "0",
                          total_baggage_fee: "0",
                        });
                      } catch (error) {
                        console.error(
                          "Error generating next ticket number:",
                          error,
                        );
                        // Fallback to TKT-001 if there's an error
                        setFormData({
                          kode_transaksi: "TKT-001",
                          tanggal: new Date().toISOString().split("T")[0],
                          tanggal_checkin: "",
                          tanggal_checkout: "",
                          nama_penumpang: "",
                          no_telepon: "",
                          maskapai: "",
                          rute: "",
                          harga_jual: "",
                          harga_basic: "",
                          fee_sales: "",
                          profit: "",
                          jumlah_penumpang: "1",
                          keterangan: "",
                          foto_penumpang: null,
                          bukti_pemesanan: null,
                          baggage_option: "",
                          baggage_weight: "20",
                          overweight_kg: "0",
                          overweight_fee: "0",
                          total_baggage_fee: "0",
                        });
                      }

                      toast({
                        title: "Berhasil ditambahkan",
                        description: `Tiket ${formData.maskapai} (${formData.rute}) telah ditambahkan ke keranjang`,
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
