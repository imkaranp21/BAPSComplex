import { useState, useEffect } from 'react';

interface TransparentLogoProps {
  src: string;
  className?: string;
  fallback?: React.ReactNode;
}

export function TransparentLogo({ src, className, fallback }: TransparentLogoProps) {
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          if (r > 220 && g > 220 && b > 220) {
            // soft fade: fully transparent at white (255), fully opaque at threshold (220)
            const whiteness = Math.min(r, g, b);
            d[i + 3] = Math.max(0, Math.round((255 - whiteness) * (255 / 35)));
          }
        }
        ctx.putImageData(imageData, 0, 0);
        setProcessedSrc(canvas.toDataURL('image/png'));
      } catch {
        setError(true);
      }
    };
    img.onerror = () => setError(true);
    img.src = src;
  }, [src]);

  if (error && fallback) return <>{fallback}</>;
  if (!processedSrc) return null;
  return <img src={processedSrc} alt="Logo" className={className} />;
}
