# Restaurant Management System - Desktop Application

This document provides instructions on how to run and build the Restaurant Management System as a desktop application using Electron.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or later)
- npm (usually comes with Node.js)

## Development

To run the application in development mode:

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run electron:dev
   ```

   This command will start both the Vite development server and Electron. Any changes you make to the code will be hot-reloaded.

## Building the Application

To build the application for distribution:

1. Install dependencies (if you haven't already):
   ```
   npm install
   ```

2. Build the application:
   ```
   npm run electron:build
   ```

   This will create a distributable package in the `release` directory.

## Running the Built Application

To preview the built application without packaging:

1. Build the application:
   ```
   npm run build
   ```

2. Run the built application with Electron:
   ```
   npm run electron:preview
   ```

## Distribution Packages

The build process creates distribution packages for different platforms:

- **Windows**: NSIS installer (.exe)
- **macOS**: Application bundle (.app)
- **Linux**: AppImage and Debian package (.deb)

You can find these packages in the `release` directory after running the build command.

## Troubleshooting

If you encounter any issues:

1. Make sure all dependencies are installed:
   ```
   npm install
   ```

2. Clear the cache:
   ```
   npm cache clean --force
   ```

3. Delete the `node_modules` folder and reinstall dependencies:
   ```
   rm -rf node_modules
   npm install
   ```

4. Check the console for error messages (press F12 in the running application).

## Notes

- The application uses Electron to run as a desktop application.
- The frontend is built with React and communicates with the backend API.
- The application uses HashRouter for navigation to ensure compatibility with Electron.
- Environment variables are loaded from the `.env` file.

## API Configuration

The application connects to the backend API specified in the `.env` file. By default, it connects to `http://localhost:8080`. If your API is running on a different URL, update the `VITE_API_URL` variable in the `.env` file.