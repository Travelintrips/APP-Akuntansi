import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "@/components/auth/AuthForm";
import supabase from "@/lib/supabase";
import { Loader2 } from "lucide-react";

const AuthPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already authenticated
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session) {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Error checking auth session:", err);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard");
      }
    });

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleAuthSuccess = () => {
    navigate("/dashboard");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Selamat Datang</h1>
          <p className="text-muted-foreground mt-2">
            Masuk ke akun Anda atau buat akun baru
          </p>
        </div>

        <AuthForm defaultTab="signin" onAuthSuccess={handleAuthSuccess} />

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Akun test tersedia:</p>
          <p className="font-mono bg-muted p-2 rounded mt-1">
            admin@contoh.com / 123456
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
