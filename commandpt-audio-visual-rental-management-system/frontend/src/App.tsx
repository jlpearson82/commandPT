import { useState, useEffect } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from './hooks/useQueries';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Quotes from './pages/Quotes';
import Clients from './pages/Clients';
import Venues from './pages/Venues';
import Calendar from './pages/Calendar';
import Prep from './pages/Prep';
import Vendors from './pages/Vendors';
import Pull from './pages/Pull';
import Costs from './pages/Costs';
import CodeExport from './pages/CodeExport';
import ProfileSetupDialog from './components/ProfileSetupDialog';
import AccessDeniedScreen from './components/AccessDeniedScreen';

type Page = 'dashboard' | 'inventory' | 'quotes' | 'clients' | 'venues' | 'calendar' | 'prep' | 'vendors' | 'pull' | 'costs' | 'export';

export default function App() {
  const { identity, loginStatus } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  const isAuthenticated = !!identity;
  const isInitializing = loginStatus === 'initializing';

  useEffect(() => {
    if (isAuthenticated && !profileLoading && isFetched && userProfile === null) {
      setShowProfileSetup(true);
    } else {
      setShowProfileSetup(false);
    }
  }, [isAuthenticated, profileLoading, isFetched, userProfile]);

  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Initializing CommandPT...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AccessDeniedScreen />
        <Toaster />
      </ThemeProvider>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <Inventory />;
      case 'quotes':
        return <Quotes />;
      case 'clients':
        return <Clients />;
      case 'venues':
        return <Venues />;
      case 'calendar':
        return <Calendar />;
      case 'prep':
        return <Prep />;
      case 'vendors':
        return <Vendors />;
      case 'pull':
        return <Pull />;
      case 'costs':
        return <Costs />;
      case 'export':
        return <CodeExport />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col bg-background">
        <Header currentPage={currentPage} onNavigate={setCurrentPage} />
        <main className="flex-1 container mx-auto px-4 py-8">
          {renderPage()}
        </main>
        <Footer />
        <ProfileSetupDialog open={showProfileSetup} onOpenChange={setShowProfileSetup} />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}
