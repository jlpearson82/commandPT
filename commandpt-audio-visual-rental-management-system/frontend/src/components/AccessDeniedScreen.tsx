import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, DollarSign, Users, Calendar, Shield } from 'lucide-react';

export default function AccessDeniedScreen() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-6rem)]">
          <div className="w-full max-w-5xl space-y-8">
            {/* Header with Logo */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-3 mb-6">
                <img 
                  src="/assets/pt_icon-red-transparent.png" 
                  alt="CommandPT" 
                  className="h-20 w-20 object-contain drop-shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                />
                <div className="text-left">
                  <h1 className="text-3xl font-bold text-primary">CommandPT</h1>
                </div>
              </div>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Professional audio visual equipment rental management for your business
              </p>
            </div>

            {/* Login Card */}
            <Card className="max-w-md mx-auto border-2 border-border/60 shadow-2xl shadow-primary/10 bg-card/95 backdrop-blur">
              <CardHeader className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2 ring-2 ring-primary/20">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl text-primary">Welcome to CommandPT</CardTitle>
                <CardDescription>
                  Sign in to access your rental management dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  size="lg"
                  className="w-full font-semibold shadow-lg hover:shadow-glow transition-all"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Secure authentication powered by Internet Identity
                </p>
              </CardContent>
            </Card>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
              <Card className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10 bg-card/80 backdrop-blur">
                <CardHeader className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-primary">Inventory Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track equipment, quantities, locations, and availability status in real-time
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10 bg-card/80 backdrop-blur">
                <CardHeader className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-primary">Quote System</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Create professional quotes with automatic calculations and tracking
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10 bg-card/80 backdrop-blur">
                <CardHeader className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-primary">Client Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Maintain client information and view complete rental history
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10 bg-card/80 backdrop-blur">
                <CardHeader className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg text-primary">Booking Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Visual calendar view of scheduled rentals and equipment availability
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
