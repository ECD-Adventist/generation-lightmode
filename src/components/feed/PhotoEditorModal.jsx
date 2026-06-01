import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCw, Check, X, Crop as CropIcon, Maximize2 } from "lucide-react";

const ASPECT_PRESETS = [
  { key: "original", label: "Original", ratio: null, icon: Maximize2 },
  { key: "square", label: "1:1", ratio: 1 },
  { key: "portrait", label: "4:5", ratio: 4 / 5 },
  { key: "landscape", label: "16:9", ratio: 16 / 9 },
];

export default function PhotoEditorModal({ file, onCancel, onApply }) {
  const [imgSrc, setImgSrc] = useState(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [aspectKey, setAspectKey] = useState("original");
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setImgSrc(e.target.result);
    reader.readAsDataURL(file);
    setRotation(0);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setAspectKey("original");
  }, [file]);

  const handleImageLoad = (e) => {
    setNaturalSize({ w: e.target.naturalWidth, h: e.target.naturalHeight });
  };

  // Rotated natural size (what the image looks like after rotation)
  const rotatedNatural = (() => {
    const rot = rotation % 180 !== 0;
    return {
      w: rot ? naturalSize.h : naturalSize.w,
      h: rot ? naturalSize.w : naturalSize.h,
    };
  })();

  // Container aspect ratio — "original" uses the rotated image's aspect
  const currentRatio = (() => {
    const preset = ASPECT_PRESETS.find((p) => p.key === aspectKey);
    if (preset?.ratio) return preset.ratio;
    if (!rotatedNatural.w || !rotatedNatural.h) return 1;
    return rotatedNatural.w / rotatedNatural.h;
  })();

  const handlePointerDown = (e) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const resetPanZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
    resetPanZoom();
  };

  const handleApply = () => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img || !naturalSize.w) return;

    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    // Output resolution — cap long edge at 1600px for performance
    const maxEdge = 1600;
    const ratio = containerRect.width / containerRect.height;
    let outW = containerRect.width * 2;
    let outH = containerRect.height * 2;
    if (outW > maxEdge || outH > maxEdge) {
      if (ratio >= 1) {
        outW = maxEdge;
        outH = maxEdge / ratio;
      } else {
        outH = maxEdge;
        outW = maxEdge * ratio;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(outW);
    canvas.height = Math.round(outH);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Scale from displayed image pixels -> output canvas pixels
    const scaleX = canvas.width / containerRect.width;
    const scaleY = canvas.height / containerRect.height;

    // Draw the rotated image onto the canvas, using offset/scale equivalent to preview
    ctx.save();
    ctx.translate(
      (imgRect.left - containerRect.left + imgRect.width / 2) * scaleX,
      (imgRect.top - containerRect.top + imgRect.height / 2) * scaleY
    );
    ctx.rotate((rotation * Math.PI) / 180);

    // After rotation, draw the original image centered. The displayed imgRect
    // already reflects the rotated bounding box, so back-compute from natural.
    const drawW = (rotation % 180 === 0 ? imgRect.width : imgRect.height) * scaleX;
    const drawH = (rotation % 180 === 0 ? imgRect.height : imgRect.width) * scaleY;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          onCancel();
          return;
        }
        const edited = new File([blob], file.name || `edited-${Date.now()}.jpg`, { type: "image/jpeg" });
        onApply(edited);
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent
        className="sm:max-w-lg max-h-[92vh] overflow-y-auto p-0 rounded-3xl [&>button]:text-white"
        style={{ background: "#0B1B3D", border: "1px solid rgba(255,255,255,0.08)", color: "#FFFFFF", zIndex: 2100 }}
      >
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black font-['Space_Grotesk']">Edit Photo</h2>
            <p className="text-xs text-white/60 mt-0.5">Crop, rotate, and zoom before posting</p>
          </div>
        </div>

        <div className="px-5">
          <div
            ref={containerRef}
            className="relative w-full overflow-hidden bg-black rounded-2xl select-none"
            style={{ aspectRatio: currentRatio, touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {imgSrc && (
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Edit preview"
                draggable={false}
                onLoad={handleImageLoad}
                className="absolute top-1/2 left-1/2 max-w-none pointer-events-none select-none"
                style={{
                  transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) rotate(${rotation}deg) scale(${scale})`,
                  height: rotation % 180 === 0 ? "100%" : "auto",
                  width: rotation % 180 === 0 ? "auto" : "100%",
                  minWidth: rotation % 180 === 0 ? "100%" : undefined,
                  minHeight: rotation % 180 === 0 ? undefined : "100%",
                }}
              />
            )}
            {/* Grid overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
                backgroundSize: "33.333% 33.333%",
              }}
            />
          </div>

          {/* Aspect presets */}
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-2 flex items-center gap-1.5">
              <CropIcon className="w-3 h-3" /> Aspect
            </div>
            <div className="flex flex-wrap gap-2">
              {ASPECT_PRESETS.map((p) => {
                const active = aspectKey === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setAspectKey(p.key);
                      resetPanZoom();
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-bold transition"
                    style={
                      active
                        ? { background: "#1FB8FF", color: "#0B1B3D", border: "1px solid #1FB8FF" }
                        : { background: "rgba(255,255,255,0.05)", color: "#E0E8F0", border: "1px solid rgba(255,255,255,0.1)" }
                    }
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zoom + rotate */}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 w-10">Zoom</span>
            <Slider value={[scale]} min={1} max={4} step={0.05} onValueChange={([v]) => setScale(v)} className="flex-1" />
            <button
              type="button"
              onClick={handleRotate}
              className="w-10 h-10 rounded-full flex items-center justify-center transition"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
              title="Rotate 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 mt-2 flex gap-2 border-t border-white/5">
          <Button
            variant="ghost"
            onClick={onCancel}
            className="flex-1 text-white/70 hover:text-white hover:bg-white/5"
          >
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 font-black"
            style={{ background: "linear-gradient(90deg, #1FB8FF, #0B3FD9)", color: "#fff" }}
          >
            <Check className="w-4 h-4 mr-1" /> Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}