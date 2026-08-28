import React, { useEffect, useState } from "react";
import { getStandardPostImageFit } from "@/lib/postImageFit";

export default function StandardPostImage({ src, alt = "", className = "", onLoad, onFitChange, style, ...props }) {
  const [imageMeta, setImageMeta] = useState(null);

  useEffect(() => {
    setImageMeta(null);
    onFitChange?.("pending");
  }, [src, onFitChange]);

  const handleLoad = (event) => {
    const image = event.currentTarget;
    const nextMeta = {
      fit: getStandardPostImageFit(image.naturalWidth, image.naturalHeight),
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
    setImageMeta(nextMeta);
    onFitChange?.(nextMeta.fit);
    onLoad?.(event);
  };

  const isCover = imageMeta?.fit === "cover";

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      onLoad={handleLoad}
      style={{ ...style, ...(!isCover && imageMeta ? { width: `${imageMeta.width}px` } : {}) }}
      className={`block object-center ${isCover ? "w-full h-full object-cover" : "max-w-full w-auto h-auto max-h-[720px] object-contain"} ${className}`.trim()}
    />
  );
}