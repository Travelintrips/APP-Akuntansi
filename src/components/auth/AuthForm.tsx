import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";
import { useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";

interface AuthFormProps {
  defaultTab?: "signin" | "signup";
  onAuthSuccess?: () => void;
}

const AuthForm = ({
  defaultTab = "signin",
  onAuthSuccess = () => {},
}: AuthFormProps) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignIn = async (values: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        throw error;
      }

      // Handle successful sign in
      setSuccessMessage("Sign in successful! Redirecting...");
      setTimeout(() => {
        onAuthSuccess();
        navigate("/dashboard");
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (values: {
    fullName: string;
    email: string;
    password: string;
  }) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }

      // Handle successful sign up
      setSuccessMessage("Account created successfully! Please sign in.");
      setTimeout(() => {
        setActiveTab("signin");
        setSuccessMessage(null);
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-background p-6 rounded-xl shadow-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to your account or create a new one
        </p>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 rounded-md bg-green-100 text-green-800 text-sm">
          {successMessage}
        </div>
      )}

      <Tabs
        defaultValue={activeTab}
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as "signin" | "signup");
          setError(null);
          setSuccessMessage(null);
        }}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-full mb-6">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <SignInForm
            onSubmit={handleSignIn}
            isLoading={isLoading}
            error={error}
          />
          <div className="mt-4 text-center text-sm">
            <p className="text-muted-foreground">
              Don't have an account?{" "}
              <button
                onClick={() => setActiveTab("signup")}
                className="text-primary hover:underline font-medium"
              >
                Sign Up
              </button>
            </p>
          </div>
        </TabsContent>

        <TabsContent value="signup">
          <SignUpForm
            onSubmit={handleSignUp}
            isLoading={isLoading}
            onSwitchToSignIn={() => setActiveTab("signin")}
          />
          <div className="mt-4 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <button
                onClick={() => setActiveTab("signin")}
                className="text-primary hover:underline font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuthForm;
