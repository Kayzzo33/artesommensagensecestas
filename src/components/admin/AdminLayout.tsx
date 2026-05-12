import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Tag, Image as ImageIcon, ShoppingBag, MapPin, Box, DollarSign, Settings, LogOut, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/src/lib/supabase";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/categorias", label: "Categorias", icon: Tag },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/bairros", label: "Bairros", icon: MapPin },
  { href: "/admin/estoque", label: "Estoque", icon: Box },
  { href: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/admin/login");
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/admin/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-[#F5A623]">Verificando autenticação...</div>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const NavLinks = () => (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
              isActive 
                ? "bg-[#C8102E] text-white" 
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans flex items-stretch h-screen overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-900 bg-zinc-950 h-full">
        <div className="p-6 border-b border-zinc-900">
          <Link to="/">
            <h1 className="font-heading text-2xl font-bold text-[#F5A623] hover:text-white transition-colors">Arte Som</h1>
          </Link>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1">Admin Panel</p>
        </div>
        <div className="flex-1 p-4 overflow-y-auto overflow-x-hidden">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-zinc-900">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-900 bg-zinc-950 shrink-0">
          <h1 className="font-heading text-xl font-bold text-[#F5A623]">Arte Som</h1>
          <Sheet>
            <SheetTrigger className="p-2">
              <Menu className="w-6 h-6" />
            </SheetTrigger>
            <SheetContent side="left" className="bg-zinc-950 border-zinc-900 text-white p-0">
              <div className="p-6 border-b border-zinc-900/50">
                <h1 className="font-heading text-2xl font-bold text-[#F5A623]">Arte Som</h1>
              </div>
              <div className="p-4">
                <NavLinks />
              </div>
              <div className="p-4 border-t border-zinc-900 absolute bottom-0 w-full">
                <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors">
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
