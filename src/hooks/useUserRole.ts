import { useState, useEffect } from "react";
import supabase from "@/lib/supabase";

export type UserRole = "admin" | "staff_trips";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
}

export const useUserRole = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);
        setError(null);

        // Get current user session
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("Auth user error:", authError);
          if (isMounted) {
            setError(authError.message);
            setUserProfile(null);
            setLoading(false);
          }
          return;
        }

        if (!user) {
          if (isMounted) {
            setUserProfile(null);
            setLoading(false);
          }
          return;
        }

        // Fetch user profile from public.users table
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("id, email, full_name, role")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error("Profile fetch error:", profileError);
          if (isMounted) {
            setError(profileError.message);
            setUserProfile(null);
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setUserProfile(profile);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Error fetching user profile:", err);
        if (isMounted) {
          setError(err.message || "Failed to fetch user profile");
          setUserProfile(null);
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_IN" && session) {
        fetchUserProfile();
      } else if (event === "SIGNED_OUT") {
        setUserProfile(null);
        setError(null);
        setLoading(false);
      }
    });

    fetchUserProfile();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    userProfile,
    loading,
    error,
    isAdmin: userProfile?.role?.toLowerCase() === "admin",
    isStaffTrips: userProfile?.role?.toLowerCase() === "staff_trips",
  };
};
