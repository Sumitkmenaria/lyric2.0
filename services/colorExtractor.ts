// A simple implementation to extract dominant colors from an image.
// This is not a perfect color quantization algorithm, but it's lightweight and works for our purpose.

const componentToHex = (c: number): string => {
  const hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};


export const extractColors = (imageUrl: string, colorCount = 4): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        return reject(new Error('Could not get canvas context'));
      }
      
      const width = canvas.width = img.width;
      const height = canvas.height = img.height;
      
      context.drawImage(img, 0, 0);

      try {
        const imageData = context.getImageData(0, 0, width, height).data;
        const colorMap: { [key: string]: number } = {};
        
        // We sample pixels to improve performance
        const sampleSize = 10;
        for (let i = 0; i < imageData.length; i += 4 * sampleSize) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const alpha = imageData[i + 3];

            // Ignore transparent or very dark/light pixels to get more vibrant colors
            if (alpha < 128 || (r < 10 && g < 10 && b < 10) || (r > 245 && g > 245 && b > 245)) {
              continue;
            }

            // A simple way to group similar colors is to reduce their precision
            const R = Math.round(r / 32) * 32;
            const G = Math.round(g / 32) * 32;
            const B = Math.round(b / 32) * 32;

            const key = `${R},${G},${B}`;
            colorMap[key] = (colorMap[key] || 0) + 1;
        }

        const sortedColors = Object.keys(colorMap)
            .sort((a, b) => colorMap[b] - colorMap[a])
            .map(key => {
                const [r,g,b] = key.split(',').map(Number);
                return rgbToHex(r, g, b);
            });
        
        resolve(sortedColors.slice(0, colorCount));

      } catch (e) {
        console.error('Failed to get image data for color extraction.', e);
        // This can happen due to tainted canvas (CORS).
        // Fallback to a default palette.
        resolve(['#67e8f9', '#a78bfa', '#f472b6']);
      }
    };
    img.onerror = (err) => {
        reject(err);
    };
    img.src = imageUrl;
  });
};
