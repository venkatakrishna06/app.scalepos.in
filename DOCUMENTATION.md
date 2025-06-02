# QuickQuick Restaurant Management System - Technical Documentation

## Project Overview
QuickQuick is a comprehensive restaurant management system designed to streamline and automate various aspects of restaurant operations. The frontend application is built with modern web technologies to provide a responsive and intuitive user interface for restaurant staff and management.

## Features

### Authentication and User Management
- User authentication (login/signup)
- Role-based access control
- User profile management
- Staff management

### Dashboard
- Overview of restaurant performance
- Key metrics and statistics
- Quick access to common tasks
- Takeaway orders dashboard

### Order Management
- Create new orders
- View and manage existing orders
- Order status tracking
- Order history

### Menu Management
- Create and edit menu items
- Organize items into categories
- Set prices and availability
- Upload item images

### Table Management
- Table layout visualization
- Table reservation
- Table status tracking
- Table assignment for orders

### Reservation System
- Create and manage reservations
- Calendar view of reservations
- Customer information management
- Reservation confirmation

### Payment Processing
- Process payments for orders
- Multiple payment methods
- Payment history
- Receipt generation

### Customer Management
- Customer database
- Customer order history
- Customer preferences
- Loyalty program management

### Analytics and Reporting
- Sales reports
- Popular items analysis
- Peak hours identification
- Revenue tracking
- Staff performance metrics

### Settings
- Restaurant information
- GST settings
- System preferences
- Notification settings

## Technologies and Tools

### Frontend Framework
- React 18.3.1
- TypeScript 5.5.3

### Build Tools
- Vite 5.4.2
- ESLint 9.9.1
- PostCSS 8.4.35

### State Management
- Zustand 4.5.1
- React Context API

### Routing
- React Router DOM 6.22.2

### API Communication
- Axios 1.6.7
- TanStack React Query 5.24.1

### UI Components
- Radix UI (various components)
- Lucide React (icons)
- Tailwind CSS 3.4.1
- Class Variance Authority
- Tailwind Merge
- Sonner (toast notifications)

### Form Handling
- React Hook Form 7.51.0
- Zod (validation)
- Hookform Resolvers

### Data Visualization
- Recharts 2.15.3
- React Day Picker (calendar)

### Authentication
- JWT Decode 4.0.0

### Date Handling
- date-fns 3.3.1

## Project Structure

### Root Structure
```
quickquick-frontend/
├── public/           # Static assets
├── src/              # Source code
├── .gitignore        # Git ignore file
├── eslint.config.js  # ESLint configuration
├── index.html        # HTML entry point
├── package.json      # Project dependencies and scripts
├── postcss.config.js # PostCSS configuration
├── README.md         # Project readme
├── tailwind.config.js # Tailwind CSS configuration
├── tsconfig.json     # TypeScript configuration
└── vite.config.ts    # Vite configuration
```

### Source Code Structure
```
src/
├── components/       # Reusable UI components
│   ├── auth/         # Authentication components
│   ├── charts/       # Chart components
│   ├── dashboard/    # Dashboard components
│   ├── forms/        # Form components
│   ├── Navigation/   # Navigation components
│   ├── skeletons/    # Loading skeleton components
│   ├── theme/        # Theme components
│   ├── ui/           # UI components
│   └── UserManagement/ # User management components
├── context/          # React context providers
├── hooks/            # Custom React hooks
├── lib/              # Utilities and services
│   ├── api/          # API configuration and services
│   │   └── services/ # API service modules
│   ├── auth/         # Authentication utilities
│   ├── hooks/        # Library-specific hooks
│   ├── services/     # Business logic services
│   └── store/        # Zustand stores
├── pages/            # Application pages
│   ├── auth/         # Authentication pages
│   └── settings/     # Settings pages
├── routes/           # Route configuration
├── services/         # Additional services
├── types/            # TypeScript type definitions
├── App.tsx           # Root component
├── index.css         # Global styles
├── main.tsx          # Application entry point
└── routes.tsx        # Route definitions
```

## Setup and Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/quickquick-frontend.git
   cd quickquick-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   API_URL=your_backend_api_url
   ANALYTICS_URL=your_analytics_url
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. The application will be available at `http://localhost:5173`

### Building for Production
```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `dist/` directory.

## Usage

### Development
- `npm run dev` - Start the development server
- `npm run lint` - Run ESLint to check for code issues
- `npm run preview` - Preview the production build locally

### Deployment
1. Build the application using `npm run build`
2. Deploy the contents of the `dist/` directory to your web server or hosting service

## API Integration
The application communicates with a backend API using Axios. The API endpoints are defined in `src/lib/api/endpoints.ts`, and the API services are organized in `src/lib/api/services/`.

## State Management
The application uses Zustand for state management. The stores are organized in `src/lib/store/` with separate stores for different features:
- `analytics.store.ts` - Analytics data
- `auth.store.ts` - Authentication state
- `menu.store.ts` - Menu items and categories
- `notification.store.ts` - Notifications
- `order.store.ts` - Orders
- `payment.store.ts` - Payments
- `restaurant.store.ts` - Restaurant information
- `staff.store.ts` - Staff management
- `table.store.ts` - Table management
- `user.store.ts` - User management

## Routing
The application uses React Router DOM for routing. The routes are defined in `src/routes.tsx` and organized in the `src/routes/` directory.

## UI Components
The application uses Radix UI primitives for accessible UI components, combined with Tailwind CSS for styling. Custom components are organized in the `src/components/` directory.

## Form Handling
The application uses React Hook Form for form handling, with Zod for validation. Form components are organized in the `src/components/forms/` directory.

## Authentication
The application uses JWT for authentication. The authentication logic is handled in the `src/lib/auth/` directory and the `src/lib/store/auth.store.ts` file.

## Data Visualization
The application uses Recharts for data visualization. Chart components are organized in the `src/components/charts/` directory.

## Responsive Design
The application is designed to be responsive and work on both desktop and mobile devices. The responsive layout is implemented using Tailwind CSS and custom components.

## Error Handling
The application uses toast notifications for error handling and user feedback. The toast configuration is in `src/lib/toast.ts`.

## Testing
The application can be tested using the following commands:
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage report

## Troubleshooting
- If you encounter issues with the API, check the API URL in the `.env` file
- If you encounter build issues, try clearing the cache with `npm run clean`
- For other issues, check the console for error messages
