import { Metadata } from "next";
import AdminClientLayout from "./AdminClientLayout";

// ป้องกัน Google Bot และ Search Engine crawler อื่นๆ ในหน้า admin
export const metadata: Metadata = {
  title: "Admin Panel",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "none",
      "max-snippet": -1,
    },
  },
  other: {
    "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex",
  },
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminClientLayout>{children}</AdminClientLayout>;
}
