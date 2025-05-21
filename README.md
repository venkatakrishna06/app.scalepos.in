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
- **State Management**: Zustand, React Context API
- **UI Components**: Radix UI, Tailwind CSS
- **API Communication**: Axios, React Query
- **Form Handling**: React Hook Form, Zod
- **Data Visualization**: Recharts
- **Build Tools**: Vite, ESLint

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
   VITE_API_URL=your_backend_api_url
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. The application will be available at `http://localhost:5173`

## Usage

### Development
- `npm run dev` - Start the development server
- `npm run lint` - Run ESLint to check for code issues
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally

## Documentation

For detailed documentation, please see [DOCUMENTATION.md](./DOCUMENTATION.md).

## License

[MIT](LICENSE)
