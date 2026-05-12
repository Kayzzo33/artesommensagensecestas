import { Link, Outlet } from "react-router-dom";
import { ShoppingCart, Search, Menu, Heart } from "lucide-react";
import { useCartStore } from "@/src/store/cartStore";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { supabase, Category } from "@/src/lib/supabase";

export function PublicLayout() {
  const { items } = useCartStore();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const [categories, setCategories] = useState<Category[]>([]);

  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    async function fetchCats() {
      const { data } = await supabase.from("categories").select("*").eq("active", true).order("display_order", { ascending: true });
      if (data) setCategories(data);
    }
    async function fetchSettings() {
      const { data } = await supabase.from("store_settings").select("*").limit(1).single();
      if (data) setSettings(data);
    }
    fetchCats();
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF9F0] text-[#1A1A1A] font-sans flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white flex items-center">
        <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger className="md:hidden p-2">
                <Menu className="w-5 h-5" />
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="flex flex-col gap-4 mt-8 font-serif text-lg">
                  <Link to="/">Início</Link>
                  <Link to="/cesta-personalizada" className="text-[#C8102E]">Monte sua Cesta</Link>
                  {categories.map(c => (
                    <Link key={c.id} to={`/categoria/${c.slug}`}>{c.name}</Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>

            <Link to="/" className="font-heading font-bold text-2xl md:text-3xl tracking-tight text-[#C8102E]">
              Arte Som
            </Link>
          </div>

          {/* Desktop Search (Mock) */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8 items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2 hover:border-[#F5A623] transition-colors focus-within:border-[#F5A623] focus-within:bg-white focus-within:shadow-sm">
            <input 
              type="text" 
              placeholder="Digite o que dejesa procurar..." 
              className="bg-transparent border-none outline-none w-full text-sm placeholder:text-gray-400"
            />
            <button className="text-[#C8102E]">
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Link to="/carrinho" className="relative p-2 flex items-center gap-2 group">
              <ShoppingCart className="w-6 h-6 text-gray-700 group-hover:text-[#C8102E] transition-colors" />
              {itemCount > 0 && (
                <span className="absolute top-0 left-5 w-5 h-5 bg-[#C8102E] text-white text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-white">
                  {itemCount}
                </span>
              )}
              <span className="hidden md:block text-sm font-bold text-gray-700 group-hover:text-[#C8102E]">Meu Carrinho</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Categories Desktop Bar */}
      <div className="hidden md:block border-b bg-white border-t border-gray-100 z-40 relative">
        <div className="container mx-auto px-4 h-12 flex items-center justify-center gap-8 text-[11px] font-bold uppercase tracking-widest text-[#1A1A1A]">
          <Link to="/" className="hover:text-[#C8102E] transition-colors">Ofertas</Link>
          {categories.slice(0, 7).map(c => (
            <Link key={c.id} to={`/categoria/${c.slug}`} className="hover:text-[#C8102E] transition-colors whitespace-nowrap">{c.name}</Link>
          ))}
          <Link to="/cesta-personalizada" className="text-[#C8102E] bg-red-50 px-3 py-1 rounded-sm whitespace-nowrap">Monte sua Cesta</Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-12 mt-12">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-heading text-xl font-bold text-[#C8102E] mb-4">Arte Som</h3>
            <p className="text-sm text-gray-600 mb-4">Presentes inesquecíveis para pessoas especiais. Cestas personalizadas com amor e carinho.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4 font-heading">Links Rápidos</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link to="/cesta-personalizada" className="hover:text-[#F5A623]">Monte sua Cesta</Link></li>
              <li><Link to="/categoria/cestas-cafe" className="hover:text-[#F5A623]">Cestas de Café da Manhã</Link></li>
              <li><Link to="/categoria/bebidas" className="hover:text-[#F5A623]">Bebidas e Cervejas</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 font-heading">Contato</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>WhatsApp: {settings?.whatsapp_number || "(11) 99999-9999"}</li>
              {settings?.instagram_url && (
                <li>Insta: <a href={settings.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-[#F5A623]">@{settings.instagram_url.split('.com/')[1]?.replace('/','') || 'Instagram'}</a></li>
              )}
              {settings?.address && (
                <li>Endereço: {settings.address}</li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 font-heading">Horário</h4>
            <p className="text-sm text-gray-600 truncate whitespace-pre-line">{settings?.opening_hours || "Terça a Domingo: 08h às 18h"}</p>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-8 pt-8 border-t text-center text-sm text-gray-400">
          © {new Date().getFullYear()} Arte Som. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
