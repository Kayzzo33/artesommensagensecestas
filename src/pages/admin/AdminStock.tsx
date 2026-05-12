import { useState, useEffect } from "react";
import { supabase, Product } from "@/src/lib/supabase";
import { formatCurrency } from "@/src/lib/utils/payment";
import { toast } from "sonner";
import { Package, Search } from "lucide-react";

export default function AdminStock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase.from("products").select("*").order("name");
    if (data) setProducts(data);
    setLoading(false);
  }

  const handleUpdateStock = async (id: string, qty: number) => {
    try {
      if (qty < 0) qty = 0;
      const { error } = await supabase.from("products").update({ stock_qty: qty }).eq("id", id);
      if (error) throw error;
      toast.success("Estoque atualizado.");
      setProducts(products.map(p => p.id === id ? { ...p, stock_qty: qty } : p));
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque</h1>
          <p className="text-zinc-400 mt-2">Gerencie a quantidade disponível dos seus produtos.</p>
        </div>
        
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
           <input 
             type="text" 
             placeholder="Buscar produto..." 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg pl-10 pr-4 py-2 outline-none focus:border-[#C8102E]"
           />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="p-4 w-12"></th>
              <th className="p-4">Produto</th>
              <th className="p-4">Preço</th>
              <th className="p-4">Quantidade em Estoque</th>
            </tr>
          </thead>
          <tbody>
            {!loading && filtered.map((product) => (
              <tr key={product.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition">
                <td className="p-4">
                   <div className="w-10 h-10 bg-zinc-800 rounded overflow-hidden flex items-center justify-center">
                     {product.images?.[0] ? <img src={product.images[0]} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-zinc-600" />}
                   </div>
                </td>
                <td className="p-4 font-bold">{product.name}</td>
                <td className="p-4 text-zinc-400 font-mono">{formatCurrency(product.price)}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                     <button onClick={() => handleUpdateStock(product.id, (product.stock_qty || 0) - 1)} className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded hover:bg-zinc-700 font-bold">-</button>
                     <span className="w-12 text-center font-mono font-bold text-lg">{product.stock_qty || 0}</span>
                     <button onClick={() => handleUpdateStock(product.id, (product.stock_qty || 0) + 1)} className="w-8 h-8 flex items-center justify-center bg-zinc-800 rounded hover:bg-zinc-700 font-bold">+</button>
                  </div>
                </td>
              </tr>
            ))}
            {loading && <tr><td colSpan={4} className="p-8 text-center text-zinc-500">Carregando estoques...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-zinc-500">Nenhum produto encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
