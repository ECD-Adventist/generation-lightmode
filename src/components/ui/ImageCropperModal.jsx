import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { validateImageFile } from '@/lib/uploadValidation';

export default function ImageCropperModal({ file, aspectRatio = 1, onCancel, onCrop }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (file) {
      const check = validateImageFile(file);
      if (!check.ok) {
        toast.error(check.error);
        onCancel();
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => setImageSrc(e.target.result);
      reader.readAsDataURL(file);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [file]);

  const handleImageLoad = (e) => {
    const img = e.target;
    const container = containerRef.current;
    if (!container) return;
    
    const containerAspect = container.clientWidth / container.clientHeight;
    const imgAspect = img.naturalWidth / img.naturalHeight;
    
    if (imgAspect > containerAspect) {
      img.style.height = '100%';
      img.style.width = 'auto';
    } else {
      img.style.width = '100%';
      img.style.height = 'auto';
    }
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handlePointerMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    if (e.target && e.target.releasePointerCapture) {
      try { e.target.releasePointerCapture(e.pointerId); } catch(err) {}
    }
  };

  const handleCrop = () => {
    const canvas = document.createElement('canvas');
    const container = containerRef.current;
    const img = imageRef.current;
    
    if (!container || !img) return;

    // Determine output resolution
    const outWidth = aspectRatio > 1 ? 1200 : 800;
    const outHeight = outWidth / aspectRatio;
    
    canvas.width = outWidth;
    canvas.height = outHeight;
    const ctx = canvas.getContext('2d');

    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    const renderScale = img.naturalWidth / imgRect.width;

    const sourceX = (containerRect.left - imgRect.left) * renderScale;
    const sourceY = (containerRect.top - imgRect.top) * renderScale;
    const sourceWidth = containerRect.width * renderScale;
    const sourceHeight = containerRect.height * renderScale;

    ctx.drawImage(
      img,
      sourceX, sourceY, sourceWidth, sourceHeight,
      0, 0, outWidth, outHeight
    );

    canvas.toBlob((blob) => {
      if(!blob) {
         onCancel();
         return;
      }
      const croppedFile = new File([blob], file.name || "cropped.jpg", { type: "image/jpeg" });
      onCrop(croppedFile);
    }, "image/jpeg", 0.9);
  };

  return (
    <Dialog open={!!file} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent 
        className="sm:max-w-md bg-[#121826] text-white border-white/10" 
      >
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <DialogDescription className="text-gray-400">Drag to position, use slider to zoom</DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-4">
          <div 
            ref={containerRef}
            className="relative w-full overflow-hidden bg-[#0B0F1A] border border-white/10 cursor-move rounded-xl select-none"
            style={{ aspectRatio, touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {imageSrc && (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Upload preview"
                draggable={false}
                onLoad={handleImageLoad}
                className="max-w-none origin-center pointer-events-none absolute top-1/2 left-1/2"
                style={{
                  transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`
                }}
              />
            )}
          </div>
          
          <div className="w-full flex items-center gap-4 px-2">
            <span className="text-xs text-gray-400 font-bold tracking-wider">ZOOM</span>
            <Slider
              value={[scale]}
              min={1}
              max={4}
              step={0.05}
              onValueChange={([val]) => setScale(val)}
              className="flex-1"
            />
          </div>

          <div className="flex justify-end gap-3 w-full mt-2">
            <Button variant="ghost" onClick={onCancel} className="text-gray-400 hover:text-white">Cancel</Button>
            <Button onClick={handleCrop} className="bg-[#00CFFF] text-black hover:bg-white font-bold px-6">Apply & Upload</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}