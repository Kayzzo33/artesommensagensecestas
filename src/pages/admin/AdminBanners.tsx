import React, { useState, useEffect, useRef } from "react";
import { supabase, Banner } from "@/src/lib/supabase";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";

export default function AdminBanners() {
  const [dataList, setDataList] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState<Partial<Banner>>({ title: "", subtitle: "", image_url: "", link_url: "" });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchData() }, []);

  async function fetchData() {
    setLoading(true);
    const { data } = await supabase.from("banners").select("*").order("id");
    if (data) setDataList(data);
    setLoading(false);
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Re-using the products bucket for banners for simplicity, or we check if there's a banners bucket. Assuming products exists and is public.
      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success("Imagem enviada com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao enviar imagem: " + err.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.image_url) return toast.error("Imagem é obrigatória");
      let error;
      if (formData.id) {
        const { error: updateErr } = await supabase.from("banners").update({
          title: formData.title,
          subtitle: formData.subtitle,
          image_url: formData.image_url,
          link_url: formData.link_url
        }).eq("id", formData.id);
        error = updateErr;
      } else {
        const { error: insertErr } = await supabase.from("banners").insert([{
          title: formData.title,
          subtitle: formData.subtitle,
          image_url: formData.image_url,
          link_url: formData.link_url
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
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
      toast.success("Banner excluído.");
      fetchData();
    } catch (err: any) {
      toast.error("Erro ao excluir: " + (err.message || err.toString()));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Banners</h1>
          <p className="text-zinc-400 mt-2">Gerencie os banners da página inicial da loja.</p>
        </div>
        <button onClick={() => { setFormData({ title: "", subtitle: "", image_url: "", link_url: "" }); setIsFormOpen(true); }} className="bg-[#C8102E] text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold hover:bg-red-700 transition">
          <Plus className="w-4 h-4" /> Novo Banner
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-400 mb-1 text-sm">Imagem URL (Obrigatório)*</label>
            <div className="flex items-center gap-2">
                 <input type="text" value={formData.image_url || ""} onChange={(e) => setFormData({...formData, image_url: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white outline-none focus:border-[#C8102E]" />
                 <span className="text-zinc-500 font-bold px-2">OU</span>
                 <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                 <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded flex items-center gap-2 border border-zinc-700 whitespace-nowrap h-[42px]"
                 >
                    {uploadingImage ? "..." : <Upload className="w-4 h-4" />}
                 </button>
            </div>
            {formData.image_url && (
                <div className="mt-2 h-20 bg-black rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center">
                  <img src={formData.image_url} alt="Preview" className="h-full object-contain" />
                </div>
            )}
          </div>
          <div>
            <label className="block text-zinc-400 mb-1 text-sm">Link de redirecionamento (Opcional)</label>
            <input type="text" value={formData.link_url || ""} onChange={(e) => setFormData({...formData, link_url: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white outline-none focus:border-[#C8102E]" placeholder="/categoria/rosas" />
          </div>
          <div className="md:col-span-2 flex gap-2 justify-end mt-4">
            <button onClick={() => setIsFormOpen(false)} className="bg-zinc-800 text-white h-[42px] px-6 rounded font-bold hover:bg-zinc-700 transition">Cancelar</button>
            <button onClick={handleCreate} className="bg-[#C8102E] text-white h-[42px] px-6 rounded font-bold hover:bg-red-700 transition">Salvar</button>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
            <tr><th className="p-4">Imagem</th><th className="p-4">Link</th><th className="p-4">Ações</th></tr>
          </thead>
          <tbody>
            {!loading && dataList.map((item) => (
              <tr key={item.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50 transition">
                <td className="p-4">
                  <div className="h-16 w-32 bg-black rounded overflow-hidden">
                     <img src={item.image_url} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="p-4 font-mono">{item.link_url || '-'}</td>
                <td className="p-4 flex gap-2 items-center h-full pt-8">
                  <button onClick={() => { setFormData(item); setIsFormOpen(true); }} className="text-blue-400 hover:bg-blue-400/10 p-2 rounded transition"><Pencil className="w-4 h-4"/></button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:bg-red-400/10 p-2 rounded transition"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
            {loading && <tr><td colSpan={3} className="p-6 text-center text-zinc-500">Carregando...</td></tr>}
            {!loading && dataList.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-zinc-500">Nenhum banner cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
