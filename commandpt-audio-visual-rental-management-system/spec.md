# CommandPT Audio Visual Rental Management System

## Overview
A web application for managing inventory, creating quotes, and tracking clients for an audio visual rental company, featuring a neutral black/white theme with red accents for CommandPT branding. The application is branded as CommandPT throughout all user interfaces.

## Core Features

### Inventory Management
- Two-tier inventory system with catalog items (main items) and asset units (physical units)
- Catalog items contain core information: item_id, name, category (required), description (optional), price (decimal), and item_photo (optional)
- Category field with fixed allowed values: Lighting, Audio, Video, Cable, Drape, Miscellaneous
- Asset units linked to catalog items with: asset_unit_id, item_id (foreign key), asset_tag (unique), office_location, and status
- Asset unit status options: available, reserved, checked_out, repair, retired
- Equipment location field with fixed dropdown options: "Dallas", "Miami", "Phoenix", "Minneapolis"
- Add, view, edit, and delete catalog items with expandable asset unit sections
- Category dropdown required when adding or editing catalog items
- Display one row per catalog item with expandable view showing all associated asset units
- Display Category and Price columns in inventory list/table view alongside existing columns
- Show asset tag, office location, and status for each asset unit under its parent catalog item
- Add multiple asset units per catalog item via modal interface for inputting multiple asset tags and office locations
- Search and filter equipment by catalog item name, category, asset tag, office location, or asset status
- Filter and count assets by office location and status across all catalog items
- Prevent duplicate catalog items and ensure unique asset tags across all asset units
- Import inventory data from CSV files with automatic parsing and catalog/asset separation
- Download CSV import template with headers: item_name, category, description, price, asset_tag, location, notes
- CSV template includes category values from allowed list and location options
- Backend stores catalog items and asset units with proper relational structure and prevents duplicate asset tags
- Clear all existing inventory data (catalog items and asset units only) without affecting other entities
- Photo upload functionality for catalog items with standard image storage and display in create/edit forms

### CSV Import Functionality
- Upload and parse CSV files containing inventory data with catalog/asset separation
- CSV columns: item_name, category, description, price, asset_tag, location, notes
- Each CSV row represents one physical asset unit
- Match existing catalog items by item_name + category + description + price combination
- Create new catalog items when no match is found
- Create one asset unit per CSV row with asset_tag, location, and default status = available
- Allow optional notes field for asset units
- Validate CSV data format and handle parsing errors gracefully
- Backend processes CSV data and updates both catalog items and asset units accordingly

### Venue Management
- Store venue information with venue_id, venue_name (required), address_line_1, address_line_2, city, state, postal_code, country (default "US"), phone (optional), website (optional), and notes (optional)
- Add, view, edit, and delete venues with searchable list interface
- Search and filter venues by venue_name, city, or state
- Backend stores venue data with CRUD operations

### Quoting System
- Create new quotes for clients with unique reference numbers
- Link quotes to venues with searchable dropdown selection by venue_name, city, or state
- Inline venue creation modal within quote form with automatic selection of newly created venue
- Add event_start_date (required) and event_end_date (optional, defaults to start date) fields to quotes
- Add office field (required) with dropdown options: Dallas, Miami, Phoenix, Minneapolis to determine inventory source location
- Organize quotes into named subsections (e.g., "Lighting," "Audio," "Staging")
- Add, edit, delete, and clone subsections dynamically within quotes
- Clone subsections duplicates all included equipment and custom items while allowing rename and individual adjustments
- Add catalog items to quotes with quantities and rental duration in days within specific subsections
- Inventory selection dropdowns support type-ahead searching by item_name only with dynamic filtering
- Auto-fill line item price using catalog item's price while allowing manual editing
- Availability calculation based on asset units filtered by item_id, office_location matching quote's office field exactly, and status = available using event date ranges
- Availability calculation must account for assets already reserved or checked out in overlapping confirmed jobs within the same office location and date range
- Add text items with manual description and pricing without selecting equipment within subsections
- Per-section tax controls with individual tax rate settings and enable/disable toggle for each subsection
- Tax calculation applies only to sections where tax is enabled, using the specified tax rate for that section
- Automatically calculate subtotals per subsection and aggregate totals based on per-day rates multiplied by number of days, taxes (when enabled per section), and total amounts including text items
- Display all monetary values in dollars and cents format ($X.XX) throughout the application
- Save, view, edit quotes with different statuses (draft, sent, approved, rejected)
- Quote line items maintain stable item_id references and persist all equipment selections and quantities across all status transitions to preserve equipment selections and data persistence
- When transitioning quotes from draft or sent to confirmed status, all associated equipment line items and their data persist automatically without requiring re-selection
- Export quotes to PDF with Pearson Technology branding using pt_full-red-whiteback.png logo, Instrument Sans font, red accents, polished theme styling, enhanced borders, professional mobile-print friendly layout with black subheading text and dividing lines for improved contrast, no footer, no subheadings, no printed "Pearson Technology" name text, and properly aligned totals and subtotals without overlapping numbers
- Display venue information in PDF under client information labeled "Venue" showing venue name and address
- Display event dates section in PDF showing single date or date range
- Organization-wide quote visibility allowing all users to view all quotes regardless of creator
- Backend stores quote data with references to catalog items, venues, event dates, office field, and asset unit availability calculations
- Quote line items must be correctly linked to inventory items using stable item_id foreign key references that match existing catalog items
- Display item names from catalog items using the name field, showing "Item missing in Inventory" when inventory reference cannot be found
- Subrent button functionality enabled in quotes with existing modal/flow for vendor selection and quantity input

### Client Management
- Store client information (name, company, phone, email)
- Link clients to their quotes and view quote history
- Backend stores client data and maintains relationships with quotes

### Operations Management

#### Prep Page
- Display all confirmed quotes/jobs showing job/quote name or number, client name, delivery location (venue), and event dates
- When opening a job, display all line items with correct item names from catalog items using stable item_id references
- Show item name, quantity quoted, quantity available by location and date range, and shortage field
- Display "Item missing in Inventory" when inventory reference cannot be found instead of "Unknown item"
- Implement shortage calculation logic per location comparing quote item requirements with available units at the quote's selected office location within the event date range across all confirmed jobs
- Availability calculation uses only asset units with status = available at the quote's office location during the event date range, minus any units already reserved or checked out in overlapping confirmed jobs
- Calculate shortage as quantity_quoted minus actual_quantity_available_at_quote_office_location_during_event_date_range, displaying negative values when insufficient inventory
- Subrent button functionality enabled for each item with vendor search selector pulling from Vendors list
- Allow vendor selection and quantity input for subrental with support for multiple vendors per quote
- Generate "Create Complete Pull List" PDF with professional styling listing all items grouped by sections with quantities, including client name, delivery location (venue) with full address, event start/end dates, and quote/job ID using the exact same PDF layout, style, and logo as existing quote PDFs
- Generate "Sub Rentals" PDFs, one per vendor, listing only their subrented items grouped by section, including vendor name and contact info, delivery location details, and event dates using identical current quote PDF styling
- Implement error handling for PDF generation with user-facing error messages and internal error logging

#### Vendors Page
- Vendor management interface with data fields: vendor name, primary contact name, email, phone number, address (optional), notes (optional), vendor_category (required)
- Vendor category field with dropdown values: equipment, labor, labor and equipment, transportation, miscellaneous
- Add, edit, search, and list vendors functionality
- Display vendor_category column in vendor table and editable in create/edit dialogs
- Vendor list feeds into Subrent selector in Prep page

#### Pull Page
- Show all confirmed jobs requiring pulling with job name, client name, delivery location (venue), and event dates
- List all items and required quantities for each location per job with correct item names from catalog items
- Display "Item missing in Inventory" when inventory reference cannot be found
- Scan button to initiate Check-Out mode with barcode scanning to match asset tags
- Mark scanned items as checked out and reduce available quantities at location
- Finalize button to complete and close scanning sessions
- Check In button for return workflow showing items currently checked out
- Enable scanning items back in to restore inventory levels
- Complete button generates Missing Items PDF showing items not checked back in with quantities, job reference information, and delivery location details

#### Costs Page
- Job selection dropdown/list showing quote/job name or number, client name, event dates, and venue (delivery location)
- Display selected job's quote total amount
- Add new cost entries with vendor selection, vendor category selection, projected cost input, optional actual cost input, and notes field
- Cost entry table displaying Vendor, Vendor Category, Projected Cost, Actual Cost, and Notes columns
- Calculate and display total projected costs and total actual costs for selected job
- Calculate and display profit and margin information:
  - Projected profit = quote total amount - sum of projected costs
  - Actual profit = quote total amount - sum of actual costs
  - Projected margin percentage = (projected profit / quote total amount) * 100
  - Actual margin percentage = (actual profit / quote total amount) * 100
  - Display format: "Projected Profit: $X.XX / Projected Margin: X.XX% ($X.XX)" and "Actual Profit: $Y.XX / Actual Margin: Y.YY% ($Y.XX)"
  - Show "N/A" if quote total equals zero
- "Download Costs for Accounting" button that exports CSV with Job ID + name, Client, Event dates, Vendor name, Vendor category, Projected cost, Actual cost, and Notes
- Backend stores cost data with cost_id, job_id, vendor_id, vendor_category, projected_cost, actual_cost, and notes

### Dashboard
- Display inventory statistics based on catalog items and asset unit counts
- Show available, reserved, checked out, repair, and retired asset counts by office location
- Show recent quotes and their statuses with monetary values in dollars and cents format
- Display upcoming bookings overview

### Booking Calendar
- Calendar view showing scheduled rentals based on quote event dates spanning from event_start_date to event_end_date
- Display client name and venue name in each calendar entry
- Visual representation of asset availability and conflicts by office location
- Navigation to open corresponding quote/job when clicking calendar events
- Frontend calendar component with backend data for bookings

### Code Export Functionality
- Generate complete downloadable ZIP archive containing all application source code
- Include all backend Motoko files with proper directory structure
- Include all frontend React + TypeScript files with TailwindCSS styling
- Include all static assets (images, logos, icons) and generated files
- Include all configuration files: package.json, dfx.json, tailwind.config.js, vite.config.ts, and other build configurations
- Ensure exported codebase reflects the latest CommandPT Version 25 build with all current features
- Maintain proper file organization and directory structure for immediate deployment
- Include README or documentation files for setup and deployment instructions
- Backend provides ZIP generation endpoint that packages all source files and assets
- Frontend provides download interface with progress indication and error handling

## Data Storage Requirements
The backend must store:
- Catalog items with item_id, name, category (required with fixed values: Lighting, Audio, Video, Cable, Drape, Miscellaneous), description (optional), price (decimal), and item_photo (optional)
- Asset units with asset_unit_id, item_id (foreign key), asset_tag (unique), office_location, status, and notes (optional)
- Venue information with venue_id, venue_name, address fields, contact details, and notes
- Client information and contact details
- Quote data with subsection organization including venue_id reference, office field (required), event_start_date, event_end_date, per-section tax settings, catalog item references using stable item_id foreign keys that match existing catalog items, text item descriptions with pricing, per-day rates, rental days, calculations per subsection and total with tax calculations, status, and reference numbers
- Vendor information including vendor name, primary contact name, email, phone number, address, notes, and vendor_category (required with values: equipment, labor, labor and equipment, transportation, miscellaneous)
- Subrental data linking quote items to vendors with quantities
- Check-out/check-in records for asset units with timestamps and job references
- Booking/rental schedule data for calendar functionality linked to asset units and event dates
- Cost data with cost_id, job_id (foreign key to quotes), vendor_id (foreign key to vendors), vendor_category, projected_cost (numeric), actual_cost (numeric), and notes (optional)
- Relationships between clients, quotes, venues, catalog items, asset units, vendors, costs, and subsections with proper foreign key constraints
- CSV import processing capabilities with catalog/asset separation logic
- User theme preferences (dark/light mode) with session persistence
- Per-section tax configuration data with individual tax rates and enable/disable flags
- Data migration logic to convert existing inventory to new catalog/asset structure during import process
- PDF generation data for pull lists and vendor subrental reports with error handling
- Clear existing inventory data functionality without affecting other entities
- Image storage for catalog item photos
- Availability calculation logic that counts only asset units with status = available at the exact office location specified in the quote during event date ranges, accounting for assets already reserved or checked out in overlapping confirmed jobs at the same office location
- Quote lifecycle persistence ensuring equipment line items and data automatically persist when transitioning from draft/sent to confirmed status without requiring re-selection
- Asset reservation and checkout tracking to properly calculate availability across overlapping jobs and prevent double-booking at specific office locations
- Source code files and assets for ZIP export generation with proper file organization and metadata

## User Interface
- Neutral black/white theme palette with CommandPT red branding:
  - Light mode: white/light gray backgrounds with black text
  - Dark mode: dark gray/black backgrounds with white/light gray text
  - CommandPT red maintained for header logo/text across both themes
  - Red used sparingly as accent for buttons, highlights, and CommandPT logo
- Light/Dark Mode toggle in header or user menu with complete readability and contrast in both themes
- Theme preference persistence across sessions
- Use pt_icon-red-transparent.png logo consistently across both dark and light modes in all UI elements
- CommandPT branding throughout all visible references including app title, headers, navigation labels, login screens, modals, tooltips, and help texts
- Remove "Professional AV Solutions" and "AV rental management" text from all UI elements
- Red headline text and red buttons with white text for primary actions
- Consistent theme styling across Dashboard, Inventory, Clients, Quotes, Venues, Operations, and Calendar pages
- Enhanced readability with appropriate contrast, subtle highlights, and shadows
- Responsive layout for desktop and mobile access
- Intuitive navigation between inventory, quotes, clients, venues, operations, and dashboard sections
- English language content throughout the application
- Accessibility-compliant color contrast and visual hierarchy
- Main navigation includes Operations section with four sub-pages: Prep, Vendors, Pull, and Costs
- Venues page with searchable list, filters by venue_name, city, or state, and "Add New Venue" button
- Inventory page displays catalog items with expandable asset unit sections
- Inventory page includes Category and Price columns in list/table view and category dropdown in add/edit forms
- Inventory page includes "Download Inventory Import Template (CSV)" button near the top
- Asset unit details show asset tag, office location, and status within parent catalog item
- Modal interface for adding multiple asset units to catalog items with asset tag and office location inputs
- Filtering controls for office location and asset status with live count updates
- Photo upload field in catalog item create/edit forms with image display
- Quote dialog includes venue selection dropdown with search capabilities and inline venue creation modal
- Quote dialog includes office selection dropdown with required options: Dallas, Miami, Phoenix, Minneapolis
- Event date pickers for Event Start Date (required) and Event End Date (optional)
- Quote dialog includes subsection management with catalog item selection and availability checking using event date ranges and office location
- Inventory selection dropdowns in quotes feature type-ahead searching with dynamic filtering by item_name only
- Auto-fill line item price from catalog item price with manual editing capability
- Quote UI displays "text item" label for custom text line items without equipment
- Per-section tax controls with checkbox/toggle for "Apply Tax to This Section" and numeric input for tax rate
- Equipment selection based on catalog items with availability calculated from asset units using event dates and quote office location exactly, accounting for overlapping confirmed jobs
- All monetary displays formatted as dollars and cents ($X.XX) with proper validation and subsection totals including tax when enabled
- Quote detail page displays projected and actual profit and margin calculations in the UI
- Quote line items display correct item names from catalog items using stable item_id references that persist across status changes and match existing catalog items
- Display "Item missing in Inventory" when inventory reference cannot be found instead of "Unknown item"
- Subrent button enabled in quotes with existing modal/flow functionality
- PDF exports feature Pearson Technology logo (pt_full-red-whiteback.png), Instrument Sans font, brand styling with red accents, professional formatting with enhanced borders, black subheading text and dividing lines for improved contrast, no footer, no subheadings, no printed "Pearson Technology" name text, and properly aligned totals and subtotals without overlapping numbers
- PDF exports include venue information and event dates sections
- CSV file upload interface in inventory management section with drag-and-drop or file selection capabilities
- CSV template download functionality with proper headers and example data
- Import progress indicators and success/error messaging for CSV processing with catalog/asset separation
- Preview and confirmation dialogs showing detected catalog items and asset units before final import
- Display import results showing successfully created catalog items and associated asset units
- Quotes page displays all quotes organization-wide showing quote number, client name, created by user, and total including tax
- Dynamic availability calculation and display updates based on asset unit status = available, office location filtering matching quote office exactly, and event date ranges using actual asset_unit record counts minus overlapping reservations
- Operations pages maintain consistent CommandPT theming and navigation structure
- Operations pages display quote/job name, client name, delivery location (venue), and event dates
- Prep page displays shortage calculations with negative values using event date ranges and quote office location for availability based on actual asset_unit records with status = available at the exact office location minus overlapping confirmed job reservations
- Prep page displays correct item names from catalog items with "Item missing in Inventory" fallback
- Prep page includes enabled Subrent button with existing modal/flow functionality
- Prep page PDF generation with error handling and user feedback for failed operations
- Vendors page provides comprehensive vendor management with search and filtering capabilities
- Vendors page displays vendor_category column in table and includes category dropdown in create/edit dialogs
- Pull page includes barcode scanning interface and check-out/check-in workflow with PDF generation for missing items including venue details
- Pull page displays correct item names from catalog items with proper error handling
- Costs page includes job selection dropdown, cost entry form with vendor and category selection, cost table display, profit/margin calculations, and CSV export functionality
- Calendar displays quotes as events spanning event date ranges with client and venue information
- Calendar events are clickable to navigate to corresponding quotes
- Code export interface with "Download Complete Codebase" button in settings or admin section
- Export progress indicator showing ZIP generation status with file count and size information
- Download completion notification with file size and success confirmation
- Error handling for export failures with detailed error messages and retry options
