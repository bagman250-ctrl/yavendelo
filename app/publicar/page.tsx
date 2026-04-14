"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db, storage } from "../firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function Publicar() {
  const [titulo, setTitulo] = useState("");
  const [precio, setPrecio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [file, setFile] = useState<any>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const router = useRouter();

  const handleImage = (e: any) => {
    const selected = e.target.files[0];
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleSubmit = async () => {
    try {
      if (!file) return alert("Selecciona imagen");

      const storageRef = ref(storage, `imagenes/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "posts"), {
        titulo,
        precio,
        imagen: url,
        whatsapp
      });

      alert("Publicado 🔥");

      router.push("/");
      router.refresh();

    } catch (error) {
      console.error(error);
      alert("Error ❌");
    }
  };

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0f0f0f",
      color: "#fff",
      padding: "20px"
    }}>

      {/* LOGO */}
      <Link href="/" style={{ textDecoration: "none", color: "white" }}>
        <h1 style={{
          fontSize: "26px",
          marginBottom: "20px",
          cursor: "pointer"
        }}>
          🔥 YaVendelo
        </h1>
      </Link>

      <div style={{
        maxWidth: "400px",
        margin: "auto",
        background: "#181818",
        padding: "20px",
        borderRadius: "15px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
      }}>

        {preview && (
          <img 
            src={preview} 
            style={{
              width: "100%",
              height: "200px",
              objectFit: "cover",
              borderRadius: "10px",
              marginBottom: "15px"
            }}
          />
        )}

        <input placeholder="Título" onChange={e => setTitulo(e.target.value)} style={inputStyle} />
        <input placeholder="Precio" onChange={e => setPrecio(e.target.value)} style={inputStyle} />
        <input placeholder="WhatsApp" onChange={e => setWhatsapp(e.target.value)} style={inputStyle} />

        <label style={{
  display: "block",
  marginBottom: "15px",
  padding: "15px",
  borderRadius: "12px",
  border: "2px dashed #444",
  textAlign: "center",
  cursor: "pointer",
  background: "#1c1c1c"
}}>

  <input 
    type="file" 
    onChange={handleImage}
    style={{ display: "none" }}
  />

  {!preview ? (
    <div>
      <p style={{ margin: 0 }}>📸 Subir imagen</p>
      <small style={{ color: "#888" }}>
        Toca aquí para seleccionar
      </small>
    </div>
  ) : (
    <p style={{ margin: 0, color: "#00e676" }}>
      ✅ Imagen seleccionada
    </p>
  )}

</label>

        <button onClick={handleSubmit} style={{
          width: "100%",
          padding: "12px",
          borderRadius: "10px",
          border: "none",
          background: "linear-gradient(45deg, #00c853, #00e676)",
          fontWeight: "bold",
          cursor: "pointer"
        }}>
          🚀 Publicar ahora
        </button>

      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginBottom: "10px",
  borderRadius: "10px",
  border: "none",
  background: "#1c1c1c",
  color: "#fff"
};