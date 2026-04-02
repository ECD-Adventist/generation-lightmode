import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImageCropperModal({ src, onCrop, onCancel }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const imgRef = useRef(null);

  // Target aspect ratio: 3:4
  const ASPECT = 3 / 4;
  const PREVIEW_W = 300;
  const PREVIEW_H = PREVIEW_W / ASPECT;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImgSize({ w: img.width, h: img.height });
      // Fit image so it covers the preview frame
      const fitScale = Math.max(PREVIEW_W / img.width, PREVIEW_H / img.height);
      setScale(fitScale);
      setOffset({
        x: (PREVIEW_W - img.width * fitScale) / 2,
        y: (PREVIEW_H - img.height * fitScale) / 2
      });
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    if (!imgRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
    ctx.drawImage(imgRef.current, offset.x, offset.y, imgRef.current.width * scale, imgRef.current.height * scale);
  }, [offset, scale, imgSize]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    const pos = e.touches ? e.touches[0] : e;
    setDragStart({ x: pos.clientX - offset.x, y: pos.clientY - offset.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const pos = e.touches ? e.touches[0] : e;
    const newX = pos.clientX - dragStart.x;
    const newY = pos.clientY - dragStart.y;
    setOffset({ x: newX, y: newY });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => setIsDragging(false);

  const handleCrop = () => {
    if (!imgRef.current) return;

    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = 630;
    outputCanvas.height = 840;
    const ctx = outputCanvas.getContext("2d");

    const sourceX = Math.max(0, -offset.x / scale);
    const sourceY = Math.max(0, -offset.y / scale);
    const sourceWidth = PREVIEW_W / scale;
    const sourceHeight = PREVIEW_H / scale;

    ctx.drawImage(
      imgRef.current,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      outputCanvas.width,
      outputCanvas.height
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

        <p className="text-xs text-gray-400 mb-4 text-center">Drag to reposition • Scroll/pinch to zoom</p>

        {/* Preview canvas */}
        <div
          ref={containerRef}
          className="relative mx-auto overflow-hidden rounded-xl cursor-grab active:cursor-grabbing select-none"
          style={{ width: PREVIEW_W, height: PREVIEW_H, border: "2px solid rgba(0,207,255,0.3)" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          onWheel={(e) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setScale(prev => Math.max(0.3, Math.min(5, prev * delta)));
          }}
        >
          <canvas ref={canvasRef} width={PREVIEW_W} height={PREVIEW_H} className="block" />
          {/* Rule-of-thirds grid */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: `${PREVIEW_W / 3}px ${PREVIEW_H / 3}px`
          }} />
        </div>

        {/* Zoom controls */}
        <div className="flex items-center justify-center gap-3 my-4">
          <button onClick={() => setScale(s => Math.max(0.3, s * 0.85))} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 w-16 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(5, s * 1.15))} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => {
            const fitScale = Math.max(PREVIEW_W / imgSize.w, PREVIEW_H / imgSize.h);
            setScale(fitScale);
            setOffset({ x: (PREVIEW_W - imgSize.w * fitScale) / 2, y: (PREVIEW_H - imgSize.h * fitScale) / 2 });
          }} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition text-white" title="Reset">
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