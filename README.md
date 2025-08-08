# Real Estate Portfolio Management Application

A full-stack web application for managing real estate properties with interactive maps, data tables, and powerful search capabilities powered by Regrid API.

## 🌟 Features

### ✅ Phase 1 - Foundation (Completed)
- **Next.js 14** with TypeScript and App Router
- **Dark theme** with Shadcn/ui components and Tailwind CSS
- **Authentication** with Supabase Auth (sign-up, sign-in, user management)
- **Database** with Supabase and Row Level Security
- **Responsive layout** with navigation and user controls

### ✅ Phase 2 - Property Upload System (Completed)
- **CSV Upload** with validation and batch processing
- **Manual APN Entry** with property lookup
- **Address Autocomplete** with Regrid API integration
- **Property Data Fetching** from Regrid with geometry and details
- **Database Storage** with validation and error handling

### 🚧 Phase 3 - Data Display (Next)
- Property table with filtering, sorting, and search
- Map component with Mapbox and property polygons
- Property editing functionality
- Filter synchronization between table and map

### 📋 Phase 4 - Advanced Features (Planned)
- Export functionality (CSV, map snapshots)
- Property tagging system
- Document upload support
- Enhanced UI animations and loading states

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui with dark mode
- **Authentication**: Supabase Auth
- **Database**: Supabase with PostgreSQL
- **APIs**: Regrid for property data
- **Maps**: Mapbox GL JS (planned)
- **Forms**: React Hook Form with Zod validation
- **File Processing**: PapaParse for CSV handling

## 📦 Setup Instructions

1. **Environment Configuration**
   Copy `.env.example` to `.env.local` and configure the required API keys:

   ```bash
   cp .env.example .env.local
   ```

   Required services:
   - **Supabase** (Authentication & Database): Create project at [supabase.com](https://supabase.com)
   - **Regrid API** (Property data): Get API key from [regrid.com](https://regrid.com)

2. **Database Setup**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql` in the SQL editor
   - Enable Row Level Security (RLS) policies

3. **Install Dependencies & Run**
   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes for properties and search
│   ├── dashboard/         # Protected dashboard pages
│   ├── upload/           # Property upload pages
│   └── (auth)/           # Authentication pages
├── components/
│   ├── ui/               # Shadcn/ui components
│   └── upload/           # Upload-specific components
├── lib/
│   ├── db.ts            # Database service layer
│   ├── regrid.ts        # Regrid API integration
│   └── supabase.ts      # Supabase client configuration
└── database/
    └── schema.sql        # Database schema and RLS policies
```

## 🔌 API Endpoints

### Property Search (Regrid Integration)
- `GET /api/properties/search?apn={apn}&state={state}` - Search by APN
- `GET /api/properties/search?address={address}` - Address autocomplete
- `GET /api/properties/{id}` - Get detailed property data

### User Properties Management
- `GET /api/user-properties` - List user's properties with filters
- `POST /api/user-properties` - Create single or bulk properties
- `PUT /api/user-properties/{id}` - Update property
- `DELETE /api/user-properties/{id}` - Delete property

## 🏗️ Application Flow

1. **Authentication**: Users sign up/in via Clerk
2. **Property Upload**: Upload CSV, enter APN, or search by address
3. **Data Enrichment**: Regrid API fetches property details and geometry
4. **Storage**: Properties saved to Supabase with user isolation
5. **Visualization**: View in table format (maps coming in Phase 3)

## 🔐 Security Features

- Row Level Security (RLS) ensures users only see their data
- API routes protected with Supabase authentication middleware
- Input validation with Zod schemas
- Secure API key management via environment variables

## 🚀 Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

## 📊 Current Status

**Phase 1 & 2 Complete** - The application is ready for property uploads and basic management. Users can:

- Sign up and authenticate securely with Supabase Auth
- Upload properties via CSV files (APN or address format)
- Manually add properties by APN with automatic data lookup
- Search and add properties by address with autocomplete
- View properties in the dashboard (basic table view)

**Next Steps (Phase 3)**:
- Enhanced data table with filtering and sorting
- Interactive map with property polygons
- Property editing capabilities

This application demonstrates modern full-stack development with TypeScript, secure authentication, external API integration, and a scalable database architecture.
