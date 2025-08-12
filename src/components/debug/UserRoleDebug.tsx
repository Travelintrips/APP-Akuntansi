import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import supabase from "@/lib/supabase";
import { useUserRole } from "@/hooks/useUserRole";

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

interface PublicUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function UserRoleDebug() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [publicUser, setPublicUser] = useState<PublicUser | null>(null);
  const [allUsers, setAllUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(false);
  const { userProfile, loading: hookLoading, error: hookError } = useUserRole();

  const fetchDebugInfo = async () => {
    setLoading(true);
    try {
      // Get current auth user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;

      if (user) {
        setAuthUser({
          id: user.id,
          email: user.email || "No email",
          created_at: user.created_at,
        });

        // Get user from public.users table
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!profileError && profile) {
          setPublicUser(profile);
        } else {
          console.error("Profile error:", profileError);
        }
      }

      // Get all users for reference
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (!usersError && users) {
        setAllUsers(users);
      }
    } catch (error) {
      console.error("Debug fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const fixUserRole = async (
    email: string,
    newRole: "admin" | "staff_trips",
  ) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("email", email);

      if (error) throw error;

      alert(`Role updated successfully for ${email}`);
      fetchDebugInfo();
    } catch (error: any) {
      alert(`Error updating role: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>User Role Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={fetchDebugInfo} disabled={loading}>
            {loading ? "Loading..." : "Refresh Debug Info"}
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Auth User (Supabase Auth)</h3>
              <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                {JSON.stringify(authUser, null, 2)}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Public User (Database)</h3>
              <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                {JSON.stringify(publicUser, null, 2)}
              </pre>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">useUserRole Hook Result</h3>
            <pre className="bg-muted p-3 rounded text-sm overflow-auto">
              {JSON.stringify(
                { userProfile, loading: hookLoading, error: hookError },
                null,
                2,
              )}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">All Users in Database</h3>
            <div className="overflow-auto max-h-60">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-gray-300 p-2 text-left">
                      Email
                    </th>
                    <th className="border border-gray-300 p-2 text-left">
                      Role
                    </th>
                    <th className="border border-gray-300 p-2 text-left">
                      Full Name
                    </th>
                    <th className="border border-gray-300 p-2 text-left">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="border border-gray-300 p-2">
                        {user.email}
                      </td>
                      <td className="border border-gray-300 p-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            user.role === "admin"
                              ? "bg-blue-100 text-blue-800"
                              : user.role === "staff_trips"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="border border-gray-300 p-2">
                        {user.full_name}
                      </td>
                      <td className="border border-gray-300 p-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fixUserRole(user.email, "admin")}
                          >
                            Set Admin
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              fixUserRole(user.email, "staff_trips")
                            }
                          >
                            Set Staff
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
