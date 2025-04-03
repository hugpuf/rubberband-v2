
import { useState } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchParams, Link } from "react-router-dom";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get("token");
  const invitationEmail = searchParams.get("email");
  const isInvitation = searchParams.get("invitation");

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </CardTitle>
          <CardDescription>
            {isLogin
              ? "Enter your email and password to sign in"
              : "Enter your details to create a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm 
            isLogin={isLogin} 
            invitationToken={invitationToken}
            invitationEmail={invitationEmail}
            isInvitation={isInvitation === "true"}
          />
        </CardContent>
        <CardFooter>
          <div className="w-full text-center">
            {isLogin ? (
              <div className="text-sm">
                Don't have an account?{" "}
                <Button variant="link" className="p-0" onClick={toggleAuthMode}>
                  Sign up
                </Button>
              </div>
            ) : (
              <div className="text-sm">
                Already have an account?{" "}
                <Button variant="link" className="p-0" onClick={toggleAuthMode}>
                  Sign in
                </Button>
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
