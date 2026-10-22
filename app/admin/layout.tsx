import type { Metadata, Viewport } from "next";
import "./admin.css";
import AdminWorker from "@/components/admin/AdminWorker";

/* The admin app's own frame. None of the website's header, footer, opening
 * animation, smooth scrolling or chat widget is loaded here, which keeps the app
 * light and quick to open. */

export const metadata: Metadata = {
  title: { default: "MOJATECH Admin", template: "%s | MOJATECH Admin" },
  robots: { index: false, follow: false, nocache: true },
  manifest: "/admin.webmanifest",
  icons: { icon: "/admin-icon-192.png", apple: "/admin-apple-touch.png" },
  appleWebApp: { capable: true, title: "MOJATECH", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#05081f" },
    { media: "(prefers-color-scheme: dark)", color: "#05081f" },
  ],
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mja">
      {/* Before the first paint: re-apply "menu tucked away" and "chat list folded" on wide screens, so nothing jumps. */}
      <script dangerouslySetInnerHTML={{ __html: `try{var d=document.documentElement.dataset;if(localStorage.getItem("mja-nav-hidden")==="1")d.mjaNav="hidden";if(localStorage.getItem("mjr-side-hidden")==="1")d.mjrSide="hidden"}catch(e){}` }} />
      {children}
      <AdminWorker />
    </div>
  );
}
