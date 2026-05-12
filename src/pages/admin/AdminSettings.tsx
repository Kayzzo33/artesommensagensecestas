import { useState, useEffect } from "react";
import { supabase, StoreSettings } from "@/src/lib/supabase";
import { toast } from "sonner";

export default function AdminSettings() {
  const [settings, setSettings] = useState<Partial<StoreSettings>>({
    whatsapp_number: "",
    store_name: "Arte Som"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    const { data } = await supabase.from("store_settings").select("*").limit(1).single();
    if (data) {
      setSettings(data);
    }
    setLoading(false);
  }

  async function handleSave() {
    try {
      let error;
      if (settings.id) {
        const { error: updateErr } = await supabase.from("store_settings").update(settings).eq("id", settings.id);
        error = updateErr;
      } else {
        const { error: insertErr } = await supabase.from("store_settings").insert([settings]);
        error = insertErr;
      }
      
      if (error) throw error;
      toast.success("Configurações salvas!");
      fetchSettings();
    } catch (err: any) {
       toast.error("Erro ao salvar: " + err.message);
    }
  }

  if (loading) {
     return <div className="p-8 text-center text-zinc-500">Carregando configurações...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-zinc-400 mt-2">Gerencie informações da loja e integrações.</p>
        </div>
        <button onClick={handleSave} className="bg-[#C8102E] text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition">
          Salvar Alterações
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden p-6 max-w-2xl">
         <div className="space-y-6">
            <div>
              <label className="block text-zinc-400 mb-2 font-bold">Nome da Loja</label>
              <input 
                type="text" 
                value={settings.store_name || ""} 
                onChange={e => setSettings({...settings, store_name: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded text-white outline-none focus:border-[#C8102E]" 
              />
            </div>
            
            <div>
              <label className="block text-zinc-400 mb-2 font-bold">Número de WhatsApp (Receber Pedidos)</label>
              <input 
                type="text" 
                value={settings.whatsapp_number || ""} 
                onChange={e => setSettings({...settings, whatsapp_number: e.target.value})}
                placeholder="Ex: 5511999999999"
                className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded text-white outline-none focus:border-[#C8102E]" 
              />
              <p className="text-xs text-zinc-500 mt-1">Coloque o número com código do país e DDD, apenas números.</p>
            </div>

            <div>
              <label className="block text-zinc-400 mb-2 font-bold">Endereço Físico (Opcional)</label>
              <input 
                type="text" 
                value={settings.address || ""} 
                onChange={e => setSettings({...settings, address: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded text-white outline-none focus:border-[#C8102E]" 
              />
            </div>
            
            <div>
              <label className="block text-zinc-400 mb-2 font-bold">Instagram (Opcional)</label>
              <input 
                type="text" 
                value={settings.instagram_url || ""} 
                onChange={e => setSettings({...settings, instagram_url: e.target.value})}
                placeholder="https://instagram.com/..."
                className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded text-white outline-none focus:border-[#C8102E]" 
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-2 font-bold">Horário de Funcionamento (Opcional)</label>
              <input 
                type="text" 
                value={settings.opening_hours || ""} 
                onChange={e => setSettings({...settings, opening_hours: e.target.value})}
                placeholder="Ex: Seg a Sex: 08h às 18h"
                className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded text-white outline-none focus:border-[#C8102E]" 
              />
            </div>
         </div>
      </div>
    </div>
  );
}
