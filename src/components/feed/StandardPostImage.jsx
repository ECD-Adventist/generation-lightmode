import React, { useEffect, useState } from "react";
import { getStandardPostImageFit } from "@/lib/postImageFit";

export default function StandardPostImage({ src, alt = "", className = "", onLoad, onFitChange, ...props }) {
  const [fit, setFit] = useState("contain");

  useEffect(() => {
    setFit("contain");
    onFitChange?.("pending");
  }, [src, onFitChange]);

  const handleLoad = (event) => {
    const image = event.currentTarget;
    const nextFit = getStandardPostImageFit(image.naturalWidth, image.naturalHeight);
    setFit(nextFit);
    onFitChange?.(nextFit);
    onLoad?.(event);
  };

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      onLoad={handleLoad}
      className={`block object-center ${fit === "cover" ? "w-full h-full object-cover" : "max-w-full w-auto h-auto max-h-[720px] object-contain"} ${className}`.trim()}
    />
  );
}
