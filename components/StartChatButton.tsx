"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";

import { auth, db } from "@/app/firebase/config";
import { analyticsEvents, trackEvent } from "@/lib/analytics";

interface StartChatButtonProps {
  productId: string;
  productTitle?: string;
  sellerId?: string;
  sellerName?: string;
  sellerPhotoURL?: string;
}

export default function StartChatButton({
  productId,
  productTitle = "Producto",
  sellerId = "vendedor",
  sellerName = "Vendedor",
  sellerPhotoURL = "",
}: StartChatButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function startChat() {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      toast.error("Inicia sesion para escribirle al vendedor");
      router.push("/login");
      return;
    }

    try {
      setLoading(true);

      const buyerId = currentUser.uid;
      const buyerName =
        currentUser.displayName || currentUser.email || "Comprador";
      const cleanSellerId = sellerId?.trim();

      if (!cleanSellerId) {
        toast.error("No pudimos identificar al vendedor de esta publicaciÃ³n.");
        return;
      }

      if (cleanSellerId === buyerId) {
        toast.error("Esta publicacion es tuya. Puedes administrarla desde tu perfil.");
        return;
      }

      const chatId = `${productId}_${buyerId}_${cleanSellerId}`;
      const chatRef = doc(db, "conversations", chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          productId,
          productTitle,
          sellerId: cleanSellerId,
          sellerName,
          sellerPhotoURL,
          buyerId,
          buyerName,
          buyerEmail: currentUser.email,
          buyerPhotoURL: currentUser.photoURL || "",
          participants: [buyerId, cleanSellerId],
          userName: sellerName,
          lastMessage: "Chat iniciado",
          lastMessageAt: serverTimestamp(),
          unread: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await updateDoc(chatRef, {
          participants: [buyerId, cleanSellerId],
          updatedAt: serverTimestamp(),
        });
      }

      trackEvent(analyticsEvents.startChat, { product_id: productId });
      toast.success("Chat abierto. Mantén el trato dentro de YaVendelo.");
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error("Error iniciando chat:", error);
      toast.error("No se pudo abrir el chat");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={startChat}
      disabled={loading}
      style={{
        width: "100%",
        border: "none",
        background: "linear-gradient(135deg,#ff7b00,#ff5500)",
        color: "white",
        padding: "16px 18px",
        borderRadius: "8px",
        fontWeight: "900",
        fontSize: "16px",
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        boxShadow: "0 14px 30px rgba(255,123,0,0.24)",
      }}
    >
      {loading ? "Abriendo..." : "Enviar mensaje"}
    </button>
  );
}
