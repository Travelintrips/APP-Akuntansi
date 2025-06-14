import { useState } from "react";
import { ShoppingCart, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCart } from "@/context/CartContext";
import CartItem from "./CartItem";

interface CartProps {
  onClose: () => void;
}

export const Cart = ({ onClose }: CartProps) => {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Format the total price with Indonesian Rupiah
  const formattedTotalPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(totalPrice);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      // Simulate API call for checkout
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // For now, just simulate a successful checkout
      setCheckoutSuccess(true);
      clearCart();

      // Reset after showing success message
      setTimeout(() => {
        setCheckoutSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Checkout error:", error);
      setCheckoutError("Terjadi kesalahan saat checkout. Silakan coba lagi.");
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
            <CardFooter className="flex flex-col p-6 border-t">
              <div className="flex justify-between w-full mb-4">
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
                  disabled={isCheckingOut}
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
