import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

type AuthFormProps = {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string, orgName: string) => Promise<void>;
  isLoading: boolean;
};

export function AuthForm({ onLogin, onSignUp, isLoading }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields",
      });
      return;
    }
    
    console.log("Login submitted for:", email);
    try {
      await onLogin(email, password);
    } catch (error) {
      // Error is handled in the parent component
      console.error("Login error in form:", error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !orgName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all fields",
      });
      return;
    }
    
    console.log("Signup submitted for:", email, "org:", orgName);
    try {
      await onSignUp(email, password, orgName);
    } catch (error) {
      // Error is handled in the parent component
      console.error("Signup error in form:", error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Clear form fields when switching tabs to prevent data leakage between forms
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setEmail("");
    setPassword("");
    setOrgName("");
  };

  return (
    <Card className="w-full max-w-md shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-0 bg-white rounded-2xl overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-2xl font-semibold text-[#1C1C1E]">Rubberband OS</CardTitle>
        <CardDescription className="text-center text-[#636366]">Enterprise resource planning, reimagined.</CardDescription>
      </CardHeader>
      <Tabs 
        defaultValue="login" 
        className="w-full"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <div className="flex justify-center px-6 mb-6">
          <TabsList className="grid w-[80%] grid-cols-2 bg-[#F5F5F7] rounded-full p-0.5">
            <TabsTrigger 
              value="login" 
              className="rounded-full text-sm px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#1C1C1E] transition-all"
            >
              Login
            </TabsTrigger>
            <TabsTrigger 
              value="signup" 
              className="rounded-full text-sm px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#1C1C1E] transition-all"
            >
              Create Account
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#3A3A3C] font-normal">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  className="apple-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#3A3A3C] font-normal">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="apple-input pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={togglePasswordVisibility}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#3A3A3C] hover:bg-transparent"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button 
                type="submit" 
                className="w-full apple-button apple-button-primary py-6" 
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
        <TabsContent value="signup">
          <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-[#3A3A3C] font-normal">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  className="apple-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-[#3A3A3C] font-normal">Password</Label>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                    minLength={6}
                    className="apple-input pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={togglePasswordVisibility}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-[#8E8E93] hover:text-[#3A3A3C] hover:bg-transparent"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-name" className="text-[#3A3A3C] font-normal">Organization Name</Label>
                <Input
                  id="org-name"
                  type="text"
                  placeholder="Acme Inc."
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="apple-input"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button 
                type="submit" 
                className="w-full apple-button apple-button-primary py-6" 
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
