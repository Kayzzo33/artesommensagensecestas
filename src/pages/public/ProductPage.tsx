import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase, Product } from "@/src/lib/supabase";
import { formatCurrency } from "@/src/lib/utils/payment";
import { useCartStore } from "@/src/store/cartStore";
import { toast } from "sonner";
import { Check, Truck, CreditCard, ChevronLeft } from "lucide-react";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [includeMessage, setIncludeMessage] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      window.scrollTo(0, 0); // scroll to top when changing product
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      
      if (!error && data) {
        setProduct(data);
        
        // Fetch related products from same category or random
        let query = supabase.from("products").select("*").eq("active", true).neq("id", id).limit(4);
        if (data.category_id) {
          query = query.eq("category_id", data.category_id);
        }
        const { data: relatedData } = await query;
        if (relatedData && relatedData.length > 0) {
          setRelatedProducts(relatedData);
        } else {
          // If no related in category, fetch random via standard limit
          const { data: fallbackData } = await supabase.from("products").select("*").eq("active", true).neq("id", id).limit(4);
          if (fallbackData) setRelatedProducts(fallbackData);
        }

      } else {
        setProduct(null);
      }
      setLoading(false);
    }
    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images[0] || "",
      category: product.category_id || "Geral",
      message: includeMessage ? message : undefined,
      messageFee: includeMessage ? product.message_fee : 0,
    });
    toast.success(`${product.name} adicionado ao carrinho!`);
    navigate("/carrinho");
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-20 text-center animate-pulse">Carregando detalhes do produto...</div>;
  }

  if (!product) {
    return <div className="container mx-auto px-4 py-20 text-center font-bold">Produto não encontrado.</div>;
  }

  return (
    <div className="bg-[#FFF9F0] min-h-screen pb-20">
      {/* Breadcrumb / Top Bar */}
      <div className="bg-[#1A1A1A] text-white py-3 px-4 shadow-md">
        <div className="container mx-auto flex items-center text-xs md:text-sm">
          <Link to="/" className="hover:text-[#F5A623] flex items-center gap-1 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Arte Som
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-300 line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 md:mt-12 max-w-6xl">
        <div className="bg-white grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden shadow-sm border border-gray-100">
          
          {/* Image Gallery */}
          <div className="p-4 md:p-8 bg-gray-50 flex items-center justify-center border-r border-gray-100">
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="w-full max-w-md h-auto mix-blend-multiply object-contain hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Product Details */}
          <div className="p-6 md:p-10 flex flex-col justify-center">
            
            <div className="mb-6 border-b border-gray-100 pb-6">
              <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-3 uppercase tracking-wider">
                <span className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-sm"><Check className="w-3 h-3" /> Disponível Hoje</span>
              </div>
              <h1 className="font-heading text-2xl md:text-4xl font-bold text-[#1A1A1A] leading-tight mb-4">
                {product.name}
              </h1>
              
              <div className="flex items-end gap-3 mb-2">
                <span className="font-sans text-3xl md:text-4xl font-bold text-[#C8102E]">
                  {formatCurrency(product.price)}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-sm md:text-base text-gray-400 line-through mb-1">
                    {formatCurrency(product.original_price)}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed mt-4">
                {product.description}
              </p>
            </div>

            <div className="mb-8 space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-gray-400" />
                <span>Fretes grátis disponíveis para bairros próximos</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-gray-400" />
                <span>Entregamos em até 3 dias para cidades próximas de Maracás</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <span>Pix ou até 3x sem juros no cartão de crédito via WhatsApp</span>
              </div>
            </div>

            {product.allows_message && (
              <div className="mb-8 bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <input 
                    type="checkbox" 
                    id="includeMessage" 
                    checked={includeMessage}
                    onChange={(e) => setIncludeMessage(e.target.checked)}
                    className="w-4 h-4 text-[#C8102E] rounded border-gray-300 focus:ring-[#C8102E]"
                  />
                  <label htmlFor="includeMessage" className="font-bold cursor-pointer text-sm">
                    Incluir mensagem personalizada no cartão?
                    {product.message_fee > 0 && <span className="text-gray-500 font-normal ml-1">(+{formatCurrency(product.message_fee)})</span>}
                  </label>
                </div>
                {includeMessage && (
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escreva sua mensagem aqui (máx 200 caracteres)..."
                    maxLength={200}
                    className="w-full mt-2 p-3 border border-gray-200 rounded-md text-sm focus:ring-1 focus:ring-[#C8102E] outline-none resize-none h-24"
                  />
                )}
              </div>
            )}

            <button 
              onClick={handleAddToCart}
              className="w-full bg-[#1A1A1A] text-white font-bold tracking-widest uppercase py-4 rounded-sm hover:bg-[#C8102E] transition-colors"
            >
              Comprar Para Hoje
            </button>

          </div>
        </div>
        
        {/* Further details */}
        <div className="mt-8 bg-white p-6 md:p-10 shadow-sm border border-gray-100 mb-12">
          <h3 className="font-heading text-xl font-bold mb-4 uppercase text-[#1A1A1A]">Observações Importantes</h3>
          <p className="text-gray-600 text-sm leading-relaxed border-l-4 border-[#C8102E] pl-4 italic">
            Todos os nossos itens são confeccionados de forma artesanal e com produtos de altíssima qualidade pela própria Arte Som. 
            Os tipos de embalagens e detalhes decorativos poderão sofrer pequenas variações de acordo com a disponibilidade em estoque, sempre mantendo a mesma excelência e o mesmo propósito do presente.
            <br/><br/>
            <strong>Atenção:</strong> A imagem apresentada deste produto é similar ao que será entregue, podendo haver sutis diferenças.
          </p>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 mb-8">
            <h2 className="font-heading text-2xl font-bold mb-6 text-[#1A1A1A]">Você também pode gostar</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map((prod) => (
                <Link to={`/produto/${prod.id}`} key={prod.id} className="group flex flex-col">
                  <div className="aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden mb-4 relative">
                    {prod.images && prod.images.length > 0 ? (
                      <img 
                        src={prod.images[0]} 
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out mix-blend-multiply" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">Sem imagem</div>
                    )}
                    {prod.original_price && prod.original_price > prod.price && (
                      <div className="absolute top-2 left-2 bg-[#C8102E] text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                        Oferta
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-[#C8102E] transition-colors leading-snug line-clamp-2 mb-1 text-sm">{prod.name}</h3>
                  <div className="mt-auto pt-2 flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-[#1A1A1A]">{formatCurrency(prod.price)}</span>
                    {prod.original_price && prod.original_price > prod.price && (
                      <span className="font-mono text-xs text-gray-400 line-through">{formatCurrency(prod.original_price)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
