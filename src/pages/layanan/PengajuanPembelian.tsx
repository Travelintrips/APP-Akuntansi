import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, X, Camera } from "lucide-react";
import supabase from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import { nanoid } from "nanoid";

interface PurchaseRequestForm {
  request_date: string;
  name: string;
  email: string;
  item_name: string;
  qty: number;
  unit_price: string;
  tax: string;
  shipping_cost: string;
  total_amount: string;
  barcode: string;
}

export function CameraBarcodeScanner({
  onDetected,
  active = true,
}: {
  onDetected: (code: string) => void;
  active?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Arahkan kamera ke barcode...");
  const [lastCode, setLastCode] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return; // hanya aktif jika modal terbuka

    const reader = new BrowserMultiFormatReader();
    let controls: { stop: () => void } | null = null;

    reader
      .decodeFromVideoDevice(null, videoRef.current!, (result, err) => {
        if (result) {
          const code = result.getText();
          if (code !== lastCode) {
            setLastCode(code);
            setStatus(`✅ Barcode terdeteksi: ${code}`);
            onDetected(code);
          }
        }
      })
      .then((ctrl) => {
        controls = ctrl;
      })
      .catch((err) => console.error("Camera error:", err));

    // ✅ cleanup aman — tanpa reader.reset()
    return () => {
      if (controls && typeof controls.stop === "function") {
        controls.stop();
        console.log("📷 Kamera dimatikan dengan aman");
      }
    };
  }, [active]); // kamera hidup/mati tergantung state modal

  return (
    <div className="border rounded-lg bg-gray-50 mt-3 p-2 space-y-2">
      <video ref={videoRef} className="w-full rounded-md" muted playsInline />
      <p className="text-sm text-gray-600">{status}</p>
      {lastCode && (
        <p className="text-green-700 text-sm font-mono">{lastCode}</p>
      )}
    </div>
  );
}

const PengajuanPembelian = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const [formData, setFormData] = useState<PurchaseRequestForm>({
    request_date: new Date().toISOString().split("T")[0],
    name: "",
    email: "",
    item_name: "",
    barcode: "",
    qty: 1,
    unit_price: "Rp 0",
    tax: "Rp 0",
    shipping_cost: "Rp 0",
    total_amount: "Rp 0",
  });

  // Store numeric values separately
  const [unitPriceNum, setUnitPriceNum] = useState(0);
  const [taxNum, setTaxNum] = useState(0);
  const [shippingNum, setShippingNum] = useState(0);
  const [qtyNum, setQtyNum] = useState(1);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) return;

        // Get user details from public.users table
        const { data: userData, error: profileError } = await supabase
          .from("users")
          .select("full_name, email")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching user profile:", profileError);
          return;
        }

        if (userData) {
          setFormData((prev) => ({
            ...prev,
            name: userData.full_name || "",
            email: userData.email || user.email || "",
          }));
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, []);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const calculateTotal = (
    qty: number,
    unitPrice: number,
    tax: number,
    shipping: number,
  ) => {
    return qty * unitPrice + tax + shipping;
  };

  const handleUnitPriceChange = (value: string) => {
    const num = Number(value.replace(/\D/g, ""));
    setUnitPriceNum(num);
    const formattedValue = formatCurrency(num);
    const total = calculateTotal(qtyNum, num, taxNum, shippingNum);

    setFormData((prev) => ({
      ...prev,
      unit_price: formattedValue,
      total_amount: formatCurrency(total),
    }));
  };

  const handleTaxChange = (value: string) => {
    const num = Number(value.replace(/\D/g, ""));
    setTaxNum(num);
    const formattedValue = formatCurrency(num);
    const total = calculateTotal(qtyNum, unitPriceNum, num, shippingNum);

    setFormData((prev) => ({
      ...prev,
      tax: formattedValue,
      total_amount: formatCurrency(total),
    }));
  };

  const handleShippingCostChange = (value: string) => {
    const num = Number(value.replace(/\D/g, ""));
    setShippingNum(num);
    const formattedValue = formatCurrency(num);
    const total = calculateTotal(qtyNum, unitPriceNum, taxNum, num);

    setFormData((prev) => ({
      ...prev,
      shipping_cost: formattedValue,
      total_amount: formatCurrency(total),
    }));
  };

  const handleQtyChange = (value: string) => {
    const num = parseInt(value) || 1;
    setQtyNum(num);
    const total = calculateTotal(num, unitPriceNum, taxNum, shippingNum);

    setFormData((prev) => ({
      ...prev,
      qty: num,
      total_amount: formatCurrency(total),
    }));
  };

  const updateFormData = (field: keyof PurchaseRequestForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // validasi file ...
    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    await uploadImageToStorage(file);
  };

  const uploadImageToStorage = async (file: File) => {
    try {
      setUploadingImage(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${nanoid()}.${fileExt}`;
      const filePath = `${user.id}/items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("purchase_requests_img")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("purchase_requests_img").getPublicUrl(filePath);

      setAttachmentUrl(publicUrl); // preview & state
      updateFormData("attachment_url" as any, publicUrl); // simpan ke formData
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setAttachmentUrl(null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
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

      if (!formData.item_name.trim()) {
        toast({
          title: "Error",
          description: "Nama barang harus diisi",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for API call with raw numbers
      const total = calculateTotal(qtyNum, unitPriceNum, taxNum, shippingNum);
      const requestData = {
        request_date: formData.request_date,
        name: formData.name,
        email: formData.email,
        item_name: formData.item_name,
        barcode: formData.barcode,
        qty: qtyNum,
        unit_price: unitPriceNum,
        tax: taxNum,
        shipping_cost: shippingNum,
        total_amount: total,
        status: "PENDING",
        attachment_url: attachmentUrl,
        requester_id: user.id,
      };

      // Insert using Supabase client
      const { error } = await supabase
        .from("purchase_requests")
        .insert([requestData]);

      if (error) {
        console.error("Database Error:", error);
        toast({
          title: "Error",
          description: "Gagal menyimpan pengajuan pembelian",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Berhasil",
        description: "Pengajuan pembelian berhasil disimpan",
      });

      // Reset form (keep name and email)
      setFormData((prev) => ({
        request_date: new Date().toISOString().split("T")[0],
        name: prev.name,
        email: prev.email,
        item_name: "",
        barcode: "",
        qty: 1,
        unit_price: "Rp 0",
        tax: "Rp 0",
        shipping_cost: "Rp 0",
        total_amount: "Rp 0",
      }));
      setUnitPriceNum(0);
      setTaxNum(0);
      setShippingNum(0);
      setQtyNum(1);
      setImageFile(null);
      setImagePreview(null);
      setAttachmentUrl(null);
    } catch (error) {
      console.error("Error saving purchase request:", error);
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
          <h1 className="text-2xl font-bold">Pengajuan Pembelian</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Pengajuan Pembelian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="request_date">Tanggal</Label>
              <Input
                id="request_date"
                type="date"
                value={formData.request_date}
                onChange={(e) => updateFormData("request_date", e.target.value)}
              />
            </div>

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
              <Label htmlFor="item_name">Nama Barang</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => updateFormData("item_name", e.target.value)}
                placeholder="Masukkan nama barang"
              />
            </div>

            <div className="mt-4">
              <Label className="text-sm font-medium">
                Scan Barcode (Opsional)
              </Label>

              {!isScanning ? (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => setIsScanning(true)}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Mulai Scan Barcode
                </Button>
              ) : (
                <>
                  <CameraBarcodeScanner
                    active={isScanning}
                    onDetected={(detectedBarcode) => {
                      console.log("✅ Barcode terdeteksi:", detectedBarcode);
                      updateFormData("part_number", detectedBarcode);
                      setIsScanning(false);
                    }}
                  />
                  <Button
                    variant="destructive"
                    className="mt-2"
                    onClick={() => setIsScanning(false)}
                  >
                    Stop Kamera
                  </Button>
                </>
              )}

              {formData.part_number && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-700">
                    Barcode:{" "}
                    <span className="font-mono font-bold">
                      {formData.part_number}
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="item_photo">Foto Barang</Label>
              <div className="space-y-2">
                {!imagePreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      id="item_photo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e)}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <label
                      htmlFor="item_photo"
                      className="cursor-pointer flex flex-col items-center gap-2"
                    >
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {uploadingImage
                          ? "Mengunggah..."
                          : "Klik untuk upload foto"}
                      </span>
                      <span className="text-xs text-gray-400">
                        Maksimal 5 MB
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <button
                      onClick={handleRemoveImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="qty">Jumlah</Label>
              <Input
                id="qty"
                type="number"
                min="1"
                value={formData.qty}
                onChange={(e) => handleQtyChange(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="unit_price">Harga Satuan</Label>
              <Input
                id="unit_price"
                type="text"
                value={formData.unit_price}
                onChange={(e) => handleUnitPriceChange(e.target.value)}
                placeholder="Rp 0"
              />
            </div>

            <div>
              <Label htmlFor="tax">Tax</Label>
              <Input
                id="tax"
                type="text"
                value={formData.tax}
                onChange={(e) => handleTaxChange(e.target.value)}
                placeholder="Rp 0"
              />
            </div>

            <div>
              <Label htmlFor="shipping_cost">Ongkos Kirim</Label>
              <Input
                id="shipping_cost"
                type="text"
                value={formData.shipping_cost}
                onChange={(e) => handleShippingCostChange(e.target.value)}
                placeholder="Rp 0"
              />
            </div>

            <div>
              <Label>Total Harga</Label>
              <div className="text-lg font-semibold text-green-600 p-2 bg-gray-50 rounded">
                {formData.total_amount}
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleSave}
                disabled={loading || uploadingImage}
                size="lg"
                className="w-full"
              >
                {loading ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PengajuanPembelian;
