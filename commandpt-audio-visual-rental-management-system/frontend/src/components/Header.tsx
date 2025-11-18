import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Menu, X, LogOut, User, ChevronDown, Download } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

type Page = 'dashboard' | 'inventory' | 'quotes' | 'clients' | 'venues' | 'calendar' | 'prep' | 'vendors' | 'pull' | 'costs' | 'export';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const { clear, identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [operationsOpen, setOperationsOpen] = useState(false);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const navItems: { label: string; page: Page }[] = [
    { label: 'Dashboard', page: 'dashboard' },
    { label: 'Inventory', page: 'inventory' },
    { label: 'Quotes', page: 'quotes' },
    { label: 'Clients', page: 'clients' },
    { label: 'Venues', page: 'venues' },
    { label: 'Calendar', page: 'calendar' },
  ];

  const operationsItems: { label: string; page: Page }[] = [
    { label: 'Prep', page: 'prep' },
    { label: 'Vendors', page: 'vendors' },
    { label: 'Pull', page: 'pull' },
    { label: 'Costs', page: 'costs' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img
                src="/assets/pt_icon-red-transparent.png"
                alt="CommandPT"
                className="h-10 w-10"
              />
              <h1 className="text-xl font-bold text-primary">CommandPT</h1>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <Button
                  key={item.page}
                  variant={currentPage === item.page ? 'default' : 'ghost'}
                  onClick={() => onNavigate(item.page)}
                  className={currentPage === item.page ? 'bg-primary text-white' : ''}
                >
                  {item.label}
                </Button>
              ))}

              <DropdownMenu open={operationsOpen} onOpenChange={setOperationsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={['prep', 'vendors', 'pull', 'costs'].includes(currentPage) ? 'default' : 'ghost'}
                    className={['prep', 'vendors', 'pull', 'costs'].includes(currentPage) ? 'bg-primary text-white' : ''}
                  >
                    Operations
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {operationsItems.map((item) => (
                    <DropdownMenuItem
                      key={item.page}
                      onClick={() => {
                        onNavigate(item.page);
                        setOperationsOpen(false);
                      }}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate('export')}
              className="hidden md:flex"
              title="Code Export"
            >
              <Download className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {identity && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden md:inline">
                      {userProfile?.name || 'User'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>
                    <User className="mr-2 h-4 w-4" />
                    {userProfile?.name || 'User'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="lg:hidden border-t border-border/40 py-4">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Button
                  key={item.page}
                  variant={currentPage === item.page ? 'default' : 'ghost'}
                  onClick={() => {
                    onNavigate(item.page);
                    setMobileMenuOpen(false);
                  }}
                  className={`justify-start ${currentPage === item.page ? 'bg-primary text-white' : ''}`}
                >
                  {item.label}
                </Button>
              ))}

              <div className="my-2 border-t border-border/40" />
              <p className="px-3 text-sm font-semibold text-muted-foreground">Operations</p>
              {operationsItems.map((item) => (
                <Button
                  key={item.page}
                  variant={currentPage === item.page ? 'default' : 'ghost'}
                  onClick={() => {
                    onNavigate(item.page);
                    setMobileMenuOpen(false);
                  }}
                  className={`justify-start ${currentPage === item.page ? 'bg-primary text-white' : ''}`}
                >
                  {item.label}
                </Button>
              ))}

              <div className="my-2 border-t border-border/40" />
              <Button
                variant="ghost"
                onClick={() => {
                  onNavigate('export');
                  setMobileMenuOpen(false);
                }}
                className="justify-start"
              >
                <Download className="mr-2 h-4 w-4" />
                Code Export
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
