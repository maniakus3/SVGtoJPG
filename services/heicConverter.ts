import heic2any from "heic2any";

/**
 * Converts a HEIC file to a JPG Blob.
 */
export const convertHeicToJpg = async (file: File): Promise<Blob> => {
  try {
    const converted = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9
    });
    
    // heic2any can return an array if the HEIC contains multiple images
    if (Array.isArray(converted)) {
      return converted[0] as Blob;
    }
    return converted as Blob;
  } catch (error) {
    console.error("HEIC conversion error:", error);
    throw new Error("Format HEIC nie mógł zostać przekonwertowany.");
  }
};