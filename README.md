# Station Timetable Editor

## Description
The "Station Timetable Editor" is a Single Page Application (SPA) designed for efficient management and editing of station timetables. This user-friendly application caters to the needs of individuals and organizations managing train or bus station schedules. It has recently been modernized into a React + TypeScript Progressive Web App (PWA) using Vite.

## Features

- **Dynamic Timetable Editing**: Users can easily add, modify, and delete time slots in the timetable.
- **User-Friendly Interface**: The application includes interactive elements such as a plus button for adding new time slots and a remove button for deleting unnecessary entries.
- **Accessibility and Responsiveness**: Designed with accessibility in mind, the app ensures a seamless experience across different devices and screen sizes.
- **Real-Time URL Hash Updates**: As changes are made to the timetable, the URL hash updates in real-time, enabling easy bookmarking and sharing of specific timetable states.
- **PWA Support**: The app can be installed as a Progressive Web App on supported devices for offline use and quick access.

## Usage

- **Adding a Time Slot**: Hover near the bottom of the timetable to display the plus button and click it to add a new slot.
- **Editing Time Slots**: Double-click on a timetable cell to edit its contents.
- **Deleting a Time Slot**: Hover near the left border of the last row. If it's empty (except for the first column), a red remove button will appear for deletion.
- **Sharing Timetable States**: Use the dynamically updated URL hash to bookmark or share the current state of the timetable.

## Development

This project uses [Vite](https://vitejs.dev/) with React and TypeScript.

### Running Locally
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production
1. Build the static files:
   ```bash
   npm run build
   ```
2. Preview the built version locally (important for testing the PWA and ES modules):
   ```bash
   npm run preview
   ```
