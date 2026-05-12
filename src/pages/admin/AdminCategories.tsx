import React, { useState, useEffect, useRef } from "react";
import { supabase, Category } from "@/src/lib/supabase";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Category>>({
    name: "", slug: "", description: "", color: "#C8102E", is_promo: false, active: true, display_order: 0, image_url: ""
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data, error } = await supabase.from("categories").select("*").order("display_order");
    if (data) setCategories(data);
    setLoading(false);
  }

  const handleCreate = async () => {
    try {
      if (!formData.name) return toast.error("Nome é obrigatório");
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-');
      
      const payload = {
        name: formData.name,
        slug,
        description: formData.description,
        color: formData.color,
        is_promo: formData.is_promo,
        active: formData.active,
        display_order: formData.display_order,
        image_url: formData.image_url
      };

      let error;
      if (formData.id) {
        const { error: updateErr } = await supabase.from("categories").update(payload).eq("id", formData.id);
        error = updateErr;
      } else {
        const { error: insertErr } = await supabase.from("categories").insert([payload]);
        error = insertErr;
      }

      if (error) throw error;
      
      toast.success(formData.id ? "Categoria atualizada!" : "Categoria criada!");
      setFormData({ name: "", slug: "", description: "", color: "#C8102E", is_promo: false, active: true, display_order: 0 });
      setIsFormOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      toast.success("Categoria excluída");
      fetchCategories();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
       setUploadingImage(true);
       const fileExt = file.name.split('.').pop();
       const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
       const { error: uploadError } = await supabase.storage.from('products').upload(fileName, file);
       if (uploadError) throw uploadError;
       const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
       setFormData(prev => ({ ...prev, image_url: publicUrl }));
       toast.success("Imagem enviada com sucesso!");
    } catch (err: any) {
       toast.error("Erro ao enviar imagem: " + err.message);
    } finally {
       setUploadingImage(false);
       if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias</h1>
          <p className="text-zinc-400 mt-2">Gerencie as categorias de produtos da loja.</p>
        </div>
        <button 
          onClick={() => {
            setFormData({ name: "", slug: "", description: "", color: "#C8102E", is_promo: false, active: true, display_order: 0 });
            setIsFormOpen(true);
          }}
          className="bg-[#C8102E] hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold"
        >
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">{formData.id ? "Editar" : "Nova"} Categoria</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-zinc-400 mb-1">Nome</label>
              <input 
                type="text" 
                value={formData.name || ""} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white outline-none focus:border-[#F5A623]" 
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Cor Hex (ex: #C8102E)</label>
              <input 
                type="text" 
                value={formData.color || ""} 
                onChange={(e) => setFormData({...formData, color: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white outline-none focus:border-[#F5A623]" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-zinc-400 mb-1">Imagem da Categoria (Opcional)</label>
              <div className="flex items-center gap-2 mb-2">
                <input type="text" value={formData.image_url || ""} onChange={(e) => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." className="flex-1 w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white" />
                <span className="text-zinc-500 font-bold px-2">OU</span>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded flex items-center gap-2 border border-zinc-700 whitespace-nowrap"
                >
                  {uploadingImage ? "Enviando..." : <><Upload className="w-4 h-4" /> Enviar Arquivo</>}
                </button>
              </div>
              {formData.image_url && (
                <div className="mt-2 w-16 h-16 rounded-full overflow-hidden border border-zinc-800">
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-zinc-400 mb-1">Descrição</label>
              <textarea 
                value={formData.description || ""} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white outline-none focus:border-[#F5A623]" 
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-zinc-400 mt-4 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.is_promo || false} 
                  onChange={(e) => setFormData({...formData, is_promo: e.target.checked})}
                  className="bg-zinc-950 border-zinc-800"
                />
                Destaque/Promoção na Home?
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2 text-zinc-400 mt-4 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.active || false} 
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                />
                Ativo
              </label>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={handleCreate} className="bg-[#C8102E] text-white px-4 py-2 rounded-lg font-bold">Salvar Categoria</button>
            <button onClick={() => setIsFormOpen(false)} className="bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-zinc-700">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400">
            <tr>
              <th className="p-4">Nome</th>
              <th className="p-4">Slug</th>
              <th className="p-4 flex gap-2">Promo</th>
              <th className="p-4">Status</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="p-4 text-center">Carregando...</td></tr>}
            {!loading && categories.map((cat) => (
              <tr key={cat.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50">
                <td className="p-4 font-bold flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </td>
                <td className="p-4 text-zinc-400">{cat.slug}</td>
                <td className="p-4">{cat.is_promo ? "Sim" : "Não"}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${cat.active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {cat.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <button 
                    onClick={() => {
                      setFormData(cat);
                      setIsFormOpen(true);
                    }}
                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded" title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(cat.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded" title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
