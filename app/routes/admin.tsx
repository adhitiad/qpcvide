import type { Route } from "./+types/admin";
import { Link, Outlet, useLocation } from "react-router";
import { requireAdmin } from "../lib/auth.server";
import { 
  LayoutDashboard, 
  Film, 
  Tags, 
  FolderTree, 
  MessageSquare, 
  Megaphone,
  LogOut,
  DollarSign,
  ShieldAlert
} from "lucide-react";

export const meta = () => {
  return [
    { title: "Admin Panel - Video Hub" },
  ];
};

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAdmin(request);
  return { user };
}

export default function AdminLayout() {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Video", href: "/admin/video", icon: Film },
    { name: "Tags", href: "/admin/tags", icon: Tags },
    { name: "Categories", href: "/admin/categories", icon: FolderTree },
    { name: "Comments", href: "/admin/comments", icon: MessageSquare },
    { name: "Moderations", href: "/admin/moderations", icon: ShieldAlert },
    { name: "Ads", href: "/admin/ads", icon: Megaphone },
    { name: "Revenue", href: "/admin/revenue", icon: DollarSign },
  ];

  return (
    <div className="flex min-h-screen bg-night-bg text-white">
      {/* Sidebar */}
      <div className="w-64 bg-night-card border-r border-night-border hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-night-border">
          <Link to="/admin" className="text-xl font-serif font-bold text-white tracking-wider">
            ANIME<span className="text-night-accent">ADMIN</span>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (location.pathname.startsWith(item.href) && item.href !== "/admin");
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-night-accent text-white" 
                    : "text-night-muted hover:text-white hover:bg-night-hover"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-night-border">
          <Link 
            to="/" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-night-muted hover:text-white hover:bg-night-hover transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Back to Site
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-night-card border-b border-night-border md:hidden">
           <Link to="/admin" className="text-xl font-serif font-bold text-white tracking-wider">
            ANIME<span className="text-night-accent">ADMIN</span>
          </Link>
          <Link to="/" className="text-sm text-night-cyan">Exit</Link>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-night-bg p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
