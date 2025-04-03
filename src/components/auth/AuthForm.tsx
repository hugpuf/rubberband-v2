
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
    <Card className="w-full max-w-md shadow-sm border-0 bg-white rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-center text-2xl font-medium text-gray-800">Rubberband OS</CardTitle>
        <CardDescription className="text-center text-gray-500">Enterprise resource planning, reimagined.</CardDescription>
      </CardHeader>
      <Tabs 
        defaultValue="login" 
        className="w-full"
        value={activeTab}
        onValueChange={handleTabChange}
      >
        <TabsList className="grid w-full grid-cols-2 mb-4 p-1 bg-gray-100 rounded-full">
          <TabsTrigger 
            value="login" 
            className="rounded-full px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-800 transition-all"
          >
            Login
          </TabsTrigger>
          <TabsTrigger 
            value="signup" 
            className="rounded-full px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-800 transition-all"
          >
            Create Account
          </TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-normal">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  className="rounded-xl px-4 py-3 border-gray-200 focus:ring-gray-200 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-normal">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="rounded-xl px-4 py-3 border-gray-200 focus:ring-gray-200 transition-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={togglePasswordVisibility}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 hover:bg-transparent"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button 
                type="submit" 
                className="w-full rounded-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-6" 
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
                <Label htmlFor="signup-email" className="text-gray-700 font-normal">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                  className="rounded-xl px-4 py-3 border-gray-200 focus:ring-gray-200 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-gray-700 font-normal">Password</Label>
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
                    className="rounded-xl px-4 py-3 border-gray-200 focus:ring-gray-200 transition-all"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={togglePasswordVisibility}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 hover:bg-transparent"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-name" className="text-gray-700 font-normal">Organization Name</Label>
                <Input
                  id="org-name"
                  type="text"
                  placeholder="Acme Inc."
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="rounded-xl px-4 py-3 border-gray-200 focus:ring-gray-200 transition-all"
                />
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Button 
                type="submit" 
                className="w-full rounded-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-6" 
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
