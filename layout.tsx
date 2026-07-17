import "./globals.css";

export const metadata = {
  title: "Video CRM Status Tool",
  description: "Update QC/CRM status for videos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
