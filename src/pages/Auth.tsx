import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'shop_owner' | 'customer'>('customer');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isForgotPassword) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        
        if (error) throw error;
        
        toast({
          title: "Reset email sent",
          description: "Check your email for password reset instructions.",
        });
        setIsForgotPassword(false);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } else if (isLogin) {
      await signIn(email, password);
    } else {
      await signUp(email, password, role, name);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isForgotPassword ? 'Reset Password' : (isLogin ? 'Sign In' : 'Create Account')}
          </CardTitle>
          <CardDescription>
            {isForgotPassword 
              ? 'Enter your email to receive reset instructions'
              : (isLogin 
                ? 'Enter your credentials to access your account' 
                : 'Choose your role and create a new account')
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !isForgotPassword && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    required={!isLogin}
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>I am a:</Label>
                  <RadioGroup value={role} onValueChange={(value: 'shop_owner' | 'customer') => setRole(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="customer" id="customer" />
                      <Label htmlFor="customer">Customer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="shop_owner" id="shop_owner" />
                      <Label htmlFor="shop_owner">Shop Owner</Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
            
            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
            )}
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Please wait...' : (isForgotPassword ? 'Send Reset Email' : (isLogin ? 'Sign In' : 'Create Account'))}
            </Button>
          </form>
          
          <div className="mt-4 text-center space-y-2">
            {!isForgotPassword && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary"
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </Button>
                
                {isLogin && (
                  <div>
                    <Button
                      variant="ghost"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-primary text-sm"
                    >
                      Forgot your password?
                    </Button>
                  </div>
                )}
              </>
            )}
            
            {isForgotPassword && (
              <Button
                variant="ghost"
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsLogin(true);
                }}
                className="text-primary"
              >
                Back to sign in
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}