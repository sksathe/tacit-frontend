import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/Header";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, login, signUp, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If already logged in (e.g. back button or direct visit), go to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">{authLoading ? "Loading..." : "Redirecting..."}</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        toast({
          title: "Account created!",
          description: "Your account has been created successfully. Contact an admin to get access to organizations and projects.",
        });
        // If email confirmation is disabled, user is automatically logged in
        // Check if we have a session (user will be set in AuthContext)
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        await login(email, password);
        toast({
          title: "Welcome back!",
          description: "You've been successfully logged in.",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error('❌ Authentication error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to authenticate. Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex items-center justify-center px-4 py-16 lg:py-24">
        <Card className="w-full max-w-md rounded-2xl border-border/60 bg-card/85 shadow-elegant backdrop-blur-sm">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="text-center text-3xl font-bold tracking-tight">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription className="text-center text-sm leading-relaxed">
              {isSignUp
                ? "Sign up to start capturing knowledge"
                : "Sign in to your Tacit account"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2.5">
                <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 rounded-lg"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                  className="h-11 rounded-lg"
                />
              </div>
              <Button
                type="submit"
                className="h-11 w-full rounded-lg bg-gradient-primary font-semibold"
                disabled={isLoading}
              >
                {isLoading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
              </Button>
            </form>
            <div className="border-t border-border/60 pt-4 text-center text-sm">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="font-semibold text-primary transition-smooth hover:text-primary-glow"
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
