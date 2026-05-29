"use client";

import { deleteDoc, doc, getDocs, query, where, collection, Firestore } from "firebase/firestore";
import { deleteObject, ref, FirebaseStorage } from "firebase/storage";

export type DeletablePost = {
  id: string;
  userId?: string;
  imagen?: string;
  imagenes?: string[];
};

function uniqueImageUrls(post: DeletablePost) {
  return Array.from(new Set([post.imagen, ...(post.imagenes || [])].filter(Boolean) as string[]));
}

async function deleteStorageImage(storage: FirebaseStorage, imageUrl: string) {
  try {
    await deleteObject(ref(storage, imageUrl));
    return true;
  } catch (error) {
    console.error("No se pudo eliminar una imagen de Storage:", error);
    return false;
  }
}

async function cleanupRelatedDocuments(db: Firestore, postId: string) {
  const collections = ["favorites", "notifications"];

  for (const collectionName of collections) {
    try {
      const snapshot = await getDocs(query(collection(db, collectionName), where("productId", "==", postId)));
      await Promise.allSettled(snapshot.docs.map((document) => deleteDoc(doc(db, collectionName, document.id))));
    } catch (error) {
      console.error(`No se pudo limpiar ${collectionName} relacionados:`, error);
    }
  }
}

export async function deletePostWithCleanup({
  db,
  storage,
  post,
}: {
  db: Firestore;
  storage: FirebaseStorage;
  post: DeletablePost;
}) {
  const imageUrls = uniqueImageUrls(post);

  await deleteDoc(doc(db, "posts", post.id));

  await Promise.allSettled(imageUrls.map((imageUrl) => deleteStorageImage(storage, imageUrl)));
  await cleanupRelatedDocuments(db, post.id);
}
