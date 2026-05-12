import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Erro ao fazer login: " + error.message);
      } else {
        toast.success("Login realizado com sucesso");
        navigate("/admin");
      }
    } catch (err) {
      toast.error("Ocorreu um erro inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-4xl font-bold text-[#F5A623]">Arte Som</h1>
        <p className="text-zinc-400 mt-2">Painel de Administração</p>
      </div>

      <Card className="w-full max-w-sm bg-zinc-900 border-zinc-800 text-white">
        <CardContent className="p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-950 border-zinc-800 text-white"
                placeholder="admin@artesom.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-950 border-zinc-800 text-white"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#C8102E] text-white font-bold py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 mt-4"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </CardContent>
      </Card>
      <div className="mt-8 text-sm text-zinc-500 text-center max-w-sm">
        <p>Atenção: Você precisa ter configurado a VITE_SUPABASE_ANON_KEY nas opções (Settings) do AI Studio para que o login funcione.</p>
      </div>
    </div>
  );
}
