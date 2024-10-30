# Contact Reminder Chrome Extension

This is a Chrome extension designed to help remind you to contact different people at specified intervals. It features a simple interface with two tabs: **View Contacts** and **Edit Contacts**. You can add, edit, delete, log, delay, and export/import your contacts. The extension aims to keep track of when you need to reach out to different people and helps you manage those reminders effectively.

## Features

- View all contacts with their next contact date.
- Edit contact details such as name and frequency of contact.
- Mark a contact as contacted or delay their next contact date.
- Import/export contacts as JSON for easy backup or transfer.

## How to Develop

### Prerequisites

- **Node.js** and **Yarn** (or **npm**) installed on your machine.
- **Google Chrome** with developer mode enabled.

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd contact-reminder-extension
   ```

2. Install dependencies using Yarn:
   ```bash
   yarn install
   ```

### Build

This extension uses TypeScript for the background and popup scripts, which need to be transpiled to JavaScript before Chrome can use them.

1. Build the project:
   ```bash
   yarn build
   ```
   This command will compile TypeScript files and output the JavaScript to the `dist` directory.

### File Structure

- **manifest.json**: Defines the Chrome extension's configuration.
- **src/**: Contains TypeScript source files.
- **dist/**: Contains the compiled JavaScript files.
- **pages/**: Contains the HTML files for the extension's popup UI.
- **css/**: Contains stylesheets for the UI.

## Uploading the Unpacked Extension to Chrome

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** by toggling the switch in the top right corner.
3. Click on **Load unpacked**.
4. Select the directory where the built files are located (typically the root of the repository after running `yarn build`).
5. The extension should now be loaded and available for use in Chrome.

## Important Notes

- After making changes to any TypeScript files, always run `yarn build` to compile them before reloading the extension in Chrome.
- You can see the extension in action by clicking the extension icon in the browser toolbar.
