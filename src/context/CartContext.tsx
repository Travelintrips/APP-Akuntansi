import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import supabase from "@/lib/supabase";

// Define the cart item interface
export interface CartItem {
  id: string;
  type:
    | "tiket-pesawat"
    | "hotel"
    | "passenger-handling"
    | "travel"
    | "airport-transfer"
    | "rental-car"
    | "baggage-storage";
  name: string;
  details: string;
  price: number;
  quantity: number;
  date: string;
  kode_transaksi: string;
  additionalData: Record<string, any>;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
        localStorage.removeItem("cart");
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);

  // Validate cart state and handle stale data (disabled aggressive validation)
  useEffect(() => {
    const validateCartState = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        // Only clear cart if user is explicitly logged out and we have items
        // Removed aggressive stale data clearing that was interfering with cart operations
        if (!user && items.length > 0) {
          // Only clear if we're sure user is not authenticated
          const { data: session } = await supabase.auth.getSession();
          if (!session.session) {
            setItems([]);
            localStorage.removeItem("cart");
            console.log("Cleared cart data - user not authenticated");
          }
        }
      } catch (error) {
        console.error("Error validating cart state:", error);
        // Don't clear cart on validation errors - this was too aggressive
      }
    };

    // Add event listener for focus to refresh session when user returns to tab
    const handleFocus = async () => {
      try {
        await supabase.auth.refreshSession();
        // Don't run validation on every focus - this was causing issues
      } catch (error) {
        console.error("Error refreshing session:", error);
      }
    };

    window.addEventListener("focus", handleFocus);

    // Only run validation on mount, not on every items change
    if (items.length === 0) {
      validateCartState();
    }

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []); // Changed dependency to empty array to prevent excessive validation

  const addItem = async (newItem: CartItem) => {
    console.log("Adding item to cart:", newItem);

    // Validate required fields
    if (!newItem.id || !newItem.name || !newItem.price || !newItem.quantity) {
      console.error("Invalid cart item - missing required fields:", newItem);
      return;
    }

    // Check if item already exists in cart to prevent duplicates
    const existingItem = items.find(
      (item) => item.kode_transaksi === newItem.kode_transaksi,
    );

    if (existingItem) {
      console.log("Item already exists in cart, updating quantity");
      // Just update quantity in cart
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.kode_transaksi === newItem.kode_transaksi
            ? { ...item, quantity: item.quantity + newItem.quantity }
            : item,
        ),
      );
      return;
    }

    // Don't save to database here - let the checkout process handle database operations
    // This prevents duplicate booking errors and allows proper transaction handling
    console.log(
      "Adding item to cart without database save - will be saved during checkout",
    );

    // Add new item to cart
    setItems((prevItems) => {
      console.log("Current cart items:", prevItems);
      const updatedItems = [...prevItems, newItem];
      console.log("Updated cart items:", updatedItems);
      return updatedItems;
    });
  };

  const removeItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
