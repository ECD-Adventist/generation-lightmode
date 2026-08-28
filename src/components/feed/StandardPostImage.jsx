import React, { useEffect, useState } from "react";
import { getStandardPostImageFit } from "@/lib/postImageFit";

export default function StandardPostImage({ src, alt = "", className = "", onLoad, ...props }) {
  const [fit, setFit] = useState("contain");

  useEffect(() => {
    setFit("contain");
  }, [src]);

  const handleLoad = (event) => {
    const image = event.currentTarget;
    setFit(getStandardPostImageFit(image.naturalWidth, image.naturalHeight));
    onLoad?.(event);
  };

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      onLoad={handleLoad}
      className={`block w-full h-full object-center ${fit === "cover" ? "object-cover" : "object-contain"} ${className}`.trim()}
    />
  );
}
