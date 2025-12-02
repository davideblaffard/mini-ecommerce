"use client";

import {
  useState,
  useRef,
  DragEvent,
  ChangeEvent,
  FormEvent
} from "react";

type Category = {
  id: number;
  name: string;
};

type AdminDashboardClientProps = {
  initialProducts: any[];
  initialCategories: Category[];
};

type ProductFormState = {
  id: string;
  name: string;
  description: string;
  price: string;
  image_url: string;
  stock: string;
  category_id: string;
};

export default function AdminDashboardClient({
  initialProducts,
  initialCategories
}: AdminDashboardClientProps) {
  const [products, setProducts] = useState<any[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);

  const [form, setForm] = useState<ProductFormState>({
    id: "",
    name: "",
    description: "",
    price: "",
    image_url: "",
    stock: "",
    category_id: ""
  });

  const [categoryForm, setCategoryForm] = useState({
    name: ""
  });

  const [mode, setMode] = useState<"create" | "update">("create");
  const [error, setError] = useState<string | null>(null);
  const [catError, setCatError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetForm = () => {
    setForm({
      id: "",
      name: "",
      description: "",
      price: "",
      image_url: "",
      stock: "",
      category_id: ""
    });
    setMode("create");
    setError(null);
    setUploadError(null);
  };

  // -----------------------------
  // PRODOTTI
  // -----------------------------
  const handleSubmitProduct = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const priceNumber = Number(form.price.replace(",", "."));
    const stockNumber = Number(form.stock);

    if (Number.isNaN(priceNumber) || Number.isNaN(stockNumber)) {
      setError("Prezzo o stock non validi.");
      return;
    }

    const categoryIdNumber =
      form.category_id.trim() === "" ? undefined : Number(form.category_id);

    if (
      form.category_id.trim() !== "" &&
      (Number.isNaN(categoryIdNumber) || categoryIdNumber! <= 0)
    ) {
      setError("Categoria non valida.");
      return;
    }

    const payload: any = {
      name: form.name,
      description: form.description,
      price: priceNumber,
      image_url: form.image_url.trim() || "",
      stock: stockNumber,
      category_id: categoryIdNumber,
      action: mode
    };

    if (mode === "update") {
      payload.id = Number(form.id);
    }

    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.message || "Errore nella richiesta.");
      return;
    }

    const data = await res.json();
    setProducts(data.products);
    resetForm();
  };

  const handleEdit = (p: any) => {
    setMode("update");
    setForm({
      id: String(p.id),
      name: p.name,
      description: p.description,
      price: String(p.price),
      image_url: p.image_url || "",
      stock: String(p.stock),
      category_id: p.category_id ? String(p.category_id) : ""
    });
  };

  const handleDelete = async (id: number) => {
    setError(null);
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.message || "Errore nella richiesta.");
      return;
    }

    const data = await res.json();
    setProducts(data.products);
  };

  // -----------------------------
  // CATEGORIE
  // -----------------------------
  const handleCreateCategory = async (e: FormEvent) => {
    e.preventDefault();
    setCatError(null);

    const name = categoryForm.name.trim();
    if (!name) {
      setCatError("Nome categoria richiesto.");
      return;
    }

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", name })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setCatError(data?.message || "Errore nella richiesta categoria.");
      return;
    }

    const data = await res.json();
    setCategories(data.categories);
    setCategoryForm({ name: "" });
  };

  const handleDeleteCategory = async (id: number) => {
    setCatError(null);

    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setCatError(data?.message || "Errore nella richiesta categoria.");
      return;
    }

    const data = await res.json();
    setCategories(data.categories);

    // Puliamo categoria dai prodotti in memoria
    setProducts((prev: any[]) =>
      prev.map((p) =>
        p.category_id === id ? { ...p, category_id: null } : p
      )
    );
  };

  // -----------------------------
  // UPLOAD IMMAGINI
  // -----------------------------
  const handleFileSelect = async (file: File | null) => {
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setUploadError(data?.message || "Errore durante l'upload.");
        setUploading(false);
        return;
      }

      const data = await res.json();
      setForm((f) => ({ ...f, image_url: data.url }));
    } catch (e) {
      console.error(e);
      setUploadError("Errore di rete durante l'upload.");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleFileSelect(file);
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="grid gap-6 md:grid-cols-[1.7fr,1.3fr]">
      {/* Colonna sinistra: prodotti + categorie */}
      <div className="space-y-6">
        {/* BOX PRODOTTI */}
        <div className="backdrop-blur-md bg-white/60 rounded-2xl border border-white/60 shadow-lg p-4">
          <h1 className="text-2xl font-semibold">Prodotti</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gestisci catalogo prodotti (crea, modifica, elimina).
          </p>
          <div className="mt-4 space-y-2">
            {products.length === 0 && (
              <p className="text-sm text-slate-500">
                Nessun prodotto. Creane uno dal form a destra.
              </p>
            )}
            {products.map((p: any) => {
              const cat = categories.find((c) => c.id === p.category_id);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-white/60 bg-white/70 backdrop-blur p-3 text-sm shadow-sm"
                >
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-slate-500 flex flex-col">
                      <span>
                        € {Number(p.price).toFixed(2)} · stock {p.stock}
                      </span>
                      {cat && (
                        <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                          {cat.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-slate-700 hover:underline"
                    >
                      Modifica
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-500 hover:underline"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOX CATEGORIE */}
        <div className="backdrop-blur-md bg-white/60 rounded-2xl border border-white/60 shadow-lg p-4">
          <h2 className="text-sm font-semibold">Categorie</h2>
          <p className="mt-1 text-xs text-slate-500">
            Crea e gestisci le categorie. I prodotti possono appartenere a una sola categoria.
          </p>

          <form
            onSubmit={handleCreateCategory}
            className="mt-3 flex gap-2 text-sm"
          >
            <input
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm({ name: e.target.value })
              }
              className="flex-1 rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-xs shadow-sm"
              placeholder="Nome categoria (es. Smartphone)"
            />
            <button
              type="submit"
              className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white shadow hover:bg-violet-500"
            >
              Aggiungi
            </button>
          </form>
          {catError && (
            <p className="mt-1 text-[11px] text-red-500">{catError}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {categories.length === 0 && (
              <p className="text-xs text-slate-500">
                Nessuna categoria. Creane una qui sopra.
              </p>
            )}
            {categories.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/60 px-3 py-1 text-[11px] text-slate-700 shadow-sm"
              >
                {c.name}
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(c.id)}
                  className="text-[10px] text-slate-500 hover:text-red-500"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Colonna destra: form prodotto */}
      <div className="backdrop-blur-md bg-white/60 rounded-2xl border border-white/60 shadow-lg p-4">
        <h2 className="text-sm font-semibold">
          {mode === "create" ? "Nuovo prodotto" : "Modifica prodotto"}
        </h2>
        <form
          onSubmit={handleSubmitProduct}
          className="mt-3 space-y-3 text-sm"
        >
          {mode === "update" && (
            <div>
              <label className="block text-xs text-slate-500">
                ID (sola lettura)
              </label>
              <input
                value={form.id}
                readOnly
                className="mt-1 w-full rounded border bg-slate-50 px-3 py-2 text-xs"
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-500">Nome</label>
            <input
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.target.value }))
              }
              className="mt-1 w-full rounded border border-white/60 bg-white/80 px-3 py-2 text-xs shadow-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500">
              Descrizione
            </label>
            <input
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              className="mt-1 w-full rounded border border-white/60 bg-white/80 px-3 py-2 text-xs shadow-sm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-slate-500">
                Prezzo (€)
              </label>
              <input
                type="text"
                value={form.price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, price: e.target.value }))
                }
                className="mt-1 w-full rounded border border-white/60 bg-white/80 px-3 py-2 text-xs shadow-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Stock</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stock: e.target.value }))
                }
                className="mt-1 w-full rounded border border-white/60 bg-white/80 px-3 py-2 text-xs shadow-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500">
              Categoria (opzionale)
            </label>
            <select
              value={form.category_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, category_id: e.target.value }))
              }
              className="mt-1 w-full rounded border border-white/60 bg-white/80 px-3 py-2 text-xs shadow-sm"
            >
              <option value="">Nessuna categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* IMMAGINE + UPLOAD */}
          <div>
            <label className="block text-xs text-slate-500">
              URL immagine (opzionale)
            </label>
            <input
              value={form.image_url}
              onChange={(e) =>
                setForm((f) => ({ ...f, image_url: e.target.value }))
              }
              className="mt-1 w-full rounded border border-white/60 bg-white/80 px-3 py-2 text-xs shadow-sm"
              placeholder="Incolla un URL oppure usa l'upload sotto"
            />

            {/* Dropzone upload */}
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              className="mt-2 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/70 bg-white/50 px-3 py-3 text-[11px] text-slate-600 shadow-inner cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onFileInputChange}
              />
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/80 text-white text-xs shadow">
                  ↑
                </span>
                <span>
                  Trascina un&apos;immagine qui o clicca per selezionare un file.
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                Formati supportati: JPG, PNG, WEBP.
              </span>
              {uploading && (
                <span className="text-[10px] text-violet-600">
                  Upload in corso...
                </span>
              )}
              {uploadError && (
                <span className="text-[10px] text-red-500">
                  {uploadError}
                </span>
              )}
            </div>

            {/* Preview */}
            {form.image_url && (
              <div className="mt-3">
                <span className="block text-[10px] text-slate-500 mb-1">
                  Anteprima immagine
                </span>
                <div className="overflow-hidden rounded-xl border border-white/70 bg-white/70 shadow-sm max-h-40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-slate-800"
            >
              {mode === "create" ? "Crea" : "Salva modifiche"}
            </button>
            {mode === "update" && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-slate-500 hover:underline"
              >
                Annulla modifica
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
