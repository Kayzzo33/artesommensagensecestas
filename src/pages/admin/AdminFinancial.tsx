import { useState, useEffect } from "react";
import { supabase, Order, FinancialRecord } from "@/src/lib/supabase";
import { formatCurrency } from "@/src/lib/utils/payment";
import { TrendingUp, TrendingDown, DollarSign, Plus } from "lucide-react";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function AdminFinancial() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<FinancialRecord>>({
    description: "", amount: 0, category: "mercadoria", reference_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: oData } = await supabase.from("orders").select("*").in("status", ["confirmado", "enviado", "entregue"]).order("created_at", { ascending: false });
    if (oData) setOrders(oData);

    const { data: eData } = await supabase.from("financial_records").select("*").eq("type", "despesa").order("reference_date", { ascending: false });
    if (eData) setExpenses(eData);

    setLoading(false);
  }

  const handleAddExpense = async () => {
    try {
       if (!formData.description || !formData.amount) return toast.error("Preencha descrição e valor");
       const { error } = await supabase.from("financial_records").insert([{
          type: "despesa",
          description: formData.description,
          amount: formData.amount,
          category: formData.category,
          reference_date: formData.reference_date
       }]);
       if (error) throw error;
       toast.success("Despesa registrada com sucesso!");
       setIsFormOpen(false);
       setFormData({ description: "", amount: 0, category: "mercadoria", reference_date: new Date().toISOString().split('T')[0] });
       fetchData();
    } catch(err: any) {
       toast.error("Erro: " + err.message);
    }
  };

  const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const profit = totalRevenue - totalExpenses;

  // Render lists
  const allMoves = [
     ...orders.map(o => ({ id: o.id, date: o.created_at, desc: `Pedido #${o.id.split('-')[0]} - ${o.customer_name}`, amount: o.total, type: 'receita' as const })),
     ...expenses.map(e => ({ id: e.id, date: e.reference_date, desc: `Despesa: ${e.description} (${e.category})`, amount: e.amount, type: 'despesa' as const }))
  ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Chart Logic (last 7 days logic could be computed here, keeping simple)

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-zinc-400 mt-2">Visão real do faturamento (pedidos confirmados) e despesas.</p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="bg-[#C8102E] text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-red-700 transition">
          <Plus className="w-4 h-4" /> Registrar Despesa / Compra
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
             <label className="block text-zinc-400 mb-1 text-sm">Data</label>
             <input type="date" value={formData.reference_date || ""} onChange={(e) => setFormData({...formData, reference_date: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white" />
           </div>
           <div>
             <label className="block text-zinc-400 mb-1 text-sm">Categoria</label>
             <select value={formData.category || ""} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white">
                <option value="mercadoria">Compra de Mercadoria / Insumo</option>
                <option value="frete">Logística / Frete</option>
                <option value="embalagem">Embalagens</option>
                <option value="outros">Outros</option>
             </select>
           </div>
           <div className="md:col-span-2">
             <label className="block text-zinc-400 mb-1 text-sm">Descrição</label>
             <input type="text" value={formData.description || ""} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Ex: Compra de 50 caixas no Atacadão" className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white" />
           </div>
           <div>
             <label className="block text-zinc-400 mb-1 text-sm">Valor Gasto (R$)</label>
             <input type="number" step="0.01" value={formData.amount || ""} onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white" />
           </div>
           <div className="md:col-span-2 flex justify-end gap-2 mt-2">
              <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 bg-zinc-800 rounded font-bold hover:bg-zinc-700">Cancelar</button>
              <button onClick={handleAddExpense} className="px-4 py-2 bg-[#C8102E] rounded font-bold hover:bg-red-700">Salvar Despesa</button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center gap-4">
           <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center border border-green-500/20">
             <TrendingUp className="w-6 h-6" />
           </div>
           <div>
             <p className="text-zinc-400 text-sm font-bold">Entradas (Pedidos)</p>
             <p className="text-2xl font-bold font-mono text-white">{loading ? '...' : formatCurrency(totalRevenue)}</p>
           </div>
        </div>
        
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center gap-4">
           <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center border border-red-500/20">
             <TrendingDown className="w-6 h-6" />
           </div>
           <div>
             <p className="text-zinc-400 text-sm font-bold">Saídas (Despesas)</p>
             <p className="text-2xl font-bold font-mono text-white">{loading ? '...' : formatCurrency(totalExpenses)}</p>
           </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center gap-4">
           <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center border border-blue-500/20">
             <DollarSign className="w-6 h-6" />
           </div>
           <div>
             <p className="text-zinc-400 text-sm font-bold">Lucro Liquido</p>
             <p className={`text-2xl font-bold font-mono ${profit >= 0 ? 'text-[#10b981]' : 'text-red-500'}`}>{loading ? '...' : formatCurrency(profit)}</p>
           </div>
        </div>
      </div>
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
         <h2 className="text-xl font-bold mb-4">Relatório de Entradas e Saídas</h2>
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[600px]">
                <thead className="text-zinc-500 border-b border-zinc-800">
                   <tr>
                      <th className="pb-3 w-32">Data</th>
                      <th className="pb-3 w-20">Tipo</th>
                      <th className="pb-3">Descrição (Motivo)</th>
                      <th className="pb-3 text-right">Valor</th>
                   </tr>
                </thead>
                <tbody>
                   {loading && <tr><td colSpan={4} className="py-4 text-center text-zinc-500">Carregando...</td></tr>}
                   {!loading && allMoves.slice(0, 20).map(move => (
                      <tr key={`${move.type}-${move.id}`} className="border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/20">
                         <td className="py-3 font-mono text-zinc-400">{new Date(move.date).toLocaleDateString('pt-BR')}</td>
                         <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${move.type === 'receita' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                               {move.type}
                            </span>
                         </td>
                         <td className="py-3 font-bold text-zinc-300">{move.desc}</td>
                         <td className={`py-3 font-mono font-bold text-right ${move.type === 'receita' ? 'text-green-500' : 'text-red-500'}`}>
                           {move.type === 'despesa' ? '-' : '+'}{formatCurrency(move.amount)}
                         </td>
                      </tr>
                   ))}
                   {!loading && allMoves.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-zinc-500">Nenhuma movimentação.</td></tr>}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
