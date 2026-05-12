import { useState, useEffect } from "react";
import { supabase, Order } from "@/src/lib/supabase";
import { formatCurrency } from "@/src/lib/utils/payment";
import { CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  }

  const updateStatus = async (order: Order, newStatus: string) => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", order.id);
      if (error) throw error;

      // Deduct stock if moving from pendente to confirmado
      if (newStatus === 'confirmado' && order.status === 'pendente') {
         if (Array.isArray(order.items)) {
           for (const item of order.items) {
              const productId = item.productId || item.id;
              if (!productId) continue;
              const { data: prodData } = await supabase.from("products").select("stock_qty").eq("id", productId).single();
              if (prodData && typeof prodData.stock_qty === 'number') {
                 const newStock = Math.max(0, prodData.stock_qty - (item.quantity || 1));
                 await supabase.from("products").update({ stock_qty: newStock }).eq("id", productId);
              }
           }
         }
      }

      toast.success("Status atualizado");
      fetchOrders();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-zinc-400 mt-2">Histórico de pedidos recebidos.</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="p-4">Data</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status</th>
              <th className="p-4">WhatsApp</th>
            </tr>
          </thead>
          <tbody>
            {!loading && orders.map((order) => (
              <tr key={order.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition">
                <td className="p-4 font-mono text-zinc-300">
                  {new Date(order.created_at).toLocaleString("pt-BR")}
                </td>
                <td className="p-4">
                  <div className="font-bold text-white">{order.customer_name}</div>
                  <div className="text-xs text-zinc-500">{order.customer_phone || order.customer_email}</div>
                </td>
                <td className="p-4 font-mono font-bold text-[#C8102E]">
                  {formatCurrency(order.total)}
                </td>
                <td className="p-4">
                  <select 
                    value={order.status}
                    onChange={(e) => updateStatus(order, e.target.value)}
                    className="bg-zinc-800 text-white rounded p-1 text-xs font-bold uppercase outline-none"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="confirmado">Venda Confirmada</option>
                    <option value="em_preparo">Em Preparo</option>
                    <option value="enviado">Enviado</option>
                    <option value="entregue">Entregue</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </td>
                <td className="p-4">
                  {order.whatsapp_sent ? (
                    <span className="text-green-500 flex items-center gap-1 text-xs font-bold uppercase"><CheckCircle className="w-4 h-4"/> Enviado</span>
                  ) : (
                    <span className="text-zinc-500 text-xs font-bold uppercase">Não Enviado</span>
                  )}
                </td>
              </tr>
            ))}
            {loading && <tr><td colSpan={5} className="p-8 text-center text-zinc-500">Carregando pedidos...</td></tr>}
            {!loading && orders.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-zinc-500">Nenhum pedido encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
