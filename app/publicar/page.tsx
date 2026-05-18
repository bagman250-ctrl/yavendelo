"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { auth, db, storage } from "../firebase/config";
import BottomNav from "../../components/BottomNav";
import ImagePreviewCarousel from "../../components/ImagePreviewCarousel";
import TopBar from "../../components/TopBar";

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

const cities = [
  "Ciudad de México",
  "Guadalajara",
  "Monterrey",
  "Querétaro",
  "Puebla",
  "León",
  "Tijuana",
  "Mérida",
  "Cancún",
  "Toluca",
];

export default function Publicar() {
  const [titulo, setTitulo] = useState("");
  const [precio, setPrecio] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState(categories[0]);
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const completion = useMemo(() => {
    const fields = [titulo, precio, ciudad, descripcion, categoria];
    const done = fields.filter((field) => field.trim()).length + (imagenes.length ? 1 : 0);
    return Math.round((done / 6) * 100);
  }, [titulo, precio, ciudad, descripcion, categoria, imagenes.length]);

  function generateDescription() {
    if (!titulo.trim()) {
      toast.error("Escribe un título primero");
      return;
    }

    const generated = `${titulo} en excelente estado.

Detalles destacados:
- Producto disponible en ${ciudad || "tu ciudad"}.
- Listo para entrega o acuerdo con el comprador.
- Respondo dudas por chat antes de concretar.

Recomendación: agrega medidas, accesorios incluidos, detalles de uso y cualquier garantía disponible.`;

    setDescripcion(generated);
    toast.success("Descripción sugerida");
  }

  function handleImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (imagenes.length + files.length > 8) {
      toast.error("Máximo 8 imágenes por producto");
      return;
    }

    const validFiles = files.filter((file) => file.type.startsWith("image/"));
    if (validFiles.length !== files.length) {
      toast.error("Solo puedes subir imágenes");
      return;
    }

    setImagenes((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...validFiles.map((file) => URL.createObjectURL(file))]);
    toast.success("Imágenes cargadas");
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index]);
    setImagenes((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadImages() {
    const urls: string[] = [];

    for (const image of imagenes) {
      const safeName = image.name.replace(/[^\w.-]/g, "-");
      const imageRef = ref(
        storage,
        `posts/${auth.currentUser?.uid}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`
      );

      await uploadBytes(imageRef, image);
      urls.push(await getDownloadURL(imageRef));
    }

    return urls;
  }

  async function publicar() {
    if (!auth.currentUser) {
      toast.error("Debes iniciar sesión");
      return;
    }

    if (!titulo.trim() || !precio.trim() || !ciudad.trim() || !descripcion.trim() || imagenes.length === 0) {
      toast.error("Completa título, precio, ciudad, descripción e imágenes");
      return;
    }

    if (Number(precio) <= 0) {
      toast.error("Ingresa un precio válido");
      return;
    }

    try {
      setLoading(true);
      const imageUrls = await uploadImages();

      await addDoc(collection(db, "posts"), {
        titulo: titulo.trim(),
        precio: precio.trim(),
        ciudad: ciudad.trim(),
        descripcion: descripcion.trim(),
        categoria,
        imagen: imageUrls[0],
        imagenes: imageUrls,
        userId: auth.currentUser.uid,
        userEmail: auth.currentUser.email,
        userName: auth.currentUser.displayName || "Usuario",
        createdAt: serverTimestamp(),
        views: 0,
        likes: 0,
        featured: false,
        verifiedSeller: false,
        status: "active",
      });

      toast.success("Producto publicado");
      window.location.href = "/";
    } catch (error) {
      console.error("Error al publicar:", error);
      toast.error("Error al publicar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopBar />

      <main className="fade-in" style={pageStyle}>
        <div style={containerStyle}>
          <section style={heroSection}>
            <div>
              <div style={heroBadge}>Publicación guiada</div>
              <h1 style={heroTitle}>Vende con una publicación clara y confiable.</h1>
              <p style={heroText}>
                Sube buenas fotos, define precio y describe el producto con detalle. Una publicación completa
                recibe más mensajes y evita dudas repetidas.
              </p>
            </div>

            <aside style={progressCard}>
              <span style={progressLabel}>Progreso</span>
              <strong style={progressNumber}>{completion}%</strong>
              <div style={progressTrack}>
                <div style={{ ...progressFill, width: `${completion}%` }} />
              </div>
              <p style={progressText}>Completa todos los campos antes de publicar.</p>
            </aside>
          </section>

          <section style={formCard}>
            <label style={uploadLabel}>
              <div style={uploadBox}>
                <strong style={uploadTitle}>
                  {previews.length === 0 ? "Sube fotos reales del producto" : "Agregar más fotos"}
                </strong>
                <span style={uploadText}>
                  {previews.length === 0
                    ? "Puedes subir hasta 8 imágenes. La primera será la principal."
                    : `${previews.length}/8 imágenes seleccionadas.`}
                </span>
              </div>
              <input type="file" accept="image/*" multiple onChange={handleImages} style={{ display: "none" }} />
            </label>

            <ImagePreviewCarousel previews={previews} onRemove={removeImage} />

            <div style={gridStyle}>
              <Field label="Título">
                <input
                  type="text"
                  placeholder="Ej. iPhone 15 Pro Max 256 GB"
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Precio">
                <input
                  type="number"
                  min="1"
                  placeholder="Precio en MXN"
                  value={precio}
                  onChange={(event) => setPrecio(event.target.value)}
                  style={inputStyle}
                />
              </Field>

              <Field label="Ciudad">
                <select value={ciudad} onChange={(event) => setCiudad(event.target.value)} style={selectStyle}>
                  <option value="">Selecciona ciudad</option>
                  {cities.map((city) => (
                    <option key={city}>{city}</option>
                  ))}
                </select>
              </Field>

              <Field label="Categoría">
                <select value={categoria} onChange={(event) => setCategoria(event.target.value)} style={selectStyle}>
                  {categories.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
            </div>

            <button type="button" onClick={generateDescription} style={helperButton}>
              Sugerir descripción
            </button>

            <Field label="Descripción">
              <textarea
                placeholder="Describe estado, medidas, accesorios, tiempo de uso, forma de entrega y detalles importantes."
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
                style={{ ...inputStyle, minHeight: "220px", resize: "vertical" }}
              />
            </Field>

            <button
              type="button"
              onClick={publicar}
              disabled={loading}
              style={{ ...publishButton, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Publicando..." : "Publicar producto"}
            </button>
          </section>
        </div>

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

const containerStyle: React.CSSProperties = {
  maxWidth: "1120px",
  margin: "0 auto",
};

const heroSection: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
  gap: "24px",
  alignItems: "end",
  marginBottom: "28px",
};

const heroBadge: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: "8px",
  border: "1px solid rgba(255,123,0,0.22)",
  background: "rgba(255,123,0,0.12)",
  color: "#ffb067",
  padding: "10px 12px",
  fontWeight: "900",
  marginBottom: "18px",
};

const heroTitle: React.CSSProperties = {
  maxWidth: "760px",
  margin: 0,
  fontSize: "54px",
  lineHeight: 1,
  fontWeight: "900",
};

const heroText: React.CSSProperties = {
  maxWidth: "720px",
  color: "#c7c7c7",
  lineHeight: 1.7,
  fontSize: "17px",
};

const progressCard: React.CSSProperties = {
  borderRadius: "8px",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.05)",
  padding: "20px",
};

const progressLabel: React.CSSProperties = {
  color: "#a7a7a7",
  fontWeight: "800",
};

const progressNumber: React.CSSProperties = {
  display: "block",
  color: "#ffb067",
  fontSize: "42px",
  lineHeight: 1.1,
};

const progressTrack: React.CSSProperties = {
  height: "10px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.1)",
  overflow: "hidden",
};

const progressFill: React.CSSProperties = {
  height: "100%",
  borderRadius: "999px",
  background: "#ff7b00",
};

const progressText: React.CSSProperties = {
  margin: "12px 0 0",
  color: "#a7a7a7",
  fontSize: "13px",
};

const formCard: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "28px",
  boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
};

const uploadLabel: React.CSSProperties = {
  display: "block",
  marginBottom: "22px",
  cursor: "pointer",
};

const uploadBox: React.CSSProperties = {
  display: "grid",
  gap: "8px",
  border: "2px dashed rgba(255,255,255,0.14)",
  borderRadius: "8px",
  padding: "30px",
  textAlign: "center",
};

const uploadTitle: React.CSSProperties = {
  fontSize: "24px",
};

const uploadText: React.CSSProperties = {
  color: "#a7a7a7",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
  gap: "18px",
  marginBottom: "18px",
};

const fieldStyle: React.CSSProperties = {
  display: "grid",
  gap: "9px",
};

const labelStyle: React.CSSProperties = {
  color: "#cfcfcf",
  fontSize: "14px",
  fontWeight: "900",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  background: "#101010",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "8px",
  padding: "16px",
  color: "white",
  outline: "none",
  fontSize: "15px",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
};

const helperButton: React.CSSProperties = {
  width: "100%",
  border: "1px solid rgba(255,255,255,0.1)",
  cursor: "pointer",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  padding: "16px 20px",
  borderRadius: "8px",
  fontWeight: "900",
  marginBottom: "18px",
};

const publishButton: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: "#ff7b00",
  color: "#101010",
  padding: "18px",
  borderRadius: "8px",
  fontWeight: "900",
  fontSize: "17px",
  marginTop: "22px",
  cursor: "pointer",
};
