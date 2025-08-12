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
    let isMounted = true;

    const checkSession = async () => {
      if (!isMounted) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Auth session error:", error);
          if (isMounted) setIsLoading(false);
          return;
        }

        if (data.session && isMounted) {
          // Get user profile to determine redirect destination
          const { data: profile, error: profileError } = await supabase
            .from("users")
            .select("role")
            .eq("id", data.session.user.id)
            .single();

          if (profileError) {
            console.error("Profile fetch error:", profileError);
            // Default to dashboard if profile fetch fails
            navigate("/dashboard");
            return;
          }

          // Redirect based on user role
          if (profile?.role === "staff_trips") {
            navigate("/sub-account");
          } else {
            navigate("/dashboard");
          }
        } else if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error checking auth session:", err);
        if (isMounted) setIsLoading(false);
      }
    };

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleAuthSuccess = async () => {
    try {
      // Get current user session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // Get user profile to determine redirect destination
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        // Redirect based on user role
        if (profile?.role === "staff_trips") {
          navigate("/sub-account");
        } else {
          navigate("/dashboard");
        }
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Error determining redirect:", err);
      navigate("/dashboard");
    }
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
          <p className="text-muted-foreground mt-2">Masuk ke akun Anda</p>
        </div>

        <AuthForm defaultTab="signin" onAuthSuccess={handleAuthSuccess} />
      </div>
    </div>
  );
};

export default AuthPage;
