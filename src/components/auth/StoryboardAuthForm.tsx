import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SignInForm from "./SignInForm";
import SignUpForm from "./SignUpForm";

interface StoryboardAuthFormProps {
  defaultTab?: "signin" | "signup";
}

const StoryboardAuthForm = ({
  defaultTab = "signin",
}: StoryboardAuthFormProps) => {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);
  const [error, setError] = useState<string | null>(null);

  const handleSignUpSuccess = () => {
    setActiveTab("signin");
  };

  return (
    <div className="w-full max-w-md mx-auto bg-background p-6 rounded-xl shadow-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to your account or create a new one
        </p>
      </div>

      <Tabs
        defaultValue={activeTab}
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "signin" | "signup")}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-full mb-6">
          <TabsTrigger value="signin">Sign In</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>

        <TabsContent value="signin">
          <SignInForm isStoryboard={true} error={error} />
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
            isStoryboard={true}
            onSwitchToSignIn={handleSignUpSuccess}
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

export default StoryboardAuthForm;
