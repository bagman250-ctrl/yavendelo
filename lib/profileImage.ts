const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;

export function validateProfileImage(file: File) {
  if (!file.type.startsWith("image/")) {
    return "Selecciona una imagen valida.";
  }

  if (file.size > MAX_PROFILE_IMAGE_SIZE) {
    return "La imagen debe pesar menos de 5 MB.";
  }

  return "";
}

export async function compressProfileImage(file: File) {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return file;

  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const maxSize = 720;
  const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));

  canvas.width = Math.round(image.width * ratio);
  canvas.height = Math.round(image.height * ratio);

  const context = canvas.getContext("2d");
  if (!context) return file;

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.82);
  });

  if (!blob) return file;

  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen"));
    };

    image.src = url;
  });
}
