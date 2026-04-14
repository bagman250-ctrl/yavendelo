"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "./firebase/config";
import { collection, onSnapshot } from "firebase/firestore";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "posts"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <main style={{
      padding: 20,
      background: "#0f0f0f",
      minHeight: "100vh",
      color: "white"
    }}>

      {/* LOGO */}
      <Link href="/" style={{ textDecoration: "none", color: "white" }}>
        <h1 style={{
          fontSize: "28px",
          fontWeight: "bold",
          marginBottom: "10px",
          cursor: "pointer"
        }}>
          🔥 YaVendelo
        </h1>
      </Link>

      {/* BUSCADOR */}
      <input 
        placeholder="🔍 Buscar productos..."
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "10px",
          border: "none",
          marginBottom: "20px",
          background: "#1c1c1c",
          color: "#fff"
        }}
      />

      {/* GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "20px"
      }}>

        {posts
          .filter(post =>
            post.titulo?.toLowerCase().includes(search.toLowerCase())
          )
          .map((post, i) => (

          <div key={i} style={{
            background: "#181818",
            borderRadius: "18px",
            overflow: "hidden",
            boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
            transition: "0.3s",
            cursor: "pointer"
          }}
          onMouseEnter={(e:any) => e.currentTarget.style.transform = "scale(1.02)"}
          onMouseLeave={(e:any) => e.currentTarget.style.transform = "scale(1)"}
          >

            <div style={{ position: "relative" }}>
              <img 
                src={post.imagen} 
                style={{
                  width: "100%",
                  height: "220px",
                  objectFit: "cover"
                }}
              />

              <span style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                background: "#00c853",
                padding: "5px 10px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "bold"
              }}>
                NUEVO
              </span>

              <span style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                fontSize: "20px"
              }}>
                ❤️
              </span>
            </div>

            <div style={{ padding: "15px" }}>
              <h3 style={{ margin: "0 0 5px 0" }}>
                {post.titulo}
              </h3>

              <p style={{
                color: "#00e676",
                fontWeight: "bold",
                fontSize: "20px"
              }}>
                ${post.precio}
              </p>

              <a 
                href={`https://wa.me/52${post.whatsapp}`}
                target="_blank"
                style={{
                  display: "block",
                  marginTop: "10px",
                  background: "linear-gradient(45deg, #25D366, #128C7E)",
                  padding: "10px",
                  borderRadius: "10px",
                  textAlign: "center",
                  fontWeight: "bold"
                }}
              >
                💬 Contactar vendedor
              </a>
            </div>

          </div>
        ))}
      </div>

      {/* BOTÓN FLOTANTE */}
      <a 
        href="/publicar"
        style={{
          position: "fixed",
          bottom: "25px",
          right: "25px",
          background: "linear-gradient(45deg, #00c853, #00e676)",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "30px",
          color: "#000",
          boxShadow: "0 8px 20px rgba(0,0,0,0.6)",
          zIndex: 1000
        }}
      >
        +
      </a>

    </main>
  );
}