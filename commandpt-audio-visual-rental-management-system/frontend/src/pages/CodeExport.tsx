import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileCode, Folder, Package, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function CodeExport() {
  const handleExportInstructions = () => {
    const instructions = `# CommandPT Codebase Export Instructions

## Overview
CommandPT Version 25 - Audio Visual Rental Management System

## Manual Export Process

### 1. Backend Files (Motoko)
Location: \`backend/\`
- \`backend/main.mo\` - Main backend canister with all business logic
- \`backend/authorization/access-control.mo\` - Authorization system
- \`backend/blob-storage/\` - Blob storage components

### 2. Frontend Files (React + TypeScript)
Location: \`frontend/src/\`

#### Core Application Files:
- \`App.tsx\` - Main application component
- \`main.tsx\` - Application entry point
- \`config.ts\` - Application configuration
- \`index.css\` - Global styles with OKLCH color system

#### Pages:
- \`pages/Dashboard.tsx\` - Dashboard with statistics
- \`pages/Inventory.tsx\` - Inventory management
- \`pages/Quotes.tsx\` - Quote management
- \`pages/Clients.tsx\` - Client management
- \`pages/Venues.tsx\` - Venue management
- \`pages/Calendar.tsx\` - Booking calendar
- \`pages/Prep.tsx\` - Operations prep page
- \`pages/Vendors.tsx\` - Vendor management
- \`pages/Pull.tsx\` - Equipment pull page
- \`pages/Costs.tsx\` - Cost management

#### Components:
- \`components/Header.tsx\` - Application header
- \`components/Footer.tsx\` - Application footer
- \`components/ProfileSetupDialog.tsx\` - User profile setup
- \`components/AccessDeniedScreen.tsx\` - Login screen
- \`components/CatalogItemDialog.tsx\` - Catalog item form
- \`components/AssetUnitsDialog.tsx\` - Asset units management
- \`components/ClientDialog.tsx\` - Client form
- \`components/QuoteDialog.tsx\` - Quote form
- \`components/VenueDialog.tsx\` - Venue form
- \`components/VendorDialog.tsx\` - Vendor form
- \`components/CsvImportDialog.tsx\` - CSV import
- \`components/ui/\` - Shadcn UI components (read-only)

#### Hooks:
- \`hooks/useActor.ts\` - Backend actor initialization
- \`hooks/useInternetIdentity.ts\` - Internet Identity provider
- \`hooks/useQueries.ts\` - React Query hooks for backend operations

#### Types:
- \`backend.d.ts\` - TypeScript interface for backend

### 3. Configuration Files
- \`frontend/package.json\` - Frontend dependencies
- \`frontend/tailwind.config.js\` - Tailwind configuration
- \`frontend/vite.config.ts\` - Vite configuration
- \`frontend/tsconfig.json\` - TypeScript configuration
- \`frontend/postcss.config.js\` - PostCSS configuration
- \`dfx.json\` - Internet Computer configuration

### 4. Static Assets
Location: \`frontend/public/assets/\`
- \`pt_icon-red-transparent.png\` - CommandPT icon logo
- \`pt_full-red-whiteback.png\` - CommandPT full logo
- \`generated/\` - Generated assets (icons, images)

### 5. Export Steps

1. **Clone or download the project repository**
2. **Ensure all dependencies are installed:**
   \`\`\`bash
   cd frontend
   npm install
   \`\`\`

3. **Build the project:**
   \`\`\`bash
   npm run build
   \`\`\`

4. **Deploy to Internet Computer:**
   \`\`\`bash
   dfx deploy
   \`\`\`

### 6. Key Features Included
- Two-tier inventory system (catalog items + asset units)
- Quote management with subsections and tax controls
- Venue and client management
- Operations management (Prep, Pull, Vendors, Costs)
- Booking calendar
- CSV import/export functionality
- PDF generation for quotes and reports
- Internet Identity authentication
- Role-based access control
- Dark/light theme support

### 7. Technology Stack
- **Frontend:** React 19, TypeScript, TailwindCSS, Shadcn/UI
- **Backend:** Motoko on Internet Computer
- **State Management:** React Query (TanStack Query)
- **Authentication:** Internet Identity
- **Styling:** OKLCH color system with CommandPT red branding

### 8. Version Information
- **Version:** CommandPT Version 25
- **Build Date:** ${new Date().toLocaleDateString()}
- **Language:** English
- **Theme:** Neutral black/white with CommandPT red accents

## Notes
- All source code is production-ready
- Includes comprehensive error handling
- Responsive design for desktop and mobile
- Accessibility-compliant color contrast
- Organization-wide quote visibility
- Proper data persistence and validation

For deployment instructions, refer to the Internet Computer documentation at https://internetcomputer.org/docs
`;

    const blob = new Blob([instructions], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'CommandPT_Export_Instructions.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const codebaseStructure = [
    {
      category: 'Backend (Motoko)',
      icon: <FileCode className="h-5 w-5 text-primary" />,
      files: [
        'backend/main.mo - Main canister logic',
        'backend/authorization/ - Access control',
        'backend/blob-storage/ - File storage',
      ],
    },
    {
      category: 'Frontend Core',
      icon: <Package className="h-5 w-5 text-primary" />,
      files: [
        'frontend/src/App.tsx - Main application',
        'frontend/src/main.tsx - Entry point',
        'frontend/src/index.css - Global styles',
        'frontend/src/backend.d.ts - Type definitions',
      ],
    },
    {
      category: 'Pages (10)',
      icon: <Folder className="h-5 w-5 text-primary" />,
      files: [
        'Dashboard, Inventory, Quotes, Clients',
        'Venues, Calendar, Prep, Vendors',
        'Pull, Costs',
      ],
    },
    {
      category: 'Components (15+)',
      icon: <Folder className="h-5 w-5 text-primary" />,
      files: [
        'Header, Footer, Dialogs',
        'Forms, Tables, Cards',
        'Shadcn UI components (30+)',
      ],
    },
    {
      category: 'Configuration',
      icon: <FileCode className="h-5 w-5 text-primary" />,
      files: [
        'package.json - Dependencies',
        'tailwind.config.js - Styling',
        'vite.config.ts - Build config',
        'dfx.json - IC config',
      ],
    },
    {
      category: 'Assets',
      icon: <Folder className="h-5 w-5 text-primary" />,
      files: [
        'CommandPT logos (2 variants)',
        'Generated icons (14 files)',
        'Hero images and graphics',
      ],
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Code Export</h1>
        <p className="text-muted-foreground mt-1">CommandPT Version 25 - Complete Codebase Information</p>
      </div>

      <Alert className="border-primary/30 bg-primary/5">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary">Export Information</AlertTitle>
        <AlertDescription>
          This page provides comprehensive information about the CommandPT codebase structure and manual export instructions.
          Download the instructions file below for detailed export steps.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/30 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Package className="h-5 w-5" />
              Codebase Overview
            </CardTitle>
            <CardDescription>Complete application structure and components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-primary">50+</p>
                <p className="text-xs text-muted-foreground">Source Files</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-primary">10</p>
                <p className="text-xs text-muted-foreground">Main Pages</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-primary">45+</p>
                <p className="text-xs text-muted-foreground">Components</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-primary">18</p>
                <p className="text-xs text-muted-foreground">Assets</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Version</span>
                <Badge variant="default">Version 25</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Language</span>
                <Badge variant="outline">English</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Production Ready
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-card/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Actions
            </CardTitle>
            <CardDescription>Download codebase information and instructions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleExportInstructions}
              className="w-full bg-primary hover:bg-primary/90 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Export Instructions
            </Button>
            <p className="text-xs text-muted-foreground">
              Downloads a comprehensive markdown file with detailed export instructions, file structure, and deployment steps.
            </p>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Included in Instructions:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Complete file structure and locations</li>
                <li>Step-by-step export process</li>
                <li>Build and deployment commands</li>
                <li>Technology stack details</li>
                <li>Feature list and capabilities</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/30 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-primary">Codebase Structure</CardTitle>
          <CardDescription>Detailed breakdown of all application components</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {codebaseStructure.map((section, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center gap-2">
                  {section.icon}
                  <h3 className="font-semibold text-foreground">{section.category}</h3>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {section.files.map((file, fileIndex) => (
                    <li key={fileIndex} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{file}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-primary">Technology Stack</CardTitle>
          <CardDescription>Core technologies and frameworks used in CommandPT</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Frontend</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Framework</span>
                  <Badge variant="outline">React 19</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Language</span>
                  <Badge variant="outline">TypeScript</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Styling</span>
                  <Badge variant="outline">TailwindCSS</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">UI Components</span>
                  <Badge variant="outline">Shadcn/UI</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">State Management</span>
                  <Badge variant="outline">React Query</Badge>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Backend & Infrastructure</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Language</span>
                  <Badge variant="outline">Motoko</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Platform</span>
                  <Badge variant="outline">Internet Computer</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Authentication</span>
                  <Badge variant="outline">Internet Identity</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Storage</span>
                  <Badge variant="outline">Blob Storage</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Access Control</span>
                  <Badge variant="outline">Role-Based</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-card/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-primary">Key Features</CardTitle>
          <CardDescription>Complete feature set included in CommandPT Version 25</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              'Two-tier inventory system',
              'Catalog items & asset units',
              'Quote management with sections',
              'Per-section tax controls',
              'Venue management',
              'Client management',
              'Booking calendar',
              'Operations prep page',
              'Vendor management',
              'Equipment pull workflow',
              'Cost tracking & margins',
              'CSV import/export',
              'PDF generation',
              'Barcode scanning',
              'Subrental management',
              'Internet Identity auth',
              'Role-based access control',
              'Dark/light theme support',
              'Responsive design',
              'OKLCH color system',
              'CommandPT branding',
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
