import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import supabase from "@/lib/supabase";

interface LogoutButtonProps {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
}

export default function LogoutButton({
  variant = "ghost",
  size = "default",
  className = "",
  showIcon = true,
  showText = true,
}: LogoutButtonProps) {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Navigation will be handled by the auth state listener in App.tsx
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      className={`text-destructive hover:text-destructive hover:bg-destructive/10 ${className}`}
    >
      {showIcon && <LogOut className="h-4 w-4" />}
      {showIcon && showText && <span className="ml-2">Logout</span>}
      {!showIcon && showText && <span>Logout</span>}
    </Button>
  );
}
