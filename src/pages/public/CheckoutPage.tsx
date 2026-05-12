import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCartStore } from "@/src/store/cartStore";
import { formatCurrency, checkoutSchema, CheckoutFormData } from "@/src/lib/utils/payment";
import { supabase, Neighborhood } from "@/src/lib/supabase";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Admin WhatsApp
const WHATSAPP_NUMBER = (import.meta as any).env.VITE_WHATSAPP_NUMBER || "5511999999999";

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [storeNumber, setStoreNumber] = useState((import.meta as any).env.VITE_WHATSAPP_NUMBER || "5511999999999");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema) as any,
  });

  const selectedBairroId = watch("neighborhood_id");
  const selectedBairro = neighborhoods.find(b => b.id === selectedBairroId);
  const shippingFee = selectedBairro ? selectedBairro.shipping_fee : 0;
  const total = subtotal() + shippingFee;

  const soundCarEnabled = watch("sound_car_message_enabled");

  useEffect(() => {
    async function fetchData() {
      const { data: nData } = await supabase.from("neighborhoods").select("*").eq("active", true);
      if (nData && nData.length > 0) setNeighborhoods(nData);

      const { data: sData } = await supabase.from("store_settings").select("whatsapp_number").limit(1).single();
      if (sData?.whatsapp_number) setStoreNumber(sData.whatsapp_number);
    }
    fetchData();
  }, []);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // 1. Save to Supabase
      const orderPayload = {
        customer_name: data.customer_name,
        customer_email: data.customer_email || "N/A",
        customer_phone: data.customer_phone || "",
        neighborhood_id: data.neighborhood_id,
        address_street: data.address_street,
        address_number: data.address_number,
        address_complement: data.address_complement,
        items: JSON.parse(JSON.stringify(items)),
        subtotal: subtotal(),
        shipping_fee: shippingFee,
        total: total,
        personal_message: data.sound_car_message_enabled ? data.personal_message : null,
        notes: data.notes,
        status: "pendente",
        whatsapp_sent: true,
      };

      const { error } = await supabase.from("orders").insert([orderPayload]);
      if (error) {
        console.error("Order error", error);
        // Dont block if DB fails but log it. We want WhatsApp to open.
      }

      // 2. Format WhatsApp Message
      const itemsText = items.map(i => `- ${i.name} x${i.quantity} — ${formatCurrency(i.price)}`).join("\n");
      const personalMsg = data.sound_car_message_enabled ? `Mensagem Carro de Som:\n${data.personal_message || "Sem mensagem"}` : "";
      const msg = `Olá! Gostaria de fazer um pedido na Arte Som.\n\nNome: ${data.customer_name}\nEndereço: ${data.address_street}, ${data.address_number} ${data.address_complement ? `- ${data.address_complement}` : ''} - ${selectedBairro?.name}\n\nItens:\n${itemsText}\n\n${personalMsg}\n\nSubtotal: ${formatCurrency(subtotal())}\nFrete (${selectedBairro?.name}): ${formatCurrency(shippingFee)}\nTotal: *${formatCurrency(total)}*\n\nObservações: ${data.notes || "Nenhuma"}`;

      // 3. Open WhatsApp
      window.open(`https://wa.me/${storeNumber.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      
      clearCart();
      toast.success("Pedido gerado com sucesso! Redirecionando para o WhatsApp...");
      
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err) {
      toast.error("Ocorreu um erro ao processar o checkout.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) return <div className="text-center py-20 font-bold">Carrinho vazio</div>;

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="font-heading text-4xl font-bold mb-10 text-[#1A1A1A]">Finalizar Pedido</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3 space-y-8 bg-white p-8 rounded-3xl shadow-sm">
          <div>
            <h2 className="font-heading text-2xl font-bold border-b pb-4 mb-6">Seus Dados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Nome Completo</Label>
                <Input {...register("customer_name")} className="bg-gray-50 border-gray-200" />
                {errors.customer_name && <p className="text-xs text-red-500">{errors.customer_name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>E-mail (Opcional)</Label>
                <Input type="email" {...register("customer_email")} className="bg-gray-50 border-gray-200" />
                {errors.customer_email && <p className="text-xs text-red-500">{errors.customer_email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Telefone (WhatsApp)</Label>
                <Input {...register("customer_phone")} className="bg-gray-50 border-gray-200" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-heading text-2xl font-bold border-b pb-4 mb-6">Entrega</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Bairro</Label>
                <select 
                  {...register("neighborhood_id")} 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Selecione seu bairro...</option>
                  {neighborhoods.map(b => (
                    <option key={b.id} value={b.id}>{b.name} - {formatCurrency(b.shipping_fee)}</option>
                  ))}
                </select>
                {errors.neighborhood_id && <p className="text-xs text-red-500">{errors.neighborhood_id.message}</p>}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Rua</Label>
                <Input {...register("address_street")} className="bg-gray-50 border-gray-200" />
                {errors.address_street && <p className="text-xs text-red-500">{errors.address_street.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input {...register("address_number")} className="bg-gray-50 border-gray-200" />
                {errors.address_number && <p className="text-xs text-red-500">{errors.address_number.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Complemento (opcional)</Label>
                <Input {...register("address_complement")} className="bg-gray-50 border-gray-200" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-heading text-2xl font-bold border-b pb-4 mb-6">Mensagem e Observações</h2>
            <div className="space-y-6">
              <div className="bg-white border rounded-xl overflow-hidden p-4 space-y-4">
                 <div className="flex items-center gap-3">
                   <input type="checkbox" id="sound_car" {...register("sound_car_message_enabled")} className="w-5 h-5 accent-[#C8102E] cursor-pointer" />
                   <Label htmlFor="sound_car" className="cursor-pointer font-bold text-base">Deseja incluir mensagem personalizada no carro de som?</Label>
                 </div>
                 {soundCarEnabled && (
                   <div className="space-y-2 pt-2 border-t">
                     <Label className="text-gray-500 text-sm">O que o carro de som deverá falar?</Label>
                     <Textarea {...register("personal_message")} placeholder="Ex: Hoje é o dia da pessoa mais especial..." className="bg-gray-50 border-gray-200 resize-none h-24" />
                     {errors.personal_message && <p className="text-xs text-red-500">{errors.personal_message.message}</p>}
                   </div>
                 )}
              </div>
              <div className="space-y-2">
                <Label>Observações do Pedido</Label>
                <Textarea {...register("notes")} placeholder="Ex: Entregar de manhã, alergia a amendoim..." className="bg-gray-50 border-gray-200 resize-none h-24" />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-3xl shadow-sm sticky top-24">
            <h2 className="font-heading font-bold text-2xl mb-6">Resumo do Pedido</h2>
            
            <div className="space-y-4 mb-6 text-sm">
              {items.map(item => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <span className="font-bold">{item.quantity}x</span> {item.name}
                  </div>
                  <span className="font-mono font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-3 mb-6">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(subtotal())}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Frete</span>
                <span className="font-mono">{selectedBairro ? formatCurrency(shippingFee) : "--"}</span>
              </div>
            </div>
            
            <div className="border-t border-b py-4 mb-8">
              <div className="flex justify-between items-center bg-[#FFF9F0] p-4 rounded-xl">
                <span className="font-bold text-lg">Total</span>
                <span className="font-mono font-bold text-2xl text-[#C8102E]">{formatCurrency(total)}</span>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#1A1A1A] text-white font-bold py-4 rounded-full hover:bg-black transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isSubmitting ? "Processando..." : "Enviar Pedido por WhatsApp"}
            </button>
            <p className="text-center text-xs text-gray-400 mt-4">
              O pagamento não é efetuado agora. Você será redirecionado para concluir com a loja.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
