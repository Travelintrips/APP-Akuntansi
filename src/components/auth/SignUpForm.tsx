import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import supabase from "@/lib/supabase";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const signUpFormSchema = z.object({
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

type SignUpFormValues = z.infer<typeof signUpFormSchema>;

interface SignUpFormProps {
  onSubmit?: (values: SignUpFormValues) => void;
  isLoading?: boolean;
  isStoryboard?: boolean;
  onSwitchToSignIn?: () => void;
}

const SignUpForm = ({
  onSubmit = () => {},
  isLoading = false,
  isStoryboard = false,
  onSwitchToSignIn = () => {},
}: SignUpFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [storyboardError, setStoryboardError] = useState<string | null>(null);
  const [storyboardLoading, setStoryboardLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (values: SignUpFormValues) => {
    if (isStoryboard) {
      setStoryboardLoading(true);
      setStoryboardError(null);
      setSuccessMessage(null);

      try {
        // Sign up with Supabase directly in storyboard mode
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

        // In storyboard mode, show success message and switch to sign in
        setSuccessMessage("Account created successfully! Please sign in.");
        setTimeout(() => {
          onSwitchToSignIn();
        }, 2000);
      } catch (err: any) {
        setStoryboardError(err.message || "Failed to create account");
      } finally {
        setStoryboardLoading(false);
      }
    } else {
      // Normal mode - use the provided onSubmit handler
      onSubmit(values);
    }
  };

  // Use the appropriate loading state based on mode
  const displayLoading = isStoryboard ? storyboardLoading : isLoading;

  return (
    <div className="w-full space-y-6 bg-white p-6 rounded-lg shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your information below to create your account
        </p>
      </div>

      {storyboardError && isStoryboard && (
        <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm">
          {storyboardError}
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-md bg-green-100 text-green-800 text-sm">
          {successMessage}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      className="pl-10"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      className="pl-10"
                      {...field}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••"
                      className="pl-10"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={displayLoading}>
            {displayLoading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default SignUpForm;
