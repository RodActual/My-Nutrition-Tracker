import './globals.css';

export const metadata = {
  title: 'Family Nutrition Tracker',
  description: 'Track calories and macros easily.',
  manifest: '/manifest.json', // Link the manifest here
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'NutriTrack',
  },
};

export const viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents accidental zooming on input fields
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}