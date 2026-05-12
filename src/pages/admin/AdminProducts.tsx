import React, { useState, useEffect, useRef } from "react";
import { supabase, Product, Category } from "@/src/lib/supabase";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Image as ImageIcon, Upload } from "lucide-react";
import { formatCurrency } from "@/src/lib/utils/payment";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 0,
    original_price: 0,
    category_id: "",
    images: [""],
    allows_message: false,
    message_fee: 0,
    featured: false,
    active: true,
    stock_qty: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [prodRes, catRes] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name").eq("active", true),
    ]);
    if (prodRes.data) setProducts(prodRes.data);
    if (catRes.data) setCategories(catRes.data);
    setLoading(false);
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("products")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("products").getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, images: [publicUrl] }));
      toast.success("Imagem enviada com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao enviar imagem: " + err.message);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.name || !formData.price || !formData.category_id)
        return toast.error("Preencha nome, preço e categoria");

      const payload = {
        ...formData,
      };

      let error;
      if (formData.id) {
        const { error: updateErr } = await supabase
          .from("products")
          .update(payload)
          .eq("id", formData.id);
        error = updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from("products")
          .insert([payload]);
        error = insertErr;
      }

      if (error) {
        if (error.message.includes("cost_price")) {
          throw new Error(
            "A coluna 'cost_price' não existe na sua tabela 'products'. Por favor, acesse o painel do Supabase e adicione-a como 'numeric' ou 'float8'.",
          );
        }
        throw error;
      }

      toast.success(formData.id ? "Produto atualizado!" : "Produto criado!");
      setIsFormOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("Excluído");
      fetchData();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

  // Safe category lookup
  const getCategoryName = (id: string | null) => {
    if (!id) return "-";
    return categories.find((c) => c.id === id)?.name || "-";
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-zinc-400 mt-2">
            Gerencie seu catálogo de presentes.
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              name: "",
              description: "",
              price: 0,
              original_price: 0,
              category_id: "",
              images: [""],
              allows_message: false,
              message_fee: 0,
              featured: false,
              active: true,
              stock_qty: 0,
            });
            setIsFormOpen(true);
          }}
          className="bg-[#C8102E] hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold"
        >
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
      </div>

      {isFormOpen && (
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4">
            {formData.id ? "Editar" : "Novo"} Produto
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-zinc-400 mb-1">Nome*</label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Categoria*</label>
              <select
                value={formData.category_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, category_id: e.target.value })
                }
                className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white"
              >
                <option value="">Selecione...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Preço Atual*</label>
              <input
                type="number"
                step="0.01"
                value={formData.price || ""}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1 flex items-center gap-2">
                Preço Original (Riscado)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.original_price || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    original_price: Number(e.target.value),
                  })
                }
                className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white"
              />
            </div>
            <div>
              <label
                className="block text-zinc-400 mb-1 text-red-400"
                title="Apenas para controle interno. O cliente não verá isso."
              >
                Custo de Produção (Interno)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.cost_price || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cost_price: Number(e.target.value),
                  })
                }
                placeholder="Ex: Quanto gastou na cesta e itens"
                className="w-full bg-zinc-950 border border-red-900/30 text-red-200 p-2 rounded"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-zinc-400 mb-1">
                Imagem do Produto (URL ou Enviar)
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={formData.images?.[0] || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, images: [e.target.value] })
                  }
                  placeholder="https://..."
                  className="flex-1 w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white"
                />
                <span className="text-zinc-500 font-bold px-2">OU</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded flex items-center gap-2 border border-zinc-700 whitespace-nowrap"
                >
                  {uploadingImage ? (
                    "Enviando..."
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Enviar Arquivo
                    </>
                  )}
                </button>
              </div>
              {formData.images?.[0] && (
                <div className="mt-2 w-20 h-20 bg-black rounded-lg overflow-hidden border border-zinc-800">
                  <img
                    src={formData.images[0]}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-zinc-400 mb-1">Descrição</label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full bg-zinc-950 border border-zinc-800 p-2 rounded text-white h-20"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active || false}
                  onChange={(e) =>
                    setFormData({ ...formData, active: e.target.checked })
                  }
                  className="bg-zinc-950 border-zinc-800"
                />
                Ativo na loja
              </label>
              <label className="flex items-center gap-2 text-zinc-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured || false}
                  onChange={(e) =>
                    setFormData({ ...formData, featured: e.target.checked })
                  }
                  className="bg-zinc-950 border-zinc-800"
                />
                Destacar na página inicial
              </label>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleCreate}
              className="bg-[#C8102E] text-white px-4 py-2 rounded-lg font-bold"
            >
              Salvar Produto
            </button>
            <button
              onClick={() => setIsFormOpen(false)}
              className="bg-zinc-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-zinc-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950 border-b border-zinc-800 text-zinc-400">
            <tr>
              <th className="p-4 w-12">Img</th>
              <th className="p-4">Nome</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">Preço</th>
              <th className="p-4">Status</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="p-4 text-center">
                  Carregando...
                </td>
              </tr>
            )}
            {!loading &&
              products.map((prod) => (
                <tr
                  key={prod.id}
                  className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50"
                >
                  <td className="p-4">
                    <div className="w-10 h-10 bg-zinc-800 rounded overflow-hidden">
                      {prod.images?.[0] ? (
                        <img
                          src={prod.images[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-full h-full p-2 text-zinc-500" />
                      )}
                    </div>
                  </td>
                  <td className="p-4 font-bold">{prod.name}</td>
                  <td className="p-4 text-zinc-400">
                    {getCategoryName(prod.category_id)}
                  </td>
                  <td className="p-4 font-mono">
                    {formatCurrency(prod.price)}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${prod.active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}
                    >
                      {prod.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => {
                        setFormData(prod);
                        setIsFormOpen(true);
                      }}
                      className="p-2 text-blue-400 hover:bg-blue-400/10 rounded"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="p-2 text-red-400 hover:bg-red-400/10 rounded"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">
                  Nenhum produto cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
