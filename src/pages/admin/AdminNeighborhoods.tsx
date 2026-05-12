import { useState, useEffect } from "react";
import { supabase, Neighborhood } from "@/src/lib/supabase";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function AdminNeighborhoods() {
  const [dataList, setDataList] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Neighborhood>>({ name: "", shipping_fee: 0, active: true });

  useEffect(() => { fetchData() }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase.from("neighborhoods").select("*").order("name");
    if (data) setDataList(data);
    setLoading(false);
  }

  const handleCreate = async () => {
    try {
      if (!formData.name) return toast.error("Nome é obrigatório");
      let error;
      if (formData.id) {
        const { error: updateErr } = await supabase.from("neighborhoods").update({
          name: formData.name,
          shipping_fee: formData.shipping_fee,
          active: formData.active
        }).eq("id", formData.id);
        error = updateErr;
      } else {
        const { error: insertErr } = await supabase.from("neighborhoods").insert([{
          name: formData.name,
          shipping_fee: formData.shipping_fee,
          active: formData.active
        }]);
        error = insertErr;
      }

      if (error) throw error;
      toast.success("Salvo com sucesso!");
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      // First check if orders use this neighborhood
      const { data: orders } = await supabase.from("orders").select("id").eq("neighborhood_id", id).limit(1);
      if (orders && orders.length > 0) {
         toast.error("Não é possível excluir: existem pedidos atrelados a este bairro. Apenas desative-o.");
         return;
      }

      const { error } = await supabase.from("neighborhoods").delete().eq("id", id);
      if (error) throw error;
      toast.success("Bairro excluído.");
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao excluir: " + (err.message || err.toString()));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bairros e Fretes</h1>
        </div>
        <button onClick={() => { setFormData({ name: "", shipping_fee: 0, active: true }); setIsFormOpen(true); }} className="bg-[#C8102E] text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-red-700 transition">
          <Plus className="w-4 h-4" /> Novo Bairro
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-zinc-400 mb-1 text-sm">Nome do Bairro*</label>
            <input type="text" value={formData.name || ""} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white outline-none focus:border-[#C8102E]" />
          </div>
          <div>
            <label className="block text-zinc-400 mb-1 text-sm">Taxa R$*</label>
            <input type="number" step="0.01" value={formData.shipping_fee || ""} onChange={(e) => setFormData({...formData, shipping_fee: Number(e.target.value)})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white outline-none focus:border-[#C8102E]" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="bg-[#C8102E] text-white h-[42px] px-4 rounded font-bold w-full hover:bg-red-700 transition">Salvar</button>
            <button onClick={() => setIsFormOpen(false)} className="bg-zinc-800 text-white h-[42px] px-4 rounded font-bold w-full hover:bg-zinc-700 transition">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
            <tr><th className="p-4">Nome</th><th className="p-4">Frete</th><th className="p-4">Ações</th></tr>
          </thead>
          <tbody>
            {!loading && dataList.map((item) => (
              <tr key={item.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition">
                <td className="p-4 font-bold">{item.name}</td>
                <td className="p-4 font-mono">R$ {item.shipping_fee}</td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => { setFormData(item); setIsFormOpen(true); }} className="text-blue-400 hover:bg-blue-400/10 p-2 rounded transition"><Pencil className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:bg-red-400/10 p-2 rounded transition"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
            {loading && <tr><td colSpan={3} className="p-6 text-center text-zinc-500">Carregando...</td></tr>}
            {!loading && dataList.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-zinc-500">Nenhum bairro cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
