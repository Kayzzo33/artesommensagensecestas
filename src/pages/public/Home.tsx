import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { supabase, Product, Category, Banner } from "@/src/lib/supabase";
import { formatCurrency } from "@/src/lib/utils/payment";
import { useCartStore } from "@/src/store/cartStore";
import { toast } from "sonner";

export default function Home() {
  const [categories, setCategories] = useState<{ category: Category, products: Product[] }[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const [bannersRes, catRes, prodRes] = await Promise.all([
        supabase.from("banners").select("*").order("id"),
        supabase.from("categories").select("*").eq("active", true).order("display_order"),
        supabase.from("products").select("*").eq("active", true)

      ]);

      if (bannersRes.data) {
         setBanners(bannersRes.data);
      }

      if (catRes.error || !catRes.data) {
        setLoading(false);
        return;
      }
      
      setMainCategories(catRes.data);

      if (!prodRes.error && prodRes.data) {
        const grouped = catRes.data.map(cat => {
          let categoryProducts = prodRes.data.filter(p => p.category_id === cat.id);
          categoryProducts.sort((a, b) => {
            const aHasStock = a.stock_qty > 0;
            const bHasStock = b.stock_qty > 0;
            if (aHasStock && !bHasStock) return -1;
            if (!aHasStock && bHasStock) return 1;
            return 0; // maintain original relative order or we could add another sort criteria
          });
          return { category: cat, products: categoryProducts };
        }).filter(g => g.products.length > 0);
        
        setCategories(grouped);
      }
      
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images[0] || "",
      category: product.category_id || "Geral",
      messageFee: 0,
    });
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const navigateToProduct = (id: string | undefined) => {
    if (id) navigate(`/produto/${id}`);
  };

  return (
    <div className="pb-16 bg-[#FFF9F0]">
      {/* Exibe banners do banco */}
      {banners.length > 0 ? (
         <div className="w-full relative overflow-hidden aspect-[21/9] md:aspect-[3/1]">
            {banners.map((banner, index) => (
                <div 
                  key={banner.id} 
                  className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ${
                    index === currentBanner ? 'opacity-100 z-10' : 'opacity-0 z-0'
                  }`}
                >
                  {banner.link_url ? (
                     <Link to={banner.link_url} className="w-full h-full block">
                       <img src={banner.image_url} className="w-full h-full object-cover" />
                     </Link>
                  ) : (
                     <img src={banner.image_url} className="w-full h-full object-cover" />
                  )}
                </div>
            ))}
            {banners.length > 1 && (
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                 {banners.map((_, i) => (
                   <button 
                     key={i} 
                     onClick={() => setCurrentBanner(i)}
                     className={`w-2 h-2 rounded-full transition-all ${i === currentBanner ? 'bg-white w-4' : 'bg-white/50'}`}
                   />
                 ))}
               </div>
            )}
         </div>
      ) : (
         <section className="w-full relative bg-gray-100 overflow-hidden">
            <div className="aspect-[21/9] md:aspect-[3/1] w-full relative">
              <img 
                src="https://images.unsplash.com/photo-1574724773809-5a8b75fcfa1c?q=80&w=2500" 
                alt="Banner Promocional" 
                className="w-full h-full object-cover"
              />
            </div>
          </section>
      )}

      <section className="bg-white border-b border-gray-100 py-8">
        <div className="container mx-auto px-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="flex items-center gap-6 md:justify-center min-w-max">
            {mainCategories.map((cat) => (
              <Link to={`/categoria/${cat.slug}`} key={cat.id} className="flex flex-col items-center gap-3 group">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border border-gray-100 group-hover:border-[#C8102E] transition-colors p-1 flex items-center justify-center font-serif text-3xl font-bold bg-slate-50 text-slate-300 uppercase">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    cat.name.charAt(0)
                  )}
                </div>
                <span className="text-xs md:text-sm font-sans text-gray-700 group-hover:text-[#C8102E] font-medium">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 mt-12 space-y-16">
        {loading ? (
          <div className="flex justify-center py-20 text-gray-400 font-bold">Carregando...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Nenhum produto cadastrado no momento.</div>
        ) : (
          categories.map(({ category, products }) => (
            <section key={category.id}>
              <div className="flex flex-col items-center justify-center mb-8">
                <h2 className="font-heading text-3xl font-bold text-[#1A1A1A]">{category.name}</h2>
                <div className="w-24 h-1 bg-[#C8102E] mt-4"></div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
                  <div key={product.id} onClick={() => navigateToProduct(product.id)}>
                    <Card className="overflow-hidden bg-white hover:shadow-lg transition-shadow border border-gray-100 rounded-sm group cursor-pointer h-full flex flex-col">
                      <div className="relative aspect-square overflow-hidden bg-white p-4">
                        <img 
                          src={product.images[0] || 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&q=80'} 
                          alt={product.name} 
                          className={`w-full h-full object-contain transition-transform duration-500 ${product.stock_qty <= 0 ? 'opacity-50 grayscale' : 'group-hover:scale-105'}`}
                        />
                        {product.stock_qty <= 0 && (
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white font-bold py-2 px-4 rounded text-sm whitespace-nowrap">
                            Esgotado
                          </div>
                        )}
                        {product.stock_qty > 0 && product.original_price && product.original_price > product.price && (
                          <div className="absolute top-0 right-0 bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                            Oferta
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 md:p-5 flex flex-col flex-1 bg-white border-t border-gray-50">
                        <div className="flex justify-between items-center text-[10px] md:text-xs text-gray-400 mb-2">
                           <span className="truncate">{category.name}</span>
                           <span className="flex items-center gap-1 text-[#F5A623]">Hoje</span>
                        </div>
                        
                        <h3 className={`font-serif text-sm md:text-base mb-1 transition-colors leading-snug line-clamp-2 h-10 md:h-12 ${product.stock_qty <= 0 ? 'text-gray-400' : 'group-hover:text-[#C8102E]'}`}>
                          {product.name}
                        </h3>
                        
                        <div className="mt-auto pt-4 flex items-center justify-between">
                          <div className="flex flex-col">
                            {product.original_price && product.original_price > product.price && (
                              <span className="text-[10px] text-gray-400 line-through leading-none mb-1">
                                {formatCurrency(product.original_price)}
                              </span>
                            )}
                            <span className={`font-sans text-base md:text-lg font-bold leading-none ${product.stock_qty <= 0 ? 'text-gray-400' : 'text-[#1A1A1A]'}`}>
                              {formatCurrency(product.price)}
                            </span>
                          </div>
                          
                          <button 
                            onClick={(e) => {
                              if (product.stock_qty > 0) handleAddToCart(e, product);
                              else e.preventDefault();
                            }}
                            disabled={product.stock_qty <= 0}
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                              product.stock_qty <= 0 
                                ? 'border-gray-200 text-gray-300' 
                                : 'border-green-600 text-green-600 hover:bg-green-600 hover:text-white'
                            }`}
                          >
                            <span className="text-xl md:text-2xl leading-none -mt-1">+</span>
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
