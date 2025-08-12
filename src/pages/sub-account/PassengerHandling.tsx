import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, ShoppingCart, Loader2, Package } from "lucide-react";
import supabase from "@/lib/supabase";
// Removed accounting imports - accounting integration disabled
import { useCart } from "@/context/CartContext";
import { v4 as uuidv4 } from "uuid";
import BackButton from "@/components/common/BackButton";
import CartButton from "@/components/cart/CartButton";

interface AirportHandlingService {
  id: number;
  service_type: string;
  airport: string | null;
  basic_price: number;
  sell_price: number;
  additional: number;
  additional_basic_price: number;
  porter_base_price?: number;
  porter_base_quantity?: number;
  porter_additional_price?: number;
  services_arrival: string;
  services_departure: string;
  terminal: string;
  trip_type: string;
  category: string;
  created_at: string | null;
}

export default function PassengerHandlingPage() {
  const { addItem } = useCart();
  const [formData, setFormData] = useState({
    kode_transaksi: "",
    tanggal: new Date().toISOString().split("T")[0],
    selected_service_id: "",
    nama_layanan: "",
    lokasi: "CGK",
    nama_pemesan: "",
    quantity: "1",
    jam_checkin: "",
    terminal: "",
    jumlah_penumpang: "1",
    jumlah_koli: "3",
    harga_jual: "",
    harga_basic: "",
    fee_sales: "",
    profit: "",
    keterangan: "",
    foto_penumpang: null as File | null,
  });

  // Baggage Storage Form Data
  const [baggageFormData, setBaggageFormData] = useState({
    kode_transaksi: "",
    nama_pemesan: "",
    quantity: "1",
    email: "",
    phone: "",
    flight_number: "",
    airport: "",
    terminal: "",
    selected_categories: [] as string[],
    durasi_value: "1",
    tanggal_mulai: "",
    jam_mulai: "",
    tanggal_akhir: "",
    jam_akhir: "",
    harga: "",
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
  const [airportServices, setAirportServices] = useState<
    AirportHandlingService[]
  >([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [showBaggageForm, setShowBaggageForm] = useState(false);

  // Generate next passenger handling number
  const generateNextPHNumber = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings_trips")
        .select("kode_booking, created_at")
        .like("kode_booking", "PH-%")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching latest PH booking:", error);
        return "PH-001";
      }

      if (!data || data.length === 0) {
        return "PH-001";
      }

      let highestNumber = 0;
      data.forEach((booking) => {
        const match = booking.kode_booking.match(/PH-(\d+)/);
        if (match) {
          const number = parseInt(match[1]);
          if (number > highestNumber) {
            highestNumber = number;
          }
        }
      });

      const nextNumber = highestNumber + 1;
      return `PH-${nextNumber.toString().padStart(3, "0")}`;
    } catch (error) {
      console.error("Error generating PH number:", error);
      return "PH-001";
    }
  };

  // Generate next baggage storage number
  const generateNextBSNumber = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings_trips")
        .select("kode_booking, created_at")
        .like("kode_booking", "BS-%")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching latest BS booking:", error);
        return "BS-001";
      }

      if (!data || data.length === 0) {
        return "BS-001";
      }

      let highestNumber = 0;
      data.forEach((booking) => {
        const match = booking.kode_booking.match(/BS-(\d+)/);
        if (match) {
          const number = parseInt(match[1]);
          if (number > highestNumber) {
            highestNumber = number;
          }
        }
      });

      const nextNumber = highestNumber + 1;
      return `BS-${nextNumber.toString().padStart(3, "0")}`;
    } catch (error) {
      console.error("Error generating BS number:", error);
      return "BS-001";
    }
  };

  // Baggage Storage Categories with Prices
  const baggageCategories = [
    {
      id: "small",
      name: "Small",
      price: 70000,
      description: "Ideal for small bags, backpacks, or personal items",
      icon: "📦",
    },
    {
      id: "medium",
      name: "Medium",
      price: 80000,
      description: "Perfect for carry-on luggage or medium-sized bags",
      icon: "📦",
    },
    {
      id: "large",
      name: "Large",
      price: 90000,
      description: "Best for large suitcases or multiple items",
      icon: "🧳",
    },
    {
      id: "extra-large",
      name: "Extra Large",
      price: 100000,
      description: "Best for Extra large suitcases or multiple items",
      icon: "🧳",
    },
    {
      id: "electronics",
      name: "Electronics",
      price: 90000,
      description: "Best for Goods Electronic Laptop,Keyboards,Guitar,Camera",
      icon: "💻",
    },
    {
      id: "surfing-board",
      name: "Surfing Board",
      price: 100000,
      description:
        "Best for Long or wide items such as surfboards or sporting gear",
      icon: "🏄",
    },
    {
      id: "wheel-chair",
      name: "Wheel Chair",
      price: 110000,
      description: "Best for Manual or foldable wheelchairs and mobility aids",
      icon: "♿",
    },
    {
      id: "stick-golf",
      name: "Stick Golf",
      price: 110000,
      description: "Best for Golf bags or long-shaped sports equipment",
      icon: "🏌️",
    },
  ];

  // Fetch airport handling services from Supabase
  useEffect(() => {
    const fetchAirportServices = async () => {
      try {
        setLoadingServices(true);
        setError(null);

        const { data, error } = await supabase
          .from("airport_handling_services")
          .select("*")
          .order("service_type");

        if (error) {
          console.error("Error fetching airport services:", error);
          if (error.code === "42P01") {
            setError(
              "Tabel airport_handling_services belum tersedia. Silakan hubungi administrator untuk setup database.",
            );
          } else {
            setError(`Gagal memuat data layanan: ${error.message}`);
          }
        } else {
          setAirportServices(data || []);
          if (!data || data.length === 0) {
            setError(
              "Tidak ada layanan airport handling yang tersedia saat ini.",
            );
          }
        }
      } catch (err: any) {
        console.error("Error:", err);
        setError(
          `Terjadi kesalahan saat memuat data layanan: ${err.message || "Unknown error"}`,
        );
      } finally {
        setLoadingServices(false);
      }
    };

    fetchAirportServices();
  }, []);

  // Initialize transaction codes on component mount
  useEffect(() => {
    const initializeTransactionCodes = async () => {
      const nextPHNumber = await generateNextPHNumber();
      const nextBSNumber = await generateNextBSNumber();

      setFormData((prev) => ({
        ...prev,
        kode_transaksi: nextPHNumber,
      }));

      setBaggageFormData((prev) => ({
        ...prev,
        kode_transaksi: nextBSNumber,
      }));
    };

    initializeTransactionCodes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    setFormData((prev) => {
      const newData = { ...prev };

      // Handle file inputs
      if (files && files.length > 0) {
        newData[name as keyof typeof formData] = files[0] as any;
      } else {
        newData[name as keyof typeof formData] = value as any;
      }

      // Calculate profit and total amount
      if (
        name === "harga_jual" ||
        name === "harga_basic" ||
        name === "fee_sales" ||
        name === "quantity"
      ) {
        const hargaJual = parseFloat(newData.harga_jual) || 0;
        const hargaBasic = parseFloat(newData.harga_basic) || 0;
        const feeSales = parseFloat(newData.fee_sales) || 0;
        const quantity = parseInt(newData.quantity) || 1;

        // Calculate profit per unit
        const profitPerUnit = Math.max(0, hargaJual - hargaBasic - feeSales);
        newData.profit = profitPerUnit.toString();

        // Calculate total amount for display (quantity * harga_jual)
        const totalAmount = hargaJual * quantity;
      }

      return newData;
    });
  };

  const handleServiceSelect = (serviceId: string) => {
    const selectedService = airportServices.find(
      (service) => service.id.toString() === serviceId,
    );
    if (selectedService) {
      const isPorter = selectedService.service_type.toLowerCase() === "porter";
      const currentKoli = parseInt(formData.jumlah_koli) || (isPorter ? 3 : 1);

      let totalBasicPrice, totalSellPrice, feeSales;

      if (isPorter) {
        // For porter: use base price for base quantity, calculate total based on current koli
        const baseQuantity = selectedService.porter_base_quantity || 3;
        const basePrice =
          selectedService.porter_base_price || selectedService.sell_price;
        const additionalPrice =
          selectedService.porter_additional_price || selectedService.additional;

        totalBasicPrice =
          selectedService.porter_base_price || selectedService.basic_price;
        totalSellPrice = basePrice;

        // Add additional cost for extra koli
        if (currentKoli > baseQuantity) {
          const extraKoli = currentKoli - baseQuantity;
          totalSellPrice += extraKoli * additionalPrice;
          // Add additional basic price for extra koli
          totalBasicPrice += extraKoli * selectedService.additional_basic_price;
        }

        feeSales = 0; // Porter services have 0 fee sales
      } else {
        // For other services: base price + additional for extra koli
        totalBasicPrice = selectedService.basic_price;
        totalSellPrice = selectedService.sell_price;

        // Add additional cost for extra koli (beyond 1)
        if (currentKoli > 1) {
          const extraKoli = currentKoli - 1;
          totalSellPrice += extraKoli * selectedService.additional;
          // Add additional basic price for extra koli
          totalBasicPrice += extraKoli * selectedService.additional_basic_price;
        }

        feeSales = selectedService.additional;
      }

      setFormData((prev) => {
        const quantity = parseInt(prev.quantity) || 1;
        const profitPerUnit = Math.max(
          0,
          totalSellPrice - totalBasicPrice - feeSales,
        );
        const totalAmount = totalSellPrice * quantity;

        return {
          ...prev,
          selected_service_id: serviceId,
          nama_layanan: selectedService.service_type,
          lokasi: selectedService.airport || "",
          harga_jual: totalSellPrice.toString(),
          harga_basic: totalBasicPrice.toString(),
          fee_sales: feeSales.toString(),
          jumlah_koli: isPorter
            ? (selectedService.porter_base_quantity || 3).toString()
            : "1",
          profit: profitPerUnit.toString(),
          total_amount: totalAmount.toString(),
          keterangan: selectedService.services_departure || "",
        };
      });
      setSelectedCategory(selectedService.category);
    }
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

  const calculateDurationDays = (
    startDate: string,
    startTime: string,
    endDate: string,
    endTime: string,
  ) => {
    if (!startDate || !endDate) return 1;

    const start = new Date(`${startDate}T${startTime || "00:00"}`);
    const end = new Date(`${endDate}T${endTime || "23:59"}`);

    // Calculate the difference in milliseconds
    const diffTime = end.getTime() - start.getTime();

    // Convert to days and round up if there's any partial day
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Minimum 1 day
    return Math.max(1, diffDays);
  };

  const handleBaggageFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBaggageFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Recalculate duration and price when date/time fields change
      if (
        name === "tanggal_mulai" ||
        name === "jam_mulai" ||
        name === "tanggal_akhir" ||
        name === "jam_akhir"
      ) {
        const calculatedDays = calculateDurationDays(
          name === "tanggal_mulai" ? value : prev.tanggal_mulai,
          name === "jam_mulai" ? value : prev.jam_mulai,
          name === "tanggal_akhir" ? value : prev.tanggal_akhir,
          name === "jam_akhir" ? value : prev.jam_akhir,
        );

        newData.durasi_value = calculatedDays.toString();

        // Recalculate price based on new duration
        const totalCategoryPrice = prev.selected_categories.reduce(
          (total, catId) => {
            const category = baggageCategories.find((cat) => cat.id === catId);
            return total + (category ? category.price : 0);
          },
          0,
        );

        const quantity = parseInt(prev.quantity) || 1;
        const totalPrice = totalCategoryPrice * calculatedDays * quantity;
        newData.harga = totalPrice.toString();

        // Calculate harga basic (50% of total price)
        const hargaBasic = totalPrice * 0.5;

        // Calculate fee oprs (35% of total price)
        const feeOprs = totalPrice * 0.35;

        // Calculate profit (15% of total price)
        const profit = totalPrice * 0.15;

        newData.harga_basic = hargaBasic.toString();
        newData.fee_sales = feeOprs.toString();
        newData.profit = profit.toString();
      }
      // Recalculate price if duration changes manually
      else if (name === "durasi_value") {
        const totalCategoryPrice = prev.selected_categories.reduce(
          (total, catId) => {
            const category = baggageCategories.find((cat) => cat.id === catId);
            return total + (category ? category.price : 0);
          },
          0,
        );

        const durationDays = parseInt(value) || 1;
        const quantity = parseInt(prev.quantity) || 1;
        const totalPrice = totalCategoryPrice * durationDays * quantity;
        newData.harga = totalPrice.toString();

        // Calculate harga basic (50% of total price)
        const hargaBasic = totalPrice * 0.5;

        // Calculate fee oprs (35% of total price)
        const feeOprs = totalPrice * 0.35;

        // Calculate profit (15% of total price)
        const profit = totalPrice * 0.15;

        newData.harga_basic = hargaBasic.toString();
        newData.fee_sales = feeOprs.toString();
        newData.profit = profit.toString();
      }
      // Recalculate price if quantity changes
      else if (name === "quantity") {
        const totalCategoryPrice = prev.selected_categories.reduce(
          (total, catId) => {
            const category = baggageCategories.find((cat) => cat.id === catId);
            return total + (category ? category.price : 0);
          },
          0,
        );

        const durationDays = parseInt(prev.durasi_value) || 1;
        const quantity = parseInt(value) || 1;
        const totalPrice = totalCategoryPrice * durationDays * quantity;
        newData.harga = totalPrice.toString();

        // Calculate harga basic (50% of total price)
        const hargaBasic = totalPrice * 0.5;

        // Calculate fee oprs (35% of total price)
        const feeOprs = totalPrice * 0.35;

        // Calculate profit (15% of total price)
        const profit = totalPrice * 0.15;

        newData.harga_basic = hargaBasic.toString();
        newData.fee_sales = feeOprs.toString();
        newData.profit = profit.toString();
      }

      return newData;
    });
  };

  const handleBaggageCategorySelect = (categoryId: string) => {
    setBaggageFormData((prev) => {
      const isSelected = prev.selected_categories.includes(categoryId);
      let newSelectedCategories;

      if (isSelected) {
        // Remove category if already selected
        newSelectedCategories = prev.selected_categories.filter(
          (id) => id !== categoryId,
        );
      } else {
        // Add category if not selected
        newSelectedCategories = [...prev.selected_categories, categoryId];
      }

      // Calculate total price based on selected categories and duration
      const totalCategoryPrice = newSelectedCategories.reduce(
        (total, catId) => {
          const category = baggageCategories.find((cat) => cat.id === catId);
          return total + (category ? category.price : 0);
        },
        0,
      );

      // Recalculate duration based on dates if available
      let durationDays = parseInt(prev.durasi_value) || 1;
      if (prev.tanggal_mulai && prev.tanggal_akhir) {
        durationDays = calculateDurationDays(
          prev.tanggal_mulai,
          prev.jam_mulai,
          prev.tanggal_akhir,
          prev.jam_akhir,
        );
      }

      const quantity = parseInt(prev.quantity) || 1;
      const totalPrice = totalCategoryPrice * durationDays * quantity;

      // Calculate harga basic (50% of total price)
      const hargaBasic = totalPrice * 0.5;

      // Calculate fee oprs (35% of total price)
      const feeOprs = totalPrice * 0.35;

      // Calculate profit (15% of total price)
      const profit = totalPrice * 0.15;

      return {
        ...prev,
        selected_categories: newSelectedCategories,
        durasi_value: durationDays.toString(),
        harga: totalPrice.toString(),
        harga_basic: hargaBasic.toString(),
        fee_sales: feeOprs.toString(),
        profit: profit.toString(),
      };
    });
  };

  const calculateTotalPrice = () => {
    const totalCategoryPrice = baggageFormData.selected_categories.reduce(
      (total, catId) => {
        const category = baggageCategories.find((cat) => cat.id === catId);
        return total + (category ? category.price : 0);
      },
      0,
    );

    const durationDays = parseInt(baggageFormData.durasi_value) || 1;
    return totalCategoryPrice * durationDays;
  };

  const handleBaggageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Add to cart
      if (baggageFormData.selected_categories.length > 0) {
        const selectedCategoryNames = baggageFormData.selected_categories
          .map((catId) => {
            const category = baggageCategories.find((cat) => cat.id === catId);
            return category ? category.name : catId;
          })
          .join(", ");

        // Accounting integration removed - no journal entry created

        // Add to cart only (database save handled in CartContext)
        await addItem({
          id: uuidv4(),
          type: "baggage-storage",
          name: `Penitipan Bagasi - ${selectedCategoryNames}`,
          details: `${baggageFormData.nama_pemesan} - ${baggageFormData.airport} - ${baggageFormData.durasi_value} hari - ${baggageFormData.tanggal_mulai} s/d ${baggageFormData.tanggal_akhir}`,
          price: parseFloat(baggageFormData.harga),
          quantity: 1,
          date: baggageFormData.tanggal_mulai,
          kode_transaksi: baggageFormData.kode_transaksi,
          additionalData: {
            ...baggageFormData,
            service_type: "baggage_storage",
            selected_categories: baggageFormData.selected_categories,
            durasi_value: parseInt(baggageFormData.durasi_value),
            harga_jual: parseFloat(baggageFormData.harga),
            harga_basic: parseFloat(baggageFormData.harga_basic) || 0,
            fee_sales: parseFloat(baggageFormData.fee_sales) || 0,
            profit: parseFloat(baggageFormData.profit) || 0,
            // Map form fields to direct columns
            nama_penumpang: baggageFormData.nama_pemesan, // Nama Lengkap -> nama_penumpang
            quantity: parseInt(baggageFormData.quantity), // Quantity -> quantity
            service_details: baggageFormData.airport, // Bandara -> service_details
            tanggal_checkin: baggageFormData.tanggal_mulai, // Tanggal Mulai -> tanggal_checkin
            tanggal_checkout: baggageFormData.tanggal_akhir, // Tanggal Selesai -> tanggal_checkout
            jam_checkin: baggageFormData.jam_mulai, // Jam Mulai -> jam_checkin
            jam_checkout: baggageFormData.jam_akhir, // Jam Selesai -> jam_checkout
            keterangan: baggageFormData.keterangan,
          },
        });

        // Show success message
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 3000);

        // Reset baggage form
        const nextBSNumber = await generateNextBSNumber();
        setBaggageFormData({
          kode_transaksi: nextBSNumber,
          nama_pemesan: "",
          quantity: "1",
          email: "",
          phone: "",
          flight_number: "",
          airport: "",
          terminal: "",
          selected_categories: [],
          durasi_value: "1",
          tanggal_mulai: "",
          jam_mulai: "",
          tanggal_akhir: "",
          jam_akhir: "",
          harga: "",
          harga_basic: "",
          fee_sales: "",
          profit: "",
          keterangan: "",
        });

        // Show success message
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error("Error submitting baggage form:", err);
      setError(err.message || "Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
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

      // Accounting integration removed - no journal entry created

      setSuccess(true);
      // Reset form after successful submission
      setFormData({
        kode_transaksi: "",
        tanggal: new Date().toISOString().split("T")[0],
        selected_service_id: "",
        nama_layanan: "",
        lokasi: "CGK",
        nama_pemesan: "",
        quantity: "1",
        jam_checkin: "",
        terminal: "",
        jumlah_penumpang: "1",
        jumlah_koli: "3",
        harga_jual: "",
        harga_basic: "",
        fee_sales: "",
        profit: "",
        keterangan: "",
        foto_penumpang: null,
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

          {/* Toggle Buttons */}
          <div className="flex gap-4 mb-6">
            <Button
              onClick={() => setShowBaggageForm(false)}
              variant={!showBaggageForm ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Passenger Handling
            </Button>
            <Button
              onClick={() => setShowBaggageForm(true)}
              variant={showBaggageForm ? "default" : "outline"}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Penitipan Bagasi
            </Button>
          </div>

          {!showBaggageForm ? (
            <div className="bg-card p-8 rounded-xl border shadow-sm border-teal-200 tosca-emboss">
              <h2 className="text-2xl font-bold mb-8 text-primary">
                Form Transaksi Passenger Handling
              </h2>

              {/* Service Selection Section */}
              <div className="mb-6">
                <Label htmlFor="service-select">
                  Pilih Layanan Airport Handling
                </Label>
                {loadingServices ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Memuat layanan...</span>
                  </div>
                ) : airportServices.length > 0 ? (
                  <Select
                    value={formData.selected_service_id}
                    onValueChange={handleServiceSelect}
                  >
                    <SelectTrigger className="tosca-emboss">
                      <SelectValue placeholder="Pilih layanan airport handling" />
                    </SelectTrigger>
                    <SelectContent>
                      {airportServices.map((service) => {
                        const isPorter =
                          service.service_type.toLowerCase() === "porter";
                        let displayPrice, priceDescription;

                        if (isPorter) {
                          displayPrice =
                            service.porter_base_price || service.sell_price;
                          priceDescription = `${service.porter_base_quantity || 3} koli, +Rp ${(service.porter_additional_price || service.additional).toLocaleString("id-ID")}/koli tambahan`;
                        } else {
                          displayPrice =
                            service.sell_price + service.additional;
                          priceDescription = "per layanan";
                        }

                        return (
                          <SelectItem
                            key={service.id}
                            value={service.id.toString()}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {service.service_type} - {service.terminal}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {service.airport} - Rp{" "}
                                {displayPrice.toLocaleString("id-ID")} (
                                {priceDescription})
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-4 border rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">
                      Tidak ada layanan tersedia. Anda masih dapat mengisi form
                      secara manual.
                    </p>
                  </div>
                )}

                {formData.selected_service_id && (
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Layanan Terpilih:</strong> {formData.nama_layanan}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Lokasi:</strong> {formData.lokasi}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Harga:</strong> Rp{" "}
                      {parseFloat(formData.harga_jual || "0").toLocaleString(
                        "id-ID",
                      )}
                    </p>
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
                      value={formData.nama_layanan}
                      onChange={handleChange}
                      placeholder="Pilih layanan dari dropdown di atas"
                      required
                      className="tosca-emboss"
                      readOnly={!!formData.selected_service_id}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lokasi">Lokasi</Label>
                    <Select
                      value={formData.lokasi}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, lokasi: value }))
                      }
                    >
                      <SelectTrigger className="tosca-emboss">
                        <SelectValue placeholder="Pilih lokasi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CGK">CGK</SelectItem>
                        <SelectItem value="T1A">T1A</SelectItem>
                        <SelectItem value="T1B">T1B</SelectItem>
                        <SelectItem value="T2D">T2D</SelectItem>
                        <SelectItem value="T2E">T2E</SelectItem>
                        <SelectItem value="T2F">T2F</SelectItem>
                        <SelectItem value="T3 Dom">T3 Dom</SelectItem>
                        <SelectItem value="T3 Inter">T3 Inter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={handleChange}
                      placeholder="1"
                      required
                      className="tosca-emboss"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nama_pemesan">Nama Pemesan</Label>
                    <Input
                      id="nama_pemesan"
                      name="nama_pemesan"
                      value={formData.nama_pemesan}
                      onChange={handleChange}
                      placeholder="Masukkan nama pemesan"
                      required
                      className="tosca-emboss"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jam_checkin">Jam Check-in</Label>
                    <Input
                      id="jam_checkin"
                      name="jam_checkin"
                      type="time"
                      value={formData.jam_checkin}
                      onChange={handleChange}
                      required
                      className="tosca-emboss"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="terminal">Terminal</Label>
                    <Select
                      value={formData.terminal}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, terminal: value }))
                      }
                    >
                      <SelectTrigger className="tosca-emboss">
                        <SelectValue placeholder="Pilih terminal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1A">Terminal 1A</SelectItem>
                        <SelectItem value="1B">Terminal 1B</SelectItem>
                        <SelectItem value="2D">Terminal 2D</SelectItem>
                        <SelectItem value="2E">Terminal 2E</SelectItem>
                        <SelectItem value="2F">Terminal 2F</SelectItem>
                        <SelectItem value="3-domestik">
                          Terminal 3 Domestik
                        </SelectItem>
                        <SelectItem value="3-internasional">
                          Terminal 3 Internasional
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jumlah_penumpang">Jumlah Penumpang</Label>
                    <Input
                      id="jumlah_penumpang"
                      name="jumlah_penumpang"
                      type="number"
                      min="1"
                      value={formData.jumlah_penumpang}
                      onChange={(e) => {
                        const { name, value } = e.target;
                        setFormData((prev) => {
                          const newData = { ...prev, [name]: value };

                          // Recalculate pricing based on koli count for all services
                          if (formData.selected_service_id) {
                            const selectedService = airportServices.find(
                              (service) =>
                                service.id.toString() ===
                                formData.selected_service_id,
                            );
                            if (selectedService) {
                              const koliCount = parseInt(value) || 1;
                              const isPorter =
                                selectedService.service_type.toLowerCase() ===
                                "porter";

                              let totalPrice;

                              let totalBasicPrice;
                              if (isPorter) {
                                // Porter pricing: base price for base quantity, additional for extra koli
                                const baseQuantity =
                                  selectedService.porter_base_quantity || 3;
                                const basePrice =
                                  selectedService.porter_base_price ||
                                  selectedService.sell_price;
                                const additionalPrice =
                                  selectedService.porter_additional_price ||
                                  selectedService.additional;

                                totalPrice = basePrice;
                                totalBasicPrice =
                                  selectedService.porter_base_price ||
                                  selectedService.basic_price;

                                if (koliCount > baseQuantity) {
                                  const extraKoli = koliCount - baseQuantity;
                                  totalPrice += extraKoli * additionalPrice;
                                  // Add additional basic price for extra koli
                                  totalBasicPrice +=
                                    extraKoli *
                                    selectedService.additional_basic_price;
                                }

                                // Set fee_sales to 0 for porter services
                                newData.fee_sales = "0";
                              } else {
                                // Other services: base price + (additional price * extra koli)
                                const basePrice = selectedService.sell_price;
                                const additionalPrice =
                                  selectedService.additional;

                                totalPrice = basePrice;
                                totalBasicPrice = selectedService.basic_price;

                                if (koliCount > 1) {
                                  const extraKoli = koliCount - 1;
                                  totalPrice += extraKoli * additionalPrice;
                                  // Add additional basic price for extra koli
                                  totalBasicPrice +=
                                    extraKoli *
                                    selectedService.additional_basic_price;
                                }
                              }

                              newData.harga_jual = totalPrice.toString();
                              newData.harga_basic = totalBasicPrice.toString();

                              // Recalculate profit
                              const feeSales =
                                parseFloat(newData.fee_sales) || 0;
                              newData.profit = Math.max(
                                0,
                                totalPrice - totalBasicPrice - feeSales,
                              ).toString();
                            }
                          }

                          return newData;
                        });
                      }}
                      required
                      className="tosca-emboss"
                    />
                    {formData.selected_service_id &&
                      (() => {
                        const selectedService = airportServices.find(
                          (service) =>
                            service.id.toString() ===
                            formData.selected_service_id,
                        );
                        if (selectedService) {
                          const isPorter =
                            selectedService.service_type.toLowerCase() ===
                            "porter";
                          if (isPorter) {
                            const baseQuantity =
                              selectedService.porter_base_quantity || 3;
                            const additionalPrice =
                              selectedService.porter_additional_price ||
                              selectedService.additional;
                            return (
                              <p className="text-sm text-muted-foreground">
                                Harga dasar untuk {baseQuantity} koli pertama,
                                tambahan Rp{" "}
                                {additionalPrice.toLocaleString("id-ID")}/koli
                              </p>
                            );
                          } else {
                            const additionalPrice = selectedService.additional;
                            return (
                              <p className="text-sm text-muted-foreground">
                                Harga dasar untuk 1 koli, tambahan Rp{" "}
                                {additionalPrice.toLocaleString("id-ID")}/koli
                              </p>
                            );
                          }
                        }
                        return null;
                      })()}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="harga_jual">
                      Harga Jual per Orang (Rp)
                    </Label>
                    <Input
                      id="harga_jual"
                      name="harga_jual"
                      type="number"
                      value={formData.harga_jual}
                      onChange={handleChange}
                      placeholder="Harga dapat diedit"
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
                      placeholder="Harga dasar layanan"
                      required
                      className="tosca-emboss"
                      readOnly={!!formData.selected_service_id}
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
                      placeholder="Fee sales per unit tambahan (untuk porter)"
                      required
                      className="tosca-emboss"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profit">Profit per Unit (Rp)</Label>
                    <Input
                      id="profit"
                      name="profit"
                      value={formData.profit}
                      readOnly
                      className="bg-muted tosca-emboss"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="total_amount">Total Amount (Rp)</Label>
                    <Input
                      id="total_amount"
                      name="total_amount"
                      value={(() => {
                        const hargaJual = parseFloat(formData.harga_jual) || 0;
                        const quantity = parseInt(formData.quantity) || 1;
                        return (hargaJual * quantity).toLocaleString("id-ID");
                      })()}
                      readOnly
                      className="bg-green-50 border-green-200 text-green-800 font-bold tosca-emboss"
                    />
                  </div>

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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keterangan">Keterangan</Label>
                  <Input
                    id="keterangan"
                    name="keterangan"
                    value={formData.keterangan}
                    onChange={handleChange}
                    placeholder="Dari kolom service_departure"
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
                        !formData.selected_service_id ||
                        !formData.nama_layanan ||
                        !formData.lokasi ||
                        !formData.nama_pemesan ||
                        !formData.jam_checkin ||
                        !formData.terminal ||
                        !formData.harga_jual
                      ) {
                        setError(
                          "Harap pilih layanan dan isi semua field yang diperlukan sebelum menambahkan ke keranjang",
                        );
                        return;
                      }

                      try {
                        // Calculate total price
                        const totalPrice =
                          parseFloat(formData.harga_jual) *
                          parseInt(formData.quantity);

                        // Accounting integration removed - no journal entry created

                        // Add to cart only (database save handled in CartContext)
                        await addItem({
                          id: uuidv4(),
                          type: "passenger-handling",
                          name: formData.nama_layanan,
                          details: `${formData.lokasi} - ${formData.nama_pemesan} - Terminal ${formData.terminal} - ${formData.quantity} unit`,
                          price: parseFloat(formData.harga_jual),
                          quantity: parseInt(formData.quantity),
                          date: formData.tanggal,
                          kode_transaksi: formData.kode_transaksi,
                          additionalData: {
                            ...formData,
                            selected_service_id: formData.selected_service_id,
                            nama_penumpang: formData.nama_pemesan, // Maps to nama_penumpang column
                            quantity: parseInt(formData.quantity), // Maps to quantity column
                            jam_checkin: formData.jam_checkin, // Maps to jam_checkin column
                            terminal: formData.terminal, // Maps to tujuan column
                            tujuan: formData.terminal, // Maps to tujuan column
                            jumlah_koli: parseInt(formData.jumlah_koli),
                            keterangan: formData.keterangan,
                            foto_penumpang:
                              formData.foto_penumpang?.name || null,
                            service_type: "passenger_handling", // Maps to service_type
                            harga_jual: parseFloat(formData.harga_jual), // Maps to harga_jual
                            harga_basic: parseFloat(formData.harga_basic) || 0, // Maps to harga_basic
                            fee_sales: parseFloat(formData.fee_sales) || 0, // Maps to fee_sales
                            profit: parseFloat(formData.profit) || 0, // Maps to profit
                          },
                        });

                        // Show success message
                        setAddedToCart(true);
                        setTimeout(() => setAddedToCart(false), 3000);

                        // Reset form after adding to cart
                        const nextPHNumber = await generateNextPHNumber();
                        setFormData({
                          kode_transaksi: nextPHNumber,
                          tanggal: new Date().toISOString().split("T")[0],
                          selected_service_id: "",
                          nama_layanan: "",
                          lokasi: "CGK",
                          nama_pemesan: "",
                          quantity: "1",
                          jam_checkin: "",
                          terminal: "",
                          jumlah_penumpang: "1",
                          jumlah_koli: "3",
                          harga_jual: "",
                          harga_basic: "",
                          fee_sales: "",
                          profit: "",
                          keterangan: "",
                          foto_penumpang: null,
                        });
                        setSelectedCategory(null);
                        setSearchTerm("");

                        // Show success message
                        setSuccess(true);
                        setTimeout(() => setSuccess(false), 3000);
                      } catch (err: any) {
                        console.error("Error saving booking:", err);
                        setError(`Gagal menyimpan booking: ${err.message}`);
                      }
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
          ) : (
            /* Baggage Storage Form */
            <div className="bg-card p-8 rounded-xl border shadow-sm border-teal-200 tosca-emboss">
              <h2 className="text-2xl font-bold mb-8 text-primary">
                Form Penitipan Bagasi
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

              {/* Baggage Category Selection */}
              <div className="mb-8">
                <Label className="text-lg font-semibold mb-4 block">
                  Pilih Kategori Bagasi
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {baggageCategories.map((category) => (
                    <div
                      key={category.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                        baggageFormData.selected_categories.includes(
                          category.id,
                        )
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-primary/50"
                      }`}
                      onClick={() => handleBaggageCategorySelect(category.id)}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{category.icon}</div>
                        <h3 className="font-semibold text-lg">
                          {category.name}
                        </h3>
                        <p className="text-primary font-bold text-xl mb-2">
                          Rp {category.price.toLocaleString("id-ID")}
                        </p>
                        <p className="text-sm text-muted-foreground mb-3">
                          {category.description}
                        </p>
                        <Button
                          size="sm"
                          variant={
                            baggageFormData.selected_categories.includes(
                              category.id,
                            )
                              ? "default"
                              : "outline"
                          }
                          className="w-full"
                        >
                          {baggageFormData.selected_categories.includes(
                            category.id,
                          )
                            ? "Terpilih"
                            : "Pilih"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleBaggageSubmit} className="space-y-6">
                {/* Personal Information Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Informasi Personal
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Masukkan detail kontak Anda
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="baggage_kode_transaksi">
                        Kode Transaksi
                      </Label>
                      <Input
                        id="baggage_kode_transaksi"
                        name="kode_transaksi"
                        value={baggageFormData.kode_transaksi}
                        onChange={handleBaggageFormChange}
                        placeholder="BS-001"
                        required
                        className="tosca-emboss"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="baggage_nama_pemesan">Nama Lengkap</Label>
                      <Input
                        id="baggage_nama_pemesan"
                        name="nama_pemesan"
                        value={baggageFormData.nama_pemesan}
                        onChange={handleBaggageFormChange}
                        placeholder="Nama Lengkap"
                        required
                        className="tosca-emboss"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="baggage_quantity">Quantity</Label>
                      <Input
                        id="baggage_quantity"
                        name="quantity"
                        type="number"
                        min="1"
                        value={baggageFormData.quantity}
                        onChange={handleBaggageFormChange}
                        placeholder="1"
                        required
                        className="tosca-emboss"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="baggage_email">Email</Label>
                      <Input
                        id="baggage_email"
                        name="email"
                        type="email"
                        value={baggageFormData.email}
                        onChange={handleBaggageFormChange}
                        placeholder="john@example.com"
                        required
                        className="tosca-emboss"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="baggage_phone">Nomor Telepon</Label>
                      <Input
                        id="baggage_phone"
                        name="phone"
                        value={baggageFormData.phone}
                        onChange={handleBaggageFormChange}
                        placeholder="+62 812 3456 7890"
                        required
                        className="tosca-emboss"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="baggage_flight_number">
                        Nomor Penerbangan (Opsional)
                      </Label>
                      <Input
                        id="baggage_flight_number"
                        name="flight_number"
                        value={baggageFormData.flight_number}
                        onChange={handleBaggageFormChange}
                        placeholder="GA-123"
                        className="tosca-emboss"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="baggage_airport">Bandara</Label>
                      <Select
                        value={baggageFormData.airport}
                        onValueChange={(value) =>
                          setBaggageFormData((prev) => ({
                            ...prev,
                            airport: value,
                          }))
                        }
                      >
                        <SelectTrigger className="tosca-emboss">
                          <SelectValue placeholder="Pilih bandara" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="soekarno-hatta">
                            Soekarno Hatta International Airport
                          </SelectItem>
                          <SelectItem value="halim">
                            Halim Perdanakusuma Airport
                          </SelectItem>
                          <SelectItem value="juanda">
                            Juanda International Airport
                          </SelectItem>
                          <SelectItem value="ngurah-rai">
                            Ngurah Rai International Airport
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="baggage_terminal">Terminal</Label>
                      <Select
                        value={baggageFormData.terminal}
                        onValueChange={(value) =>
                          setBaggageFormData((prev) => ({
                            ...prev,
                            terminal: value,
                          }))
                        }
                      >
                        <SelectTrigger className="tosca-emboss">
                          <SelectValue placeholder="Pilih terminal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1A">Terminal 1A</SelectItem>
                          <SelectItem value="1B">Terminal 1B</SelectItem>
                          <SelectItem value="2D">Terminal 2D</SelectItem>
                          <SelectItem value="2E">Terminal 2E</SelectItem>
                          <SelectItem value="2F">Terminal 2F</SelectItem>
                          <SelectItem value="3-domestik">
                            Terminal 3 Domestik
                          </SelectItem>
                          <SelectItem value="3-internasional">
                            Terminal 3 Internasional
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Storage Duration Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Durasi Penyimpanan
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Tentukan periode penyimpanan bagasi Anda
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="baggage_durasi_value">Jumlah Hari</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="baggage_durasi_value"
                          name="durasi_value"
                          type="number"
                          min="1"
                          max="30"
                          value={baggageFormData.durasi_value}
                          onChange={handleBaggageFormChange}
                          required
                          className="tosca-emboss bg-blue-50 border-blue-200 font-semibold text-blue-800"
                          readOnly
                        />
                        <span className="text-sm text-muted-foreground font-medium">
                          hari
                        </span>
                      </div>
                      <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                        💡 <strong>Otomatis dihitung:</strong> Jumlah hari akan
                        dihitung secara otomatis berdasarkan tanggal mulai dan
                        tanggal selesai yang Anda pilih di bawah ini.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="baggage_tanggal_mulai">
                          Tanggal Mulai
                        </Label>
                        <Input
                          id="baggage_tanggal_mulai"
                          name="tanggal_mulai"
                          type="date"
                          value={baggageFormData.tanggal_mulai}
                          onChange={handleBaggageFormChange}
                          required
                          className="tosca-emboss"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="baggage_jam_mulai">Jam Mulai</Label>
                        <Input
                          id="baggage_jam_mulai"
                          name="jam_mulai"
                          type="time"
                          value={baggageFormData.jam_mulai}
                          onChange={handleBaggageFormChange}
                          required
                          className="tosca-emboss"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="baggage_tanggal_akhir">
                          Tanggal Selesai
                        </Label>
                        <Input
                          id="baggage_tanggal_akhir"
                          name="tanggal_akhir"
                          type="date"
                          value={baggageFormData.tanggal_akhir}
                          onChange={handleBaggageFormChange}
                          required
                          className="tosca-emboss"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="baggage_jam_akhir">Jam Selesai</Label>
                        <Input
                          id="baggage_jam_akhir"
                          name="jam_akhir"
                          type="time"
                          value={baggageFormData.jam_akhir}
                          onChange={handleBaggageFormChange}
                          required
                          className="tosca-emboss"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Display */}
                {baggageFormData.selected_categories.length > 0 && (
                  <div className="border-t pt-6">
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Rincian Harga:</h4>
                        {baggageFormData.selected_categories.map((catId) => {
                          const category = baggageCategories.find(
                            (cat) => cat.id === catId,
                          );
                          if (!category) return null;
                          return (
                            <div
                              key={catId}
                              className="flex justify-between text-sm"
                            >
                              <span>{category.name}</span>
                              <span>
                                Rp {category.price.toLocaleString("id-ID")}
                              </span>
                            </div>
                          );
                        })}
                        <div className="flex justify-between text-sm">
                          <span>
                            Durasi: {baggageFormData.durasi_value} hari
                          </span>
                          <span>× {baggageFormData.durasi_value}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Quantity: {baggageFormData.quantity} unit</span>
                          <span>× {baggageFormData.quantity}</span>
                        </div>
                        <div className="border-t pt-2 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">
                              Total Harga Jual:
                            </span>
                            <span className="text-xl font-bold text-primary">
                              Rp{" "}
                              {parseFloat(
                                baggageFormData.harga || "0",
                              ).toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Fee Oprs (35%):</span>
                            <span className="text-orange-600 font-medium">
                              Rp{" "}
                              {parseFloat(
                                baggageFormData.fee_sales || "0",
                              ).toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Harga Basic:</span>
                            <span className="text-blue-600 font-medium">
                              Rp{" "}
                              {parseFloat(
                                baggageFormData.harga_basic || "0",
                              ).toLocaleString("id-ID")}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm border-t pt-1">
                            <span className="font-semibold">Profit:</span>
                            <span className="text-green-600 font-bold">
                              Rp{" "}
                              {parseFloat(
                                baggageFormData.profit || "0",
                              ).toLocaleString("id-ID")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="baggage_keterangan">
                    Keterangan (Opsional)
                  </Label>
                  <Input
                    id="baggage_keterangan"
                    name="keterangan"
                    value={baggageFormData.keterangan}
                    onChange={handleBaggageFormChange}
                    placeholder="Catatan tambahan"
                    className="tosca-emboss"
                  />
                </div>

                <div className="pt-6 flex gap-2">
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      baggageFormData.selected_categories.length === 0
                    }
                    className="h-12 text-base font-medium rounded-lg transition-all duration-200 hover:scale-[1.02] tosca-emboss-button"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Tambahkan ke Keranjang
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
