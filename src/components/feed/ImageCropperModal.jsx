import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

const PREVIEW_WIDTH = 300;
const PREVIEW_HEIGHT = 400;
const OUTPUT_WIDTH = 900;
const OUTPUT_HEIGHT = 1200;

export default function ImageCropperModal({ src, onCrop, onCancel }) {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragOrigin, setDragOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const fitScale = Math.max(PREVIEW_WIDTH / img.width, PREVIEW_HEIGHT / img.height);
      setImage(img);
      setScale(fitScale);
      setPosition({
        x: (PREVIEW_WIDTH - img.width * fitScale) / 2,
        y: (PREVIEW_HEIGHT - img.height * fitScale) / 2,
      });
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, PREVIEW_WIDTH, PREVIEW_HEIGHT);
    ctx.drawImage(image, position.x, position.y, image.width * scale, image.height * scale);
  }, [image, scale, position]);

  const fitScale = useMemo(() => {
    if (!image) return 1;
    return Math.max(PREVIEW_WIDTH / image.width, PREVIEW_HEIGHT / image.height);
  }, [image]);

  const startDrag = (clientX, clientY) => {
    setDragging(true);
    setDragOrigin({ x: clientX - position.x, y: clientY - position.y });
  };

  const moveDrag = (clientX, clientY) => {
    if (!dragging) return;
    setPosition({ x: clientX - dragOrigin.x, y: clientY - dragOrigin.y });
  };

  const handleCrop = () => {
    if (!image) return;

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = OUTPUT_WIDTH;
    outputCanvas.height = OUTPUT_HEIGHT;
    const ctx = outputCanvas.getContext("2d");

    const sourceX = Math.max(0, -position.x / scale);
    const sourceY = Math.max(0, -position.y / scale);
    const sourceWidth = Math.min(image.width - sourceX, PREVIEW_WIDTH / scale);
    const sourceHeight = Math.min(image.height - sourceY, PREVIEW_HEIGHT / scale);

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      OUTPUT_WIDTH,
      OUTPUT_HEIGHT
    );

    outputCanvas.toBlob((blob) => {
      if (blob) onCrop(blob);
    }, "image/jpeg", 0.92);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4">
      <div className="bg-[#121826] rounded-3xl p-6 w-full max-w-sm border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-lg">Crop Image</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-400 mb-4 text-center">Drag to reposition • Use controls to zoom</p>

        <div
          className="relative mx-auto overflow-hidden rounded-xl cursor-grab active:cursor-grabbing select-none"
          style={{ width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT, border: "2px solid rgba(0,207,255,0.3)" }}
          onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
          onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
          onMouseUp={() => setDragging(false)}
          onMouseLeave={() => setDragging(false)}
          onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={() => setDragging(false)}
        >
          <canvas ref={canvasRef} width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} className="block" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: `${PREVIEW_WIDTH / 3}px ${PREVIEW_HEIGHT / 3}px`,
            }}
          />
        </div>

        <div className="flex items-center justify-center gap-3 my-4">
          <button onClick={() => setScale((s) => Math.max(fitScale, s * 0.9))} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 w-16 text-center">{Math.round((scale / fitScale) * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(fitScale * 4, s * 1.1))} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setScale(fitScale);
              setPosition({
                x: (PREVIEW_WIDTH - image.width * fitScale) / 2,
                y: (PREVIEW_HEIGHT - image.height * fitScale) / 2,
              });
            }}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={onCancel} className="flex-1 border border-white/10">Cancel</Button>
          <Button onClick={handleCrop} className="flex-1 bg-gradient-to-r from-[#00CFFF] to-[#8A5CFF] text-black font-bold">
            <Check className="w-4 h-4 mr-1" /> Use Photo
          </Button>
        </div>
      </div>
    </div>
  );
}