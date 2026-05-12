import React, { useState, useEffect } from "react";
import { supabase } from "@/src/lib/supabase";
import { formatCurrency } from "@/src/lib/utils/payment";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CustomBasket() {
  const [storeNumber, setStoreNumber] = useState((import.meta as any).env.VITE_WHATSAPP_NUMBER || "5511999999999");
  
  const [formData, setFormData] = useState({
    budget: "",
    theme: "",
    occasion: "",
    recipient: "",
    details: "",
    name: ""
  });

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from("store_settings").select("whatsapp_number").limit(1).single();
      if (data?.whatsapp_number) setStoreNumber(data.whatsapp_number);
    }
    fetchSettings();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Seu nome é obrigatório");
    
    const msg = `*Monte sua Cesta - Solicitação*\n\n`
      + `*Nome:* ${formData.name}\n`
      + `*Orçamento Estimado:* ${formData.budget || "Não informado"}\n`
      + `*Estilo/Tema:* ${formData.theme || "Não informado"}\n`
      + `*Data Festiva/Ocasião:* ${formData.occasion || "Não informado"}\n`
      + `*Para quem é:* ${formData.recipient || "Não informado"}\n`
      + `*Detalhes adicionais:* ${formData.details || "Nenhum"}\n\n`
      + `Gostaria de ajuda para montar essa cesta customizada!`;

    window.open(`https://wa.me/${storeNumber.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center mb-10">
        <h1 className="font-heading text-4xl font-bold mb-4 text-[#1A1A1A]">Monte sua Cesta</h1>
        <p className="text-gray-600">Quer algo específico? Preencha os detalhes abaixo e nós montamos a cesta ideal para o seu momento!</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm space-y-6">
        <div className="space-y-2">
          <Label>Como você se chama?</Label>
          <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Seu nome" className="bg-gray-50 border-gray-200" />
        </div>

        <div className="space-y-2">
          <Label>Para quem é a cesta?</Label>
          <Input value={formData.recipient} onChange={e => setFormData({...formData, recipient: e.target.value})} placeholder="Ex: Namorada, mãe, amigo..." className="bg-gray-50 border-gray-200" />
        </div>

        <div className="space-y-2">
          <Label>Qual a ocasião ou data festiva?</Label>
          <Input value={formData.occasion} onChange={e => setFormData({...formData, occasion: e.target.value})} placeholder="Ex: Aniversário, Dia dos Namorados, pedido de desculpas..." className="bg-gray-50 border-gray-200" />
        </div>

        <div className="space-y-2">
          <Label>Qual o estilo ou tema desejado?</Label>
          <Input value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})} placeholder="Ex: Cesta de café colonial, Cesta de chocolates romântica, Cesta de cervejas..." className="bg-gray-50 border-gray-200" />
        </div>

        <div className="space-y-2">
          <Label>Você tem algum orçamento estimado em mente? (Opcional)</Label>
          <Input value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} placeholder="Ex: Até R$ 250,00" className="bg-gray-50 border-gray-200" />
        </div>

        <div className="space-y-2">
          <Label>Mais algum detalhe? (Opcional)</Label>
          <Textarea 
            value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})}
            placeholder="Ex: A pessoa não gosta de avelã, gosta de itens sem glúten, cor favorita é vermelho..." 
            className="bg-gray-50 border-gray-200 resize-none h-32" 
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-[#1A1A1A] text-white font-bold py-4 rounded-full hover:bg-black transition-transform hover:scale-105"
        >
          Enviar Pedido pelo WhatsApp
        </button>
      </form>
    </div>
  );
}
