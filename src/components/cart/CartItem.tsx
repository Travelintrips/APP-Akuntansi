import { useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartItem as CartItemType, useCart } from "@/context/CartContext";

interface CartItemProps {
  item: CartItemType;
}

export const CartItem = ({ item }: CartItemProps) => {
  const { updateQuantity, removeItem } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleIncrement = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleRemove = () => {
    setIsUpdating(true);
    setTimeout(() => {
      removeItem(item.id);
      setIsUpdating(false);
    }, 300);
  };

  // Format the price with Indonesian Rupiah
  const formattedPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(item.price);

  // Format the total price
  const formattedTotalPrice = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(item.price * item.quantity);

  // Get icon based on item type
  const getTypeLabel = (type: string) => {
    switch (type) {
      case "tiket-pesawat":
        return "Tiket Pesawat";
      case "hotel":
        return "Hotel";
      case "passenger-handling":
        return "Passenger Handling";
      case "travel":
        return "Travel";
      case "airport-transfer":
        return "Airport Transfer";
      case "rental-car":
        return "Rental Car";
      default:
        return type;
    }
  };

  return (
    <div
      className={`flex items-start p-4 border-b transition-opacity ${isUpdating ? "opacity-50" : "opacity-100"}`}
    >
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{item.name}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-1">{item.details}</p>
        <div className="text-sm text-muted-foreground mb-2">
          <span className="inline-block px-2 py-1 bg-primary/10 text-primary rounded-md text-xs mr-2">
            {getTypeLabel(item.type)}
          </span>
          <span>{item.date}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleDecrement}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={handleIncrement}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="text-right">
            <div className="text-sm">{formattedPrice} / item</div>
            <div className="font-medium">{formattedTotalPrice}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
