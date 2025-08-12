import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/Sidebar";
import {
  Users,
  Filter,
  RefreshCw,
  FileImage,
  ArrowLeft,
  Upload,
  X,
} from "lucide-react";

interface UserData {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  selfie_photo_url: string | null;
  ktp_url: string | null;
  sim_url: string | null;
  skck_url: string | null;
  phone: string | null;
  address: string | null;
  created_at: string | null;
}

const UsersPage = () => {
  const navigate = useNavigate();
  const { isAdmin, userProfile } = useUserRole();
  const [usersData, setUsersData] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<string>("users");
  const [uploadingFiles, setUploadingFiles] = useState<{
    [key: string]: boolean;
  }>({});
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    console.log("Users page - isAdmin:", isAdmin);
    console.log("Users page - userProfile:", userProfile);
    console.log("Users page - userProfile role:", userProfile?.role);
    console.log(
      "Users page - role check:",
      userProfile?.role?.toLowerCase() === "admin",
    );

    // Only redirect if we have confirmed the user is not admin
    // Don't redirect while still loading (isAdmin === undefined)
    if (isAdmin === false && userProfile) {
      console.log("User is not admin, redirecting to dashboard");
      navigate("/dashboard");
      return;
    }
  }, [isAdmin, navigate, userProfile]);

  // Fetch data when component mounts and user is admin
  useEffect(() => {
    if (isAdmin === true) {
      console.log("User is admin, fetching data...");
      fetchUsersData();
    }
  }, [isAdmin]);

  const fetchUsersData = async () => {
    try {
      setLoading(true);
      console.log("Fetching users data...");

      const { data, error } = await supabase
        .from("users")
        .select(
          "id, full_name, email, role, selfie_photo_url, ktp_url, sim_url, skck_url, phone, address, created_at",
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
        setError(`Error fetching users: ${error.message}`);
        return;
      }

      console.log("Users data fetched:", data);
      if (data) {
        setUsersData(data);
        setFilteredUsers(data);
        setError(null);
      }
    } catch (error) {
      console.error("Error fetching users data:", error);
      setError(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRoleFilter = (role: string) => {
    setSelectedRole(role);
    if (role === "all") {
      setFilteredUsers(usersData);
    } else {
      setFilteredUsers(usersData.filter((user) => user.role === role));
    }
  };

  const uploadFile = async (file: File, userId: string) => {
    try {
      setUploadingFiles((prev) => ({ ...prev, [userId]: true }));

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        alert("Hanya file JPEG dan PNG yang diperbolehkan!");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file maksimal 5MB!");
        return;
      }

      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}_dokumen_${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert(`Error uploading file: ${uploadError.message}`);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath);

      // Update user record with document URL
      const { error: updateError } = await supabase
        .from("users")
        .update({ skck_url: publicUrl })
        .eq("id", userId);

      if (updateError) {
        console.error("Update error:", updateError);
        alert(`Error updating user record: ${updateError.message}`);
        return;
      }

      // Refresh data
      await fetchUsersData();
      alert("File berhasil diupload!");
      setUploadDialogOpen(false);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Terjadi kesalahan saat mengupload file");
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    userId: string,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadFile(file, userId);
    }
  };

  const deleteDocument = async (userId: string, documentUrl: string) => {
    try {
      setUploadingFiles((prev) => ({ ...prev, [userId]: true }));

      // Extract file path from URL
      const urlParts = documentUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `documents/${fileName}`;

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from("documents")
        .remove([filePath]);

      if (deleteError) {
        console.error("Delete error:", deleteError);
      }

      // Update user record
      const { error: updateError } = await supabase
        .from("users")
        .update({ skck_url: null })
        .eq("id", userId);

      if (updateError) {
        console.error("Update error:", updateError);
        alert(`Error updating user record: ${updateError.message}`);
        return;
      }

      // Refresh data
      await fetchUsersData();
      alert("Dokumen berhasil dihapus!");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Terjadi kesalahan saat menghapus dokumen");
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "staff_trips":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const PhotoDialog = ({
    photoUrl,
    title,
  }: {
    photoUrl: string | null;
    title: string;
  }) => {
    if (!photoUrl) {
      return (
        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
          <FileImage className="h-6 w-6 text-gray-400" />
        </div>
      );
    }

    return (
      <Dialog>
        <DialogTrigger asChild>
          <img
            src={photoUrl}
            alt={title}
            className="w-12 h-12 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
          />
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={photoUrl}
              alt={title}
              className="max-w-full max-h-96 object-contain rounded"
            />
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const handleNavItemClick = (item: string) => {
    setActiveItem(item);
  };

  // Show loading while checking admin status
  if (isAdmin === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (isAdmin === false) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar onNavItemClick={handleNavItemClick} activeItem={activeItem} />

      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate("/dashboard")}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Users className="h-8 w-8" />
                  Data Users dari Supabase
                </h1>
                <p className="text-muted-foreground mt-1">
                  Menampilkan data pengguna yang tersimpan di database Supabase
                </p>
              </div>
            </div>
            <Button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/auth");
              }}
              variant="destructive"
            >
              Sign Out
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-blue-800">
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">
                  {loading ? "..." : usersData.length}
                </div>
                <p className="text-sm text-blue-600">Dari tabel users</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-red-800">Admin</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-700">
                  {loading
                    ? "..."
                    : usersData.filter((u) => u.role === "admin").length}
                </div>
                <p className="text-sm text-red-600">Role admin</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-green-800">
                  Staff Trips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">
                  {loading
                    ? "..."
                    : usersData.filter((u) => u.role === "staff_trips").length}
                </div>
                <p className="text-sm text-green-600">Role staff_trips</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-purple-800">
                  Dengan Foto
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700">
                  {loading
                    ? "..."
                    : usersData.filter(
                        (u) =>
                          u.selfie_photo_url ||
                          u.ktp_url ||
                          u.sim_url ||
                          u.skck_url,
                      ).length}
                </div>
                <p className="text-sm text-purple-600">
                  Ada selfie/KTP/SIM/SKCK
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <span className="text-red-600">⚠️</span>
                  <span className="font-medium">Error:</span>
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Controls */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter & Kontrol
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Filter berdasarkan Role:
                  </label>
                  <Select value={selectedRole} onValueChange={handleRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        Semua Role ({usersData.length})
                      </SelectItem>
                      <SelectItem value="admin">
                        Admin (
                        {usersData.filter((u) => u.role === "admin").length})
                      </SelectItem>
                      <SelectItem value="staff_trips">
                        Staff Trips (
                        {
                          usersData.filter((u) => u.role === "staff_trips")
                            .length
                        }
                        )
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={fetchUsersData}
                    variant="outline"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                    {loading ? "Loading..." : "Refresh Data"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Daftar Users
                  {selectedRole !== "all" && (
                    <Badge variant="secondary">Filter: {selectedRole}</Badge>
                  )}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  Menampilkan {filteredUsers.length} dari {usersData.length}{" "}
                  users
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <div className="text-lg text-muted-foreground">
                    Memuat data users dari Supabase...
                  </div>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <div className="text-lg text-muted-foreground mb-2">
                    {selectedRole === "all"
                      ? "Tidak ada data user"
                      : `Tidak ada user dengan role ${selectedRole}`}
                  </div>
                  <Button onClick={fetchUsersData} variant="outline">
                    Refresh Data
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Table View for Desktop */}
                  <div className="hidden lg:block">
                    <div className="rounded-lg border overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left p-4 font-semibold">
                              User
                            </th>
                            <th className="text-left p-4 font-semibold">
                              Role
                            </th>
                            <th className="text-left p-4 font-semibold">
                              Kontak
                            </th>
                            <th className="text-left p-4 font-semibold">
                              Dokumen
                            </th>
                            <th className="text-left p-4 font-semibold">
                              Upload
                            </th>
                            <th className="text-left p-4 font-semibold">
                              Terdaftar
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user, index) => (
                            <tr
                              key={user.id}
                              className={`border-t hover:bg-muted/30 transition-colors ${index % 2 === 0 ? "bg-background" : "bg-muted/10"}`}
                            >
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                    {(user.full_name || user.email || "U")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold truncate">
                                      {user.full_name || "Nama tidak tersedia"}
                                    </div>
                                    <div className="text-sm text-muted-foreground truncate">
                                      {user.email || "Email tidak tersedia"}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      ID: {user.id.substring(0, 8)}...
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge className={getRoleColor(user.role)}>
                                  {user.role || "No Role"}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <div className="space-y-1 text-sm">
                                  {user.phone && (
                                    <div className="flex items-center gap-1">
                                      <span>📞</span>
                                      <span className="truncate max-w-32">
                                        {user.phone}
                                      </span>
                                    </div>
                                  )}
                                  {user.address && (
                                    <div className="flex items-center gap-1">
                                      <span>📍</span>
                                      <span
                                        className="truncate max-w-32"
                                        title={user.address}
                                      >
                                        {user.address}
                                      </span>
                                    </div>
                                  )}
                                  {!user.phone && !user.address && (
                                    <span className="text-muted-foreground text-xs">
                                      -
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <PhotoDialog
                                    photoUrl={user.selfie_photo_url}
                                    title="Foto Selfie"
                                  />
                                  <PhotoDialog
                                    photoUrl={user.ktp_url}
                                    title="Foto KTP"
                                  />
                                  <PhotoDialog
                                    photoUrl={user.sim_url}
                                    title="Foto SIM"
                                  />
                                  <PhotoDialog
                                    photoUrl={user.skck_url}
                                    title="Foto SKCK"
                                  />
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex gap-2">
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    onChange={(e) =>
                                      handleFileSelect(e, user.id)
                                    }
                                    className="hidden"
                                    id={`file-upload-${user.id}`}
                                    disabled={uploadingFiles[user.id]}
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      document
                                        .getElementById(
                                          `file-upload-${user.id}`,
                                        )
                                        ?.click()
                                    }
                                    disabled={uploadingFiles[user.id]}
                                    className="flex items-center gap-1"
                                  >
                                    {uploadingFiles[user.id] ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                    ) : (
                                      <Upload className="h-3 w-3" />
                                    )}
                                    Upload
                                  </Button>
                                  {user.skck_url && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() =>
                                        deleteDocument(user.id, user.skck_url!)
                                      }
                                      disabled={uploadingFiles[user.id]}
                                      className="flex items-center gap-1"
                                    >
                                      <X className="h-3 w-3" />
                                      Hapus SKCK
                                    </Button>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="text-sm">
                                  {user.created_at ? (
                                    <div>
                                      <div className="font-medium">
                                        {new Date(
                                          user.created_at,
                                        ).toLocaleDateString("id-ID", {
                                          day: "2-digit",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {new Date(
                                          user.created_at,
                                        ).toLocaleTimeString("id-ID", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-muted-foreground">
                                      -
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Card View for Mobile/Tablet */}
                  <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredUsers.map((user) => (
                      <Card
                        key={user.id}
                        className="hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
                      >
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* User Info */}
                            <div className="flex items-start gap-4">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                                {(user.full_name || user.email || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold truncate">
                                  {user.full_name || "Nama tidak tersedia"}
                                </h3>
                                <p className="text-sm text-muted-foreground truncate">
                                  {user.email || "Email tidak tersedia"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {user.id.substring(0, 8)}...
                                </p>
                                <div className="mt-2">
                                  <Badge className={getRoleColor(user.role)}>
                                    {user.role || "No Role"}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Photos Section */}
                            <div className="space-y-3">
                              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <FileImage className="h-4 w-4" />
                                Dokumen & Foto:
                              </div>
                              <div className="flex gap-4 justify-center">
                                <div className="text-center">
                                  <PhotoDialog
                                    photoUrl={user.selfie_photo_url}
                                    title="Foto Selfie"
                                  />
                                  <div className="text-xs mt-2 font-medium">
                                    Selfie
                                  </div>
                                </div>
                                <div className="text-center">
                                  <PhotoDialog
                                    photoUrl={user.ktp_url}
                                    title="Foto KTP"
                                  />
                                  <div className="text-xs mt-2 font-medium">
                                    KTP
                                  </div>
                                </div>
                                <div className="text-center">
                                  <PhotoDialog
                                    photoUrl={user.sim_url}
                                    title="Foto SIM"
                                  />
                                  <div className="text-xs mt-2 font-medium">
                                    SIM
                                  </div>
                                </div>
                                <div className="text-center">
                                  <PhotoDialog
                                    photoUrl={user.skck_url}
                                    title="Foto SKCK"
                                  />
                                  <div className="text-xs mt-2 font-medium">
                                    SKCK
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Upload Section */}
                            <div className="space-y-3 pt-3 border-t">
                              <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Upload className="h-4 w-4" />
                                Upload Dokumen:
                              </div>
                              <div className="flex gap-2 justify-center">
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png"
                                  onChange={(e) => handleFileSelect(e, user.id)}
                                  className="hidden"
                                  id={`file-upload-mobile-${user.id}`}
                                  disabled={uploadingFiles[user.id]}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    document
                                      .getElementById(
                                        `file-upload-mobile-${user.id}`,
                                      )
                                      ?.click()
                                  }
                                  disabled={uploadingFiles[user.id]}
                                  className="flex items-center gap-1"
                                >
                                  {uploadingFiles[user.id] ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                                  ) : (
                                    <Upload className="h-3 w-3" />
                                  )}
                                  Upload JPEG/PNG
                                </Button>
                                {user.skck_url && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      deleteDocument(user.id, user.skck_url!)
                                    }
                                    disabled={uploadingFiles[user.id]}
                                    className="flex items-center gap-1"
                                  >
                                    <X className="h-3 w-3" />
                                    Hapus SKCK
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Additional Info */}
                            {(user.phone || user.address) && (
                              <div className="text-sm text-muted-foreground space-y-2 pt-3 border-t">
                                {user.phone && (
                                  <div className="flex items-center gap-2">
                                    <span>📞</span>
                                    <span className="truncate">
                                      {user.phone}
                                    </span>
                                  </div>
                                )}
                                {user.address && (
                                  <div className="flex items-center gap-2">
                                    <span>📍</span>
                                    <span className="truncate">
                                      {user.address}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Created Date */}
                            {user.created_at && (
                              <div className="text-sm text-muted-foreground pt-3 border-t">
                                <strong>Terdaftar:</strong>{" "}
                                {new Date(user.created_at).toLocaleDateString(
                                  "id-ID",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;
