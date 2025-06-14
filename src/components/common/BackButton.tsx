import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface BackButtonProps {
  to: string;
  label?: string;
}

export default function BackButton({ to, label = "Kembali" }: BackButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      className="h-9 w-9 rounded-full"
      asChild
    >
      <Link to={to} className="flex items-center justify-center">
        <ArrowLeft className="h-5 w-5" />
        <span className="sr-only">{label}</span>
      </Link>
    </Button>
  );
}
