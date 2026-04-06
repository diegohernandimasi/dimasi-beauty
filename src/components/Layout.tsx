import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import { Scissors, User as UserIcon, Calendar, LayoutDashboard, LogOut } from "lucide-react";
import { auth } from "../firebase";
import { cn } from "../lib/utils";

export default function Layout() {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    auth.signOut();
  };

  const navItems = [
    { name: "Inicio", path: "/", icon: Scissors },
    { name: "Reservar", path: "/booking", icon: Calendar },
    ...(user ? [{ name: "Mi Perfil", path: "/profile", icon: UserIcon }] : [{ name: "Login", path: "/login", icon: UserIcon }]),
    ...(isAdmin ? [{ name: "Admin", path: "/admin", icon: LayoutDashboard }] : []),
  ];

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                D
              </div>
              <span className="font-bold text-xl tracking-tight text-neutral-900">DIMASI.BEAUTY</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-pink-500",
                    location.pathname === item.path ? "text-pink-500" : "text-neutral-600"
                  )}
                >
                  {item.name}
                </Link>
              ))}
              {user && (
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-neutral-600 hover:text-red-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </nav>

            <div className="md:hidden">
              {/* Mobile menu button could go here */}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-neutral-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-neutral-500 text-sm">
            © {new Date().getFullYear()} DIMASI.BEAUTY. Todos los derechos reservados.
          </p>
          <p className="text-neutral-400 text-xs mt-2">
            Peluquería y Manicura Profesional
          </p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex justify-around items-center h-16 px-2 z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors",
                location.pathname === item.path ? "text-pink-500" : "text-neutral-500"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
