import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase, Order, FinancialRecord } from "@/src/lib/supabase";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    profit: 0
  });
  const [loading, setLoading] = useState(true);

  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session.session) return;

        const { data: oData } = await supabase.from("orders").select("*");
        const { data: eData } = await supabase.from("financial_records").select("*").eq("type", "despesa");
        
        let totalOrders = 0;
        let totalRevenue = 0;
        let totalExpenses = 0;

        let lastDaysMoves: Record<string, { receitas: number, despesas: number }> = {};
        const today = new Date();
        for (let i = 4; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const shortName = d.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' });
          lastDaysMoves[dateStr] = { receitas: 0, despesas: 0, name: shortName } as any;
        }

        if (oData) {
           totalOrders = oData.length;
           oData.forEach(o => {
              if (['confirmado', 'em_preparo', 'enviado', 'entregue'].includes(o.status)) {
                 totalRevenue += o.total;
                 const dStr = o.created_at.split('T')[0];
                 if (lastDaysMoves[dStr]) lastDaysMoves[dStr].receitas += o.total;
              }
           });
        }

        if (eData) {
           eData.forEach(e => {
              totalExpenses += e.amount;
              const dStr = e.reference_date.split('T')[0];
              if(lastDaysMoves[dStr]) lastDaysMoves[dStr].despesas += e.amount;
           });
        }

        setMetrics({
          totalOrders,
          totalRevenue,
          totalExpenses,
          profit: totalRevenue - totalExpenses
        });

        setChartData(Object.values(lastDaysMoves));

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-zinc-400 mt-2">Visão geral do desempenho da loja.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Total de Pedidos</h3>
            <div className="text-3xl font-bold">{loading ? "..." : metrics.totalOrders}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Receita Total</h3>
            <div className="text-3xl font-bold font-mono text-green-500">{loading ? "..." : formatCurrency(metrics.totalRevenue)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Despesas</h3>
            <div className="text-3xl font-bold font-mono text-red-500">{loading ? "..." : formatCurrency(metrics.totalExpenses)}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-zinc-400 mb-2">Lucro Estimado</h3>
            <div className={`text-3xl font-bold font-mono ${metrics.profit >= 0 ? 'text-[#10b981]' : 'text-red-500'}`}>{loading ? "..." : formatCurrency(metrics.profit)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-6">Receitas x Despesas (Visão Geral)</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#e4e4e7' }}
                  formatter={(value: number) => [formatCurrency(value), ""]}
                />
                <Area type="monotone" dataKey="receitas" stroke="#10b981" fillOpacity={1} fill="url(#colorReceita)" strokeWidth={2} name="Receita" />
                <Area type="monotone" dataKey="despesas" stroke="#ef4444" fillOpacity={1} fill="url(#colorDespesa)" strokeWidth={2} name="Despesa" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
