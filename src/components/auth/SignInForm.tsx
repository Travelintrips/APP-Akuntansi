import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import supabase from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const signInSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
});

type SignInFormValues = z.infer<typeof signInSchema>;

interface SignInFormProps {
  onSubmit?: (values: SignInFormValues) => void;
  isLoading?: boolean;
  error?: string | null;
  isStoryboard?: boolean;
}

const SignInForm = ({
  onSubmit = () => {},
  isLoading = false,
  error = null,
  isStoryboard = false,
}: SignInFormProps) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [storyboardError, setStoryboardError] = useState<string | null>(null);
  const [storyboardLoading, setStoryboardLoading] = useState(false);

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: isStoryboard ? "admin@contoh.com" : "",
      password: isStoryboard ? "123456" : "",
    },
  });

  const handleSubmit = async (values: SignInFormValues) => {
    if (isStoryboard) {
      setStoryboardLoading(true);
      setStoryboardError(null);

      try {
        // Sign in with Supabase directly in storyboard mode
        const { data, error } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password,
        });

        if (error) {
          throw error;
        }

        // In storyboard mode, just show success
        alert("Successfully signed in (storyboard mode)");
      } catch (err: any) {
        setStoryboardError(err.message || "Failed to sign in");
      } finally {
        setStoryboardLoading(false);
      }
    } else {
      // Normal mode - use the provided onSubmit handler
      onSubmit(values);
    }
  };

  // Use the appropriate loading and error states based on mode
  const displayLoading = isStoryboard ? storyboardLoading : isLoading;
  const displayError = isStoryboard ? storyboardError : error;

  return (
    <div className="w-full space-y-6 bg-white p-6 rounded-lg shadow-sm">
      {displayError && (
        <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm">
          {displayError}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                      placeholder="email@example.com"
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

          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={displayLoading}>
              {displayLoading ? "Signing in..." : "Sign In"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SignInForm;
