
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const { signIn, signUp, isLoading } = useAuth();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-rubberband-dark to-rubberband-secondary p-4">
      <div className="w-full max-w-md">
        <AuthForm onLogin={signIn} onSignUp={signUp} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default Auth;
