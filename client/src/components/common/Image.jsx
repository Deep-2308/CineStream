import { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';
import Skeleton from '../ui/Skeleton.jsx';

export default function Image({ src, alt, className, fallbackClassName = '' }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Reset state if src changes
  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-surface text-txt-muted ${className} ${fallbackClassName}`}>
        <ImageOff size={24} className="opacity-50" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && <Skeleton className="absolute inset-0 w-full h-full" />}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${!isLoaded ? 'opacity-0' : 'opacity-100'}`}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setIsLoaded(true);
          setHasError(true);
        }}
      />
    </div>
  );
}
