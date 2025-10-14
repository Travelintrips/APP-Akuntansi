import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import supabase from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

interface StockForm {
  name: string;
  category: string;
  warehouse_location: string;
  part_number: string;
  item_name: string;
  brand: string;
  model: string;
  vehicle_type: string;
  plate_number: string;
  location: string;
  quantity: number;
  ppn_type: string;
  purchase_price: string;
  ppn_beli: string;
  harga_beli_setelah_ppn: string;
  selling_price: string;
  ppn_jual: string;
  harga_jual_setelah_ppn: string;
}

const STOCK_CATEGORIES = [
  "Resale",
  "Spare Parts",
  "Maintenance/Repair/Operations",
  "Consumables",
  "Rentable Units"
];

const WAREHOUSE_LOCATIONS = [
  "Kebon Jeruk",
  "Sport Center",
  "Pool"
];

const PPN_TYPES = [
  "Non PPN",
  "PPN"
];

const StokBarang = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<StockForm>({
    name: "",
    category: "",
    warehouse_location: "",
    part_number: "",
    item_name: "",
    brand: "",
    model: "",
    vehicle_type: "",
    plate_number: "",
    location: "",
    quantity: 0,
    ppn_type: "Non PPN",
    purchase_price: "Rp 0",
    ppn_beli: "Rp 0",
    harga_beli_setelah_ppn: "Rp 0",
    selling_price: "Rp 0",
    ppn_jual: "Rp 0",
    harga_jual_setelah_ppn: "Rp 0",
  });

  // Store numeric values separately
  const [purchasePriceNum, setPurchasePriceNum] = useState(0);
  const [ppnBeliNum, setPpnBeliNum] = useState(0);
  const [sellingPriceNum, setSellingPriceNum] = useState(0);
  const [ppnJualNum, setPpnJualNum] = useState(0);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return;

        const { data: userData, error: profileError } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          return;
        }

        if (userData) {
          setFormData(prev => ({
            ...prev,
            name: userData.full_name || ""
          }));
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, []);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(num);
  };

  const handlePurchasePriceChange = (value: string) => {
    const num = Number(value.replace(/\D/g, ''));
    setPurchasePriceNum(num);
    const formattedValue = formatCurrency(num);
    const hargaBeliSetelahPpn = num + ppnBeliNum;
    
    setFormData(prev => ({
      ...prev,
      purchase_price: formattedValue,
      harga_beli_setelah_ppn: formatCurrency(hargaBeliSetelahPpn)
    }));
  };

  const handlePpnBeliChange = (value: string) => {
    const num = Number(value.replace(/\D/g, ''));
    setPpnBeliNum(num);
    const formattedValue = formatCurrency(num);
    const hargaBeliSetelahPpn = purchasePriceNum + num;
    
    setFormData(prev => ({
      ...prev,
      ppn_beli: formattedValue,
      harga_beli_setelah_ppn: formatCurrency(hargaBeliSetelahPpn)
    }));
  };

  const handleSellingPriceChange = (value: string) => {
    const num = Number(value.replace(/\D/g, ''));
    setSellingPriceNum(num);
    const formattedValue = formatCurrency(num);
    const hargaJualSetelahPpn = num + ppnJualNum;
    
    setFormData(prev => ({
      ...prev,
      selling_price: formattedValue,
      harga_jual_setelah_ppn: formatCurrency(hargaJualSetelahPpn)
    }));
  };

  const handlePpnJualChange = (value: string) => {
    const num = Number(value.replace(/\D/g, ''));
    setPpnJualNum(num);
    const formattedValue = formatCurrency(num);
    const hargaJualSetelahPpn = sellingPriceNum + num;
    
    setFormData(prev => ({
      ...prev,
      ppn_jual: formattedValue,
      harga_jual_setelah_ppn: formatCurrency(hargaJualSetelahPpn)
    }));
  };

  const updateFormData = (field: keyof StockForm, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast({
          title: "Error",
          description: "User not authenticated",
          variant: "destructive",
        });
        return;
      }

      // Validate form
      if (!formData.name.trim()) {
        toast({
          title: "Error",
          description: "Nama harus diisi",
          variant: "destructive",
        });
        return;
      }

      if (!formData.category) {
        toast({
          title: "Error",
          description: "Kategori stok harus dipilih",
          variant: "destructive",
        });
        return;
      }

      if (!formData.warehouse_location) {
        toast({
          title: "Error",
          description: "Lokasi gudang harus dipilih",
          variant: "destructive",
        });
        return;
      }

      // Validate part_number for Spare Parts category
      if (formData.category === "Spare Parts" && !formData.part_number.trim()) {
        toast({
          title: "Error",
          description: "Part Number harus diisi untuk kategori Spare Parts",
          variant: "destructive",
        });
        return;
      }

      if (!formData.item_name.trim()) {
        toast({
          title: "Error",
          description: "Nama barang harus diisi",
          variant: "destructive",
        });
        return;
      }

      // Validate brand for Resale and Consumables category
      if ((formData.category === "Resale" || formData.category === "Consumables") && !formData.brand.trim()) {
        toast({
          title: "Error",
          description: "Brand harus diisi untuk kategori " + formData.category,
          variant: "destructive",
        });
        return;
      }

      // Validate location for Maintenance/Repair/Operations category
      if (formData.category === "Maintenance/Repair/Operations" && !formData.location.trim()) {
        toast({
          title: "Error",
          description: "Lokasi harus diisi untuk kategori Maintenance/Repair/Operations",
          variant: "destructive",
        });
        return;
      }

      // Validate Rentable Units fields
      if (formData.category === "Rentable Units") {
        if (!formData.brand.trim()) {
          toast({
            title: "Error",
            description: "Brand harus diisi untuk kategori Rentable Units",
            variant: "destructive",
          });
          return;
        }
        if (!formData.model.trim()) {
          toast({
            title: "Error",
            description: "Model harus diisi untuk kategori Rentable Units",
            variant: "destructive",
          });
          return;
        }
        if (!formData.vehicle_type.trim()) {
          toast({
            title: "Error",
            description: "Vehicle Type harus diisi untuk kategori Rentable Units",
            variant: "destructive",
          });
          return;
        }
        if (!formData.plate_number.trim()) {
          toast({
            title: "Error",
            description: "Plate Number harus diisi untuk kategori Rentable Units",
            variant: "destructive",
          });
          return;
        }
      }

      if (formData.quantity <= 0) {
        toast({
          title: "Error",
          description: "Jumlah stok harus lebih dari 0",
          variant: "destructive",
        });
        return;
      }

      if (purchasePriceNum <= 0) {
        toast({
          title: "Error",
          description: "Harga beli harus lebih dari 0",
          variant: "destructive",
        });
        return;
      }

      // Validate selling price only if not Spare Parts, Maintenance/Repair/Operations, Consumables, or Rentable Units
      if (formData.category !== "Spare Parts" && formData.category !== "Maintenance/Repair/Operations" && formData.category !== "Consumables" && formData.category !== "Rentable Units" && sellingPriceNum <= 0) {
        toast({
          title: "Error",
          description: "Harga jual harus lebih dari 0",
          variant: "destructive",
        });
        return;
      }

      const stockData: any = {
        name: formData.name,
        category: [formData.category],
        warehouse_location: formData.warehouse_location,
        item_name: formData.item_name,
        quantity: formData.quantity,
        ppn_type: formData.ppn_type,
        purchase_price: purchasePriceNum,
        created_by: user.id,
      };

      // Add PPN fields if PPN type is selected
      if (formData.ppn_type === "PPN") {
        stockData.ppn_beli = ppnBeliNum;
        stockData.harga_beli_setelah_ppn = purchasePriceNum + ppnBeliNum;
        
        // Only add PPN jual if category requires selling price
        if (formData.category !== "Spare Parts" && formData.category !== "Maintenance/Repair/Operations" && formData.category !== "Consumables" && formData.category !== "Rentable Units") {
          stockData.ppn_jual = ppnJualNum;
          stockData.harga_jual_setelah_ppn = sellingPriceNum + ppnJualNum;
        }
      }

      // Add part_number for Spare Parts category
      if (formData.category === "Spare Parts" && formData.part_number.trim()) {
        stockData.part_number = formData.part_number;
      }

      // Add brand for Resale and Consumables category
      if ((formData.category === "Resale" || formData.category === "Consumables") && formData.brand.trim()) {
        stockData.brand = [formData.brand];
      }

      // Add location for Maintenance/Repair/Operations category
      if (formData.category === "Maintenance/Repair/Operations" && formData.location.trim()) {
        stockData.location = formData.location;
      }

      // Add Rentable Units fields
      if (formData.category === "Rentable Units") {
        stockData.brand = [formData.brand];
        stockData.model = formData.model;
        stockData.vehicle_type = formData.vehicle_type;
        stockData.plate_number = formData.plate_number;
      }

      // Add selling_price only if not Spare Parts, Maintenance/Repair/Operations, Consumables, or Rentable Units
      if (formData.category !== "Spare Parts" && formData.category !== "Maintenance/Repair/Operations" && formData.category !== "Consumables" && formData.category !== "Rentable Units") {
        stockData.selling_price = sellingPriceNum;
      }

      const { error } = await supabase
        .from('stock')
        .upsert([stockData], {
          onConflict: 'item_name',
          ignoreDuplicates: false
        });

      if (error) {
        console.error("Database Error:", error);
        toast({
          title: "Error",
          description: "Gagal menyimpan data stok",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Berhasil",
        description: "Data stok berhasil disimpan",
      });

      // Reset form (keep name)
      setFormData(prev => ({
        name: prev.name,
        category: "",
        warehouse_location: "",
        part_number: "",
        item_name: "",
        brand: "",
        model: "",
        vehicle_type: "",
        plate_number: "",
        location: "",
        quantity: 0,
        ppn_type: "Non PPN",
        purchase_price: "Rp 0",
        ppn_beli: "Rp 0",
        harga_beli_setelah_ppn: "Rp 0",
        selling_price: "Rp 0",
        ppn_jual: "Rp 0",
        harga_jual_setelah_ppn: "Rp 0",
      }));
      setPurchasePriceNum(0);
      setPpnBeliNum(0);
      setSellingPriceNum(0);
      setPpnJualNum(0);

    } catch (error) {
      console.error("Error saving stock:", error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menyimpan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/sub-account">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Stok Barang</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Stok Barang</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                value={formData.name}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div>
              <Label htmlFor="category">Kategori Stok</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => updateFormData("category", value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Pilih kategori stok" />
                </SelectTrigger>
                <SelectContent>
                  {STOCK_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="warehouse_location">Lokasi Gudang <span className="text-red-500">*</span></Label>
              <Select
                value={formData.warehouse_location}
                onValueChange={(value) => updateFormData("warehouse_location", value)}
              >
                <SelectTrigger id="warehouse_location">
                  <SelectValue placeholder="Pilih lokasi gudang" />
                </SelectTrigger>
                <SelectContent>
                  {WAREHOUSE_LOCATIONS.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.category === "Spare Parts" && (
              <div>
                <Label htmlFor="part_number">Part Number</Label>
                <Input
                  id="part_number"
                  value={formData.part_number}
                  onChange={(e) => updateFormData("part_number", e.target.value)}
                  placeholder="Masukkan part number"
                />
              </div>
            )}

            <div>
              <Label htmlFor="item_name">Nama Barang</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => updateFormData("item_name", e.target.value)}
                placeholder="Masukkan nama barang"
              />
            </div>

            {(formData.category === "Resale" || formData.category === "Consumables" || formData.category === "Rentable Units") && (
              <div>
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => updateFormData("brand", e.target.value)}
                  placeholder="Masukkan brand"
                />
              </div>
            )}

            {formData.category === "Rentable Units" && (
              <>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => updateFormData("model", e.target.value)}
                    placeholder="Masukkan model"
                  />
                </div>

                <div>
                  <Label htmlFor="vehicle_type">Vehicle Type</Label>
                  <Input
                    id="vehicle_type"
                    value={formData.vehicle_type}
                    onChange={(e) => updateFormData("vehicle_type", e.target.value)}
                    placeholder="Masukkan vehicle type"
                  />
                </div>

                <div>
                  <Label htmlFor="plate_number">Plate Number</Label>
                  <Input
                    id="plate_number"
                    value={formData.plate_number}
                    onChange={(e) => updateFormData("plate_number", e.target.value)}
                    placeholder="Masukkan plate number"
                  />
                </div>
              </>
            )}

            {formData.category === "Maintenance/Repair/Operations" && (
              <div>
                <Label htmlFor="location">Lokasi</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => updateFormData("location", e.target.value)}
                  placeholder="Masukkan lokasi"
                />
              </div>
            )}

            <div>
              <Label htmlFor="quantity">Jumlah Stok</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => updateFormData("quantity", parseInt(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="ppn_type">PPN</Label>
              <Select
                value={formData.ppn_type}
                onValueChange={(value) => updateFormData("ppn_type", value)}
              >
                <SelectTrigger id="ppn_type">
                  <SelectValue placeholder="Pilih tipe PPN" />
                </SelectTrigger>
                <SelectContent>
                  {PPN_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="purchase_price">Harga Beli</Label>
              <Input
                id="purchase_price"
                type="text"
                value={formData.purchase_price}
                onChange={(e) => handlePurchasePriceChange(e.target.value)}
                placeholder="Rp 0"
              />
            </div>

            {formData.ppn_type === "PPN" && (
              <>
                <div>
                  <Label htmlFor="ppn_beli">PPN Beli</Label>
                  <Input
                    id="ppn_beli"
                    type="text"
                    value={formData.ppn_beli}
                    onChange={(e) => handlePpnBeliChange(e.target.value)}
                    placeholder="Rp 0"
                  />
                </div>

                <div>
                  <Label htmlFor="harga_beli_setelah_ppn">Harga Beli (setelah PPN)</Label>
                  <Input
                    id="harga_beli_setelah_ppn"
                    type="text"
                    value={formData.harga_beli_setelah_ppn}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </>
            )}

            {formData.category !== "Spare Parts" && formData.category !== "Maintenance/Repair/Operations" && formData.category !== "Consumables" && formData.category !== "Rentable Units" && (
              <>
                <div>
                  <Label htmlFor="selling_price">Harga Jual</Label>
                  <Input
                    id="selling_price"
                    type="text"
                    value={formData.selling_price}
                    onChange={(e) => handleSellingPriceChange(e.target.value)}
                    placeholder="Rp 0"
                  />
                </div>

                {formData.ppn_type === "PPN" && (
                  <>
                    <div>
                      <Label htmlFor="ppn_jual">PPN Jual</Label>
                      <Input
                        id="ppn_jual"
                        type="text"
                        value={formData.ppn_jual}
                        onChange={(e) => handlePpnJualChange(e.target.value)}
                        placeholder="Rp 0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="harga_jual_setelah_ppn">Harga Jual (setelah PPN)</Label>
                      <Input
                        id="harga_jual_setelah_ppn"
                        type="text"
                        value={formData.harga_jual_setelah_ppn}
                        disabled
                        className="bg-gray-50"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="pt-4">
              <Button onClick={handleSave} disabled={loading} size="lg" className="w-full">
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StokBarang;