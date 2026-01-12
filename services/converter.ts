
/**
 * Converts an SVG file to a JPG Blob.
 */
export const convertSvgToJpg = async (file: File, scale: number = 2): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const svgContent = event.target?.result as string;
      const img = new Image();
      
      // Create a blob URL for the SVG content to ensure cross-origin safety
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set dimensions with scaling for better quality
        const width = img.width || 800;
        const height = img.height || 800;
        canvas.width = width * scale;
        canvas.height = height * scale;

        // Fill background with white (JPG doesn't support transparency)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the SVG
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to JPG
        canvas.toBlob(
          (result) => {
            URL.revokeObjectURL(url);
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Conversion to JPG failed'));
            }
          },
          'image/jpeg',
          0.92 // Quality
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG image'));
      };

      img.src = url;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
