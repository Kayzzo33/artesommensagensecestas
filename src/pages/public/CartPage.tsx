import { useCartStore } from "@/src/store/cartStore";
import { formatCurrency } from "@/src/lib/utils/payment";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-2xl">
        <h1 className="font-heading text-4xl font-bold mb-6">Seu Carrinho</h1>
        <div className="bg-white p-12 rounded-sm shadow-sm border border-gray-100">
          <p className="text-gray-500 mb-6 text-lg">Seu carrinho está vazio no momento.</p>
          <Link to="/" className="inline-block bg-[#1A1A1A] text-white font-bold py-3 px-8 rounded-sm hover:bg-[#C8102E] transition-colors uppercase tracking-widest text-sm">
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h1 className="font-heading text-4xl font-bold mb-10 text-[#1A1A1A]">Seu Carrinho</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="border border-gray-100 shadow-none rounded-sm overflow-hidden bg-white">
              <CardContent className="p-4 flex flex-col sm:flex-row gap-6 items-center">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-24 h-24 object-contain mix-blend-multiply bg-gray-50 p-2"
                />
                
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="font-serif text-lg mb-1 line-clamp-2 leading-tight">{item.name}</h3>
                  {item.message ? (
                    <p className="text-xs text-gray-500 italic mb-2">"{item.message}"</p>
                  ) : (
                    <p className="text-xs text-gray-400 mb-2">Sem mensagem</p>
                  )}
                  
                  <div className="font-sans font-bold text-lg text-[#1A1A1A]">
                    {formatCurrency(item.price + (item.messageFee || 0))}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4 border-l border-gray-100 pl-6 w-full sm:w-auto">
                  <div className="flex items-center border border-gray-200 rounded-sm bg-white">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 hover:bg-gray-50 transition-colors border-r border-gray-200"
                    >
                      <Minus className="w-3 h-3 text-gray-500" />
                    </button>
                    <span className="w-10 text-center font-bold text-sm text-[#1A1A1A]">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 hover:bg-gray-50 transition-colors border-l border-gray-200"
                    >
                      <Plus className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors uppercase font-bold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Remover
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card className="border border-gray-100 shadow-none rounded-sm sticky top-32 bg-white">
            <CardContent className="p-6 md:p-8">
              <h2 className="font-heading font-bold text-xl mb-6 uppercase tracking-wider text-[#1A1A1A] pb-4 border-b border-gray-100">Resumo</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal ({items.length} itens)</span>
                  <span className="font-sans font-medium text-[#1A1A1A]">{formatCurrency(subtotal())}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Frete</span>
                  <span className="text-gray-400 italic">Calculado no checkout</span>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-6 mb-8">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-sm uppercase tracking-wider text-[#1A1A1A]">Total</span>
                  <span className="font-sans font-bold text-3xl text-[#C8102E] leading-none">{formatCurrency(subtotal())}</span>
                </div>
              </div>

              <Link 
                to="/checkout" 
                className="w-full inline-block text-center bg-[#1A1A1A] hover:bg-[#C8102E] text-white font-bold py-4 rounded-sm transition-colors uppercase tracking-widest text-sm"
              >
                Concluir Compra
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
