import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import supabase from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

interface SupplierForm {
  supplier_code: string;
  supplier_name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  address: string;
  city: string;
  country: string;
  tax_id: string;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  payment_terms: string;
  category: string;
  currency: string;
  status: string;
}

interface Supplier extends SupplierForm {
  id: string;
  created_at: string;
}

const SUPPLIER_CATEGORIES = [
  "Raw Materials",
  "Work-In-Process (WIP)",
  "Finished Goods",
  "Resale/Merchandise",
  "Kits/Bundles",
  "Spare Parts",
  "MRO",
  "Consumables",
  "Packaging",
  "Food",
  "Beverages",
  "Rentable Units",
  "Demo/Loaner Units",
  "Returns",
  "Defective/Damaged",
  "Obsolete/Expired",
  "Goods In Transit",
  "Consignment",
  "Third-Party Owned",
  "Samples/Marketing"
];

const Supplier = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  
  const [formData, setFormData] = useState<SupplierForm>({
    supplier_code: "",
    supplier_name: "",
    contact_person: "",
    phone_number: "",
    email: "",
    address: "",
    city: "",
    country: "",
    tax_id: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_holder: "",
    payment_terms: "",
    category: "",
    currency: "IDR",
    status: "ACTIVE",
  });

  useEffect(() => {
    generateSupplierCode();
    fetchSuppliers();
  }, []);

  const generateSupplierCode = async () => {
    try {
      const { data, error } = await supabase.rpc('generate_supplier_code');
      if (error) throw error;
      setFormData(prev => ({ ...prev, supplier_code: data }));
    } catch (error) {
      console.error("Error generating supplier code:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone_number: string) => {
    const phoneRegex = /^[0-9+\-\s()]+$/;
    return phoneRegex.test(phone_number);
  };

  const updateFormData = (field: keyof SupplierForm, value: any) => {
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

      // Validations
      if (!formData.supplier_name.trim()) {
        toast({
          title: "Error",
          description: "Supplier Name harus diisi",
          variant: "destructive",
        });
        return;
      }

      if (formData.email && !validateEmail(formData.email)) {
        toast({
          title: "Error",
          description: "Format email tidak valid",
          variant: "destructive",
        });
        return;
      }

      if (formData.phone_number && !validatePhone(formData.phone_number)) {
        toast({
          title: "Error",
          description: "Phone harus berisi angka, +, -, (, ), atau spasi",
          variant: "destructive",
        });
        return;
      }

      const supplierData = {
        ...formData,
        category: formData.category ? [formData.category] : [],
        created_by: user.id,
      };

      const { error } = await supabase
        .from('suppliers')
        .insert([supplierData]);

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Error",
            description: "Supplier code sudah ada",
            variant: "destructive",
          });
        } else {
          console.error("Database Error:", error);
          toast({
            title: "Error",
            description: "Gagal menyimpan data supplier",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Berhasil",
        description: "Data supplier berhasil disimpan",
      });

      // Reset form
      setFormData({
        supplier_code: "",
        supplier_name: "",
        contact_person: "",
        phone_number: "",
        email: "",
        address: "",
        city: "",
        country: "",
        tax_id: "",
        bank_name: "",
        bank_account_number: "",
        bank_account_holder: "",
        payment_terms: "",
        category: "",
        currency: "IDR",
        status: "ACTIVE",
      });

      // Generate new code and refetch
      await generateSupplierCode();
      await fetchSuppliers();

    } catch (error) {
      console.error("Error saving supplier:", error);
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
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/sub-account">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Supplier</h1>
        </div>

        {/* Form Supplier */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Form Supplier</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier_code">Supplier Code</Label>
                <Input
                  id="supplier_code"
                  value={formData.supplier_code}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="supplier_name">Supplier Name <span className="text-red-500">*</span></Label>
                <Input
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => updateFormData("supplier_name", e.target.value)}
                  placeholder="Masukkan nama supplier"
                />
              </div>

              <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                  id="contact_person"
                  value={formData.contact_person}
                  onChange={(e) => updateFormData("contact_person", e.target.value)}
                  placeholder="Masukkan contact person"
                />
              </div>

              <div>
                <Label htmlFor="phone_number">Phone</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => updateFormData("phone_number", e.target.value)}
                  placeholder="Masukkan nomor telepon"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  placeholder="Masukkan email"
                />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => updateFormData("city", e.target.value)}
                  placeholder="Masukkan kota"
                />
              </div>

              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={formData.country}
                  onChange={(e) => updateFormData("country", e.target.value)}
                  placeholder="Masukkan negara"
                />
              </div>

              <div>
                <Label htmlFor="tax_id">Tax ID</Label>
                <Input
                  id="tax_id"
                  value={formData.tax_id}
                  onChange={(e) => updateFormData("tax_id", e.target.value)}
                  placeholder="Masukkan tax ID"
                />
              </div>

              <div>
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => updateFormData("bank_name", e.target.value)}
                  placeholder="Masukkan nama bank"
                />
              </div>

              <div>
                <Label htmlFor="bank_account_number">Bank Account Number</Label>
                <Input
                  id="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={(e) => updateFormData("bank_account_number", e.target.value)}
                  placeholder="Masukkan nomor rekening"
                />
              </div>

              <div>
                <Label htmlFor="bank_account_holder">Bank Account Holder</Label>
                <Input
                  id="bank_account_holder"
                  value={formData.bank_account_holder}
                  onChange={(e) => updateFormData("bank_account_holder", e.target.value)}
                  placeholder="Masukkan nama pemegang rekening"
                />
              </div>

              <div>
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Input
                  id="payment_terms"
                  value={formData.payment_terms}
                  onChange={(e) => updateFormData("payment_terms", e.target.value)}
                  placeholder="Masukkan payment terms"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => updateFormData("category", value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPLIER_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => updateFormData("currency", e.target.value)}
                  placeholder="IDR"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateFormData("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                    <SelectItem value="INACTIVE">INACTIVE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder="Masukkan alamat lengkap"
                rows={3}
              />
            </div>

            <div className="pt-4">
              <Button onClick={handleSave} disabled={loading} size="lg" className="w-full">
                {loading ? "Menyimpan..." : "Simpan Supplier"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabel Suppliers */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier Code</TableHead>
                    <TableHead>Supplier Name</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500">
                        Belum ada data supplier
                      </TableCell>
                    </TableRow>
                  ) : (
                    suppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.supplier_code}</TableCell>
                        <TableCell>{supplier.supplier_name}</TableCell>
                        <TableCell>{supplier.contact_person || "-"}</TableCell>
                        <TableCell>{supplier.phone_number || "-"}</TableCell>
                        <TableCell>{supplier.email || "-"}</TableCell>
                        <TableCell>{supplier.category?.[0] || "-"}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            supplier.status === "ACTIVE" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {supplier.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Supplier;