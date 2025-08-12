import { useState, useEffect } from "react";
import { ShoppingCart, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCart } from "@/context/CartContext";
import CartItem from "./CartItem";
import supabase from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";

interface CartProps {
  onClose: () => void;
}

export const Cart = ({ onClose }: CartProps) => {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [bankAccount, setBankAccount] = useState<string>("");
  const [bankAccounts, setBankAccounts] = useState<
    Array<{ id: string; account_code: string; account_name: string }>
  >([]);

  useEffect(() => {
    const fetchBankAccounts = async () => {
      try {
        const { data, error } = await supabase
          .from("chart_of_accounts")
          .select("id, account_code, account_name")
          .or("account_code.eq.1111,account_code.eq.2222");

        if (error) throw error;
        setBankAccounts(data || []);
      } catch (err) {
        console.error("Error fetching bank accounts:", err);
      }
    };

    fetchBankAccounts();
  }, []);

  const formattedTotalPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(totalPrice);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      const mapItemType = (type: string) => {
        const typeMapping: { [key: string]: string } = {
          "tiket-pesawat": "tiket_pesawat",
          hotel: "hotel",
          "passenger-handling": "passenger_handling",
          travel: "travel",
          "airport-transfer": "airport_transfer",
          "rental-car": "rental_car",
        };
        return typeMapping[type] || type;
      };

      const newBookingItems = [];
      const existingBookingIds = [];

      for (const item of items) {
        const { data: existingBooking, error: checkError } = await supabase
          .from("bookings_trips")
          .select("id")
          .eq("kode_booking", item.kode_transaksi)
          .maybeSingle();

        if (checkError && checkError.code !== "PGRST116") {
          throw new Error(
            `Failed to check existing booking: ${checkError.message}`,
          );
        }

        if (existingBooking) {
          existingBookingIds.push(existingBooking.id);
        } else {
          const bookingData: any = {
            id: uuidv4(),
            user_id: user.id,
            kode_booking: item.kode_transaksi,
            service_type: mapItemType(item.type),
            service_name: item.additionalData?.maskapai || item.name,
            service_details: item.additionalData?.rute || item.details,
            price: item.price,
            harga_jual: item.additionalData?.harga_jual || item.price,
            harga_basic: item.additionalData?.harga_basic || 0,
            fee_sales: item.additionalData?.fee_sales || 0,
            profit: item.additionalData?.profit || 0,
            quantity: item.quantity,
            jumlah_malam:
              item.additionalData?.total_malam ||
              item.additionalData?.jumlah_malam ||
              1,
            total_amount: item.price * item.quantity,
            tanggal: item.date,
            tanggal_checkin: item.additionalData?.tanggal_checkin || null,
            tanggal_checkout: item.additionalData?.tanggal_checkout || null,
            nama_penumpang: item.additionalData?.nama_penumpang || null,
            no_telepon:
              typeof item.additionalData?.no_telepon === "string"
                ? parseInt(item.additionalData.no_telepon) || null
                : item.additionalData?.no_telepon || null,
            payment_method: paymentMethod,
            jam_checkin: item.additionalData?.jam_checkin || null,
            jam_checkout: item.additionalData?.jam_checkout || null,
            tujuan:
              item.additionalData?.terminal ||
              item.additionalData?.tujuan ||
              null,
            keterangan: item.additionalData?.keterangan || null,
            status: "confirmed",
            additional_data: {
              ...item.additionalData,
              nama_penumpang: undefined,
              no_telepon: undefined,
              tanggal_checkin: undefined,
              tanggal_checkout: undefined,
              payment_method: undefined,
              jam_checkin: undefined,
              jam_checkout: undefined,
              terminal: undefined,
              tujuan: undefined,
              keterangan: undefined,
            },
            created_at: new Date().toISOString(),
          };

          if (bookingData.additional_data) {
            Object.keys(bookingData.additional_data).forEach((key) => {
              if (bookingData.additional_data[key] === undefined) {
                delete bookingData.additional_data[key];
              }
            });
          }

          newBookingItems.push(bookingData);
        }
      }

      let insertedBookings = [];
      if (newBookingItems.length > 0) {
        const { data: newInsertedBookings, error: bookingError } =
          await supabase
            .from("bookings_trips")
            .insert(newBookingItems)
            .select("id");

        if (bookingError) {
          throw new Error(`Failed to save booking: ${bookingError.message}`);
        }

        insertedBookings = newInsertedBookings || [];
      }

      const allBookingIds = [
        ...insertedBookings.map((booking) => booking.id),
        ...existingBookingIds,
      ];

      // Create payment data - NO ACCOUNTING INTEGRATION
      const paymentData = {
        user_id: user.id,
        booking_ids: allBookingIds,
        total_amount: totalPrice,
        payment_method: paymentMethod,
        payment_status: "completed" as const,
        transaction_reference: `PAY-${Date.now()}`,
        notes: items?.length
          ? `Payment for ${items.length} item(s): ${items.map((item) => item.name).join(", ")}`
          : "Payment for booking",
        payment_date: new Date().toISOString(),
      };

      // Ensure notes is never null or empty
      if (!paymentData.notes || paymentData.notes.trim() === "") {
        paymentData.notes = "Payment entry";
      }

      // Insert payment record only - no journal entries or accounting
      const { error: paymentError } = await supabase
        .from("payments")
        .insert(paymentData);

      if (paymentError) {
        throw new Error(
          `Failed to create payment record: ${paymentError.message}`,
        );
      }

      if (allBookingIds.length > 0) {
        const { error: updateError } = await supabase
          .from("bookings_trips")
          .update({ status: "paid" })
          .in("id", allBookingIds);

        if (updateError) {
          console.error(
            "Failed to update booking status to paid:",
            updateError,
          );
        }
      }

      setCheckoutSuccess(true);
      clearCart();
      setTimeout(() => {
        setCheckoutSuccess(false);
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error("Checkout error:", error);
      let errorMessage =
        error.message || "Terjadi kesalahan saat checkout. Silakan coba lagi.";

      if (
        error.message &&
        error.message.includes("bookings_trips_service_type_check")
      ) {
        errorMessage =
          "Tipe layanan tidak valid. Harus: Tiket Pesawat, Hotel, Travel, dll.";
      }

      setCheckoutError(errorMessage);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="bg-background w-full max-w-md h-full flex flex-col">
        <Card className="h-full flex flex-col border-0 rounded-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 py-4 border-b">
            <CardTitle className="flex items-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Keranjang ({totalItems})
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 overflow-auto p-0">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Keranjang Anda kosong</p>
                <Button variant="outline" className="mt-4" onClick={onClose}>
                  Lanjutkan Belanja
                </Button>
              </div>
            ) : (
              <div>
                {checkoutSuccess && (
                  <div className="bg-green-100 text-green-800 p-4 text-sm">
                    Checkout berhasil! Terima kasih atas pesanan Anda.
                  </div>
                )}
                {checkoutError && (
                  <div className="bg-destructive/10 text-destructive p-4 text-sm flex items-start">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{checkoutError}</span>
                  </div>
                )}
                <div className="divide-y">
                  {items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}
          </CardContent>

          {items.length > 0 && (
            <CardFooter className="flex flex-col p-6 border-t space-y-4">
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Metode Pembayaran</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) => {
                      setPaymentMethod(value);
                      if (value === "cash") {
                        setBankAccount("");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih metode pembayaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Tunai</SelectItem>
                      <SelectItem value="bank_transfer">
                        Transfer Bank
                      </SelectItem>
                      <SelectItem value="credit_debit">
                        Kartu Kredit/Debit
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(paymentMethod === "bank_transfer" ||
                  paymentMethod === "credit_debit") && (
                  <div className="space-y-2">
                    <Label htmlFor="bank_account">Pilih Bank</Label>
                    <Select value={bankAccount} onValueChange={setBankAccount}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {bankAccounts.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.account_name} ({bank.account_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="flex justify-between w-full">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">{formattedTotalPrice}</span>
              </div>
              <div className="flex space-x-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clearCart}
                  disabled={isCheckingOut}
                >
                  Kosongkan
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCheckout}
                  disabled={
                    isCheckingOut ||
                    ((paymentMethod === "bank_transfer" ||
                      paymentMethod === "credit_debit") &&
                      !bankAccount)
                  }
                >
                  {isCheckingOut ? "Memproses..." : "Checkout"}
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Cart;
