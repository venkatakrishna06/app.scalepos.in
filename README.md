# QuickQuick Restaurant Management System

## Overview
QuickQuick is a comprehensive restaurant management system designed to streamline and automate various aspects of restaurant operations. The frontend application is built with modern web technologies to provide a responsive and intuitive user interface for restaurant staff and management.

## Features

- **Authentication & User Management**: Secure login, role-based access control, staff management
- **Dashboard**: Performance overview, key metrics, quick access to common tasks
- **Order Management**: Create, view, and manage orders with status tracking
- **Menu Management**: Create and edit menu items, categories, pricing, and availability
- **Table Management**: Table layout, reservations, status tracking, and order assignment
- **Reservation System**: Manage bookings with calendar view and customer information
- **Payment Processing**: Multiple payment methods, history, and receipt generation
- **Customer Management**: Customer database with order history and preferences
- **Analytics & Reporting**: Sales reports, popular items, peak hours, and revenue tracking
- **Settings**: Restaurant information, GST settings, and system preferences

## Technologies Used

- **Frontend**: React 18, TypeScript
- **State Management**: React Query (with localStorage persistence), Zustand, React Context API
- **UI Components**: Radix UI, Tailwind CSS
- **API Communication**: Axios, React Query
- **Form Handling**: React Hook Form, Zod
- **Data Visualization**: Recharts
- **Build Tools**: Vite, ESLint
- **Desktop Application**: Electron

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/quickquick-frontend.git
   cd quickquick-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```
   API_URL=your_backend_api_url
   ANALYTICS_URL=your_analytics_url
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. The application will be available at `http://localhost:5173`

## Usage

### Web Application Development
- `npm run dev` - Start the development server
- `npm run lint` - Run ESLint to check for code issues
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally

### Desktop Application
This application can also be run as a desktop application using Electron.

#### Development
- `npm run electron:dev` - Start the development server with Electron

#### Building
- `npm run electron:build` - Build the desktop application for distribution
- `npm run electron:preview` - Preview the built desktop application

For detailed instructions on running and building the desktop application, see [DESKTOP_APP.md](./DESKTOP_APP.md).

## Documentation

### React Query Hooks

The application uses React Query for data fetching and state management. The React Query cache is persisted to localStorage to survive page refreshes. This provides a seamless user experience even when the page is refreshed.

Custom hooks have been created for each service:

- `useAuth` - Authentication operations (login, signup, logout, etc.)
- `useOrder` - Order management operations
- `useMenu` - Menu management operations
- `useTable` - Table management operations
- `usePayment` - Payment processing operations

For detailed documentation on these hooks, see [src/lib/hooks/README.md](./src/lib/hooks/README.md).

For detailed application documentation, please see [DOCUMENTATION.md](./DOCUMENTATION.md).

## License

[MIT](LICENSE)
