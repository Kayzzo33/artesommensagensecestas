import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase, Product, Category } from "@/src/lib/supabase";
import { formatCurrency } from "@/src/lib/utils/payment";
import { ArrowRight } from "lucide-react";

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategory() {
      setLoading(true);
      const { data: catData } = await supabase.from("categories").select("*").eq("slug", slug).single();
      
      if (catData) {
        setCategory(catData);
        const { data: prodData } = await supabase.from("products").select("*").eq("category_id", catData.id).eq("active", true);
        if (prodData) {
          prodData.sort((a, b) => {
            const aHasStock = a.stock_qty > 0;
            const bHasStock = b.stock_qty > 0;
            if (aHasStock && !bHasStock) return -1;
            if (!aHasStock && bHasStock) return 1;
            return 0;
          });
          setProducts(prodData);
        }
      }
      setLoading(false);
    }
    fetchCategory();
  }, [slug]);

  if (loading) return <div className="container mx-auto px-4 py-20 text-center">Carregando...</div>;
  if (!category) return <div className="container mx-auto px-4 py-20 text-center font-bold text-2xl">Categoria não encontrada</div>;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4" style={{ color: category.color || '#1A1A1A' }}>{category.name}</h1>
        {category.description && <p className="text-gray-600 max-w-2xl mx-auto">{category.description}</p>}
      </div>

      {products.length === 0 ? (
        <div className="text-center text-gray-500 py-20">Nenhum produto cadastrado nesta categoria ainda.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {products.map((product) => (
            <Link to={`/produto/${product.id}`} key={product.id} className="group flex flex-col" onClick={(e) => {
              if (product.stock_qty <= 0) e.preventDefault();
            }}>
              <div className="aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden mb-4 relative">
                {product.images && product.images.length > 0 ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className={`w-full h-full object-cover transition-transform duration-700 ease-out ${product.stock_qty <= 0 ? 'opacity-50 grayscale' : 'group-hover:scale-105'}`} 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">Sem imagem</div>
                )}
                {product.stock_qty <= 0 && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white font-bold py-2 px-4 rounded text-sm whitespace-nowrap z-10">
                    Esgotado
                  </div>
                )}
                {product.stock_qty > 0 && product.original_price && product.original_price > product.price && (
                  <div className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                    Oferta
                  </div>
                )}
              </div>
              <h3 className={`font-bold transition-colors leading-snug line-clamp-2 mb-1 ${product.stock_qty <= 0 ? 'text-gray-400' : 'text-gray-900 group-hover:text-[#C8102E]'}`}>{product.name}</h3>
              <div className="mt-auto pt-2 flex items-center gap-2">
                <span className={`font-mono font-bold text-lg ${product.stock_qty <= 0 ? 'text-gray-400' : ''}`}>{formatCurrency(product.price)}</span>
                {product.original_price && product.original_price > product.price && (
                  <span className="font-mono text-sm text-gray-400 line-through">{formatCurrency(product.original_price)}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
