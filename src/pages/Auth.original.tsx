
import { useState } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "react-router-dom";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get("token");
  const invitationEmail = searchParams.get("email");
  const isInvitation = searchParams.get("invitation") === "true";
  const { signIn, signUp, isLoading } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log("Auth.original: handleLogin called with email:", email);
      await signIn(email, password);
    } catch (error) {
      console.error("Login error in Auth.original component:", error);
      // Error is handled in the useAuth hook and displayed in the UI
    }
  };

  const handleSignUp = async (email: string, password: string, orgName: string) => {
    try {
      console.log("Auth.original: handleSignUp called with email:", email, "org:", orgName);
      await signUp(email, password, orgName);
    } catch (error) {
      console.error("Sign up error in Auth.original component:", error);
      // Error is handled in the useAuth hook and displayed in the UI
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <AuthForm 
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Auth;
