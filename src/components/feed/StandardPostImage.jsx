import React, { useEffect, useState } from "react";
import { getStandardPostImageFit } from "@/lib/postImageFit";

export default function StandardPostImage({ src, alt = "", className = "", onLoad, style, ...props }) {
  const [imageMeta, setImageMeta] = useState(null);

  useEffect(() => {
    setImageMeta(null);
  }, [src]);

  const handleLoad = (event) => {
    const image = event.currentTarget;
    setImageMeta({
      fit: getStandardPostImageFit(image.naturalWidth, image.naturalHeight),
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
    onLoad?.(event);
  };

  const isCover = imageMeta?.fit === "cover";
  const usesFrame = !imageMeta || isCover;

  return (
    <div
      className={usesFrame
        ? "relative w-full max-w-[576px] mx-auto aspect-[4/5] max-h-[720px] overflow-hidden"
        : "relative w-fit max-w-full mx-auto overflow-hidden"}
    >
      <img
        {...props}
        src={src}
        alt={alt}
        onLoad={handleLoad}
        style={{ ...style, ...(!usesFrame && imageMeta ? { width: `${imageMeta.width}px` } : {}) }}
        className={`block object-center ${isCover ? "w-full h-full object-cover" : usesFrame ? "w-full h-full object-contain" : "w-auto h-auto max-w-full max-h-[720px] object-contain"} ${className}`.trim()}
      />
    </div>
  );
}