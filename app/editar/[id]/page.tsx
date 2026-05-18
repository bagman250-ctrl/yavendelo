"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import { auth, db } from "../../firebase/config";
import BottomNav from "../../../components/BottomNav";
import TopBar from "../../../components/TopBar";

const categories = [
  "Tecnología",
  "Celulares",
  "Computadoras",
  "Gaming",
  "Autos",
  "Motos",
  "Moda",
  "Hogar",
  "Deportes",
  "Música",
  "Mascotas",
  "Servicios",
  "Otros",
];

type PostForm = {
  titulo: string;
  precio: string;
  ciudad: string;
  categoria: string;
  descripcion: string;
  status?: string;
  userId?: string;
};

export default function Editar() {
  const params = useParams<{ id: string }>();
  const postId = params.id;
  const [form, setForm] = useState<PostForm>({
    titulo: "",
    precio: "",
    ciudad: "",
    categoria: categories[0],
    descripcion: "",
    status: "active",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allowed, setAllowed] = useState(true);

  const getPost = useCallback(async () => {
    try {
      const snapshot = await getDoc(doc(db, "posts", postId));

      if (!snapshot.exists()) {
        setAllowed(false);
        return;
      }

      const data = snapshot.data() as Partial<PostForm>;
      if (auth.currentUser && data.userId && data.userId !== auth.currentUser.uid) {
        setAllowed(false);
        return;
      }

      setForm({
        titulo: data.titulo || "",
        precio: String(data.precio || ""),
        ciudad: data.ciudad || "",
        categoria: data.categoria || categories[0],
        descripcion: data.descripcion || "",
        status: data.status || "active",
        userId: data.userId,
      });
    } catch (error) {
      console.error("Error cargando publicación:", error);
      toast.error("Error cargando publicación");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    getPost();
  }, [getPost]);

  function updateField(field: keyof PostForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function guardarCambios() {
    if (!form.titulo.trim() || !form.precio.trim() || !form.ciudad.trim() || !form.descripcion.trim()) {
      toast.error("Completa todos los campos");
      return;
    }

    if (Number(form.precio) <= 0) {
      toast.error("Ingresa un precio válido");
      return;
    }

    try {
      setSaving(true);
      await updateDoc(doc(db, "posts", postId), {
        titulo: form.titulo.trim(),
        precio: form.precio.trim(),
        ciudad: form.ciudad.trim(),
        categoria: form.categoria,
        descripcion: form.descripcion.trim(),
        status: form.status || "active",
        updatedAt: Date.now(),
      });

      toast.success("Publicación actualizada");
      window.location.href = `/producto/${postId}`;
    } catch (error) {
      console.error("Error al actualizar:", error);
      toast.error("Error al actualizar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <main style={centerPage}>Cargando publicación...</main>;

  if (!allowed) {
    return (
      <>
        <TopBar />
        <main style={pageStyle}>
          <section style={emptyCard}>
            <span style={eyebrow}>Editar</span>
            <h1 style={emptyTitle}>No puedes editar esta publicación.</h1>
            <p style={emptyText}>Verifica que hayas iniciado sesión con el usuario dueño del producto.</p>
            <Link href="/perfil" style={{ textDecoration: "none" }}>
              <button type="button" style={primaryButton}>Volver al perfil</button>
            </Link>
          </section>
        </main>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <TopBar />

      <main className="fade-in" style={pageStyle}>
        <section style={containerStyle}>
          <span style={eyebrow}>Edición</span>
          <h1 style={titleStyle}>Editar publicación</h1>
          <p style={subtitleStyle}>Mantén la información clara y actualizada para recibir mejores mensajes.</p>

          <div style={formCard}>
            <Field label="Título">
              <input value={form.titulo} onChange={(event) => updateField("titulo", event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Precio">
              <input
                type="number"
                min="1"
                value={form.precio}
                onChange={(event) => updateField("precio", event.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="Ciudad">
              <input value={form.ciudad} onChange={(event) => updateField("ciudad", event.target.value)} style={inputStyle} />
            </Field>
            <Field label="Categoría">
              <select value={form.categoria} onChange={(event) => updateField("categoria", event.target.value)} style={inputStyle}>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </Field>
            <Field label="Estado">
              <select value={form.status || "active"} onChange={(event) => updateField("status", event.target.value)} style={inputStyle}>
                <option value="active">Disponible</option>
                <option value="sold">Vendido</option>
              </select>
            </Field>
            <Field label="Descripción">
              <textarea
                value={form.descripcion}
                onChange={(event) => updateField("descripcion", event.target.value)}
                style={{ ...inputStyle, minHeight: "180px", resize: "vertical" }}
              />
            </Field>

            <div style={actionsRow}>
              <button type="button" onClick={guardarCambios} disabled={saving} style={{ ...primaryButton, opacity: saving ? 0.7 : 1 }}>
                {saving ? "Guardando..." : "Guardar cambios"}
              </button>
              <Link href="/perfil" style={{ textDecoration: "none" }}>
                <button type="button" style={secondaryButton}>Cancelar</button>
              </Link>
            </div>
          </div>
        </section>

        <BottomNav />
      </main>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={fieldStyle}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, rgba(255,123,0,0.08), transparent 380px), #070707",
  color: "white",
  padding: "42px 24px 140px",
};

const centerPage: React.CSSProperties = {
  ...pageStyle,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontWeight: "900",
};

const containerStyle: React.CSSProperties = {
  maxWidth: "860px",
  margin: "0 auto",
};

const eyebrow: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: "8px",
  border: "1px solid rgba(255,123,0,0.22)",
  background: "rgba(255,123,0,0.12)",
  color: "#ffb067",
  padding: "9px 12px",
  fontWeight: "900",
  marginBottom: "14px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "48px",
  lineHeight: 1.05,
  fontWeight: "900",
};

const subtitleStyle: React.CSSProperties = {
  color: "#bdbdbd",
  lineHeight: 1.7,
};

const formCard: React.CSSProperties = {
  display: "grid",
  gap: "16px",
  marginTop: "24px",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  padding: "24px",
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: "8px",
};

const labelStyle: React.CSSProperties = {
  color: "#cfcfcf",
  fontWeight: "900",
  fontSize: "14px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#101010",
  color: "white",
  borderRadius: "8px",
  padding: "15px",
  outline: "none",
  fontSize: "15px",
};

const actionsRow: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const primaryButton: React.CSSProperties = {
  border: "none",
  background: "#ff7b00",
  color: "#101010",
  padding: "15px 18px",
  borderRadius: "8px",
  fontWeight: "900",
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  ...primaryButton,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
};

const emptyCard: React.CSSProperties = {
  maxWidth: "680px",
  margin: "0 auto",
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  padding: "46px 24px",
  textAlign: "center",
};

const emptyTitle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "34px",
  fontWeight: "900",
};

const emptyText: React.CSSProperties = {
  maxWidth: "520px",
  margin: "0 auto 24px",
  color: "#bdbdbd",
  lineHeight: 1.7,
};
