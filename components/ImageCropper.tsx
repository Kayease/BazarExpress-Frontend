import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, RotateCcw, Check } from 'lucide-react';

interface ImageCropperProps {
  src: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  minWidth?: number;
  minHeight?: number;
  targetWidth?: number;
  targetHeight?: number;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageCropper({
  src,
  onCropComplete,
  onCancel,
  aspectRatio = 746 / 768, // Default to 746x768 aspect ratio
  minWidth = 100,
  minHeight = 100,
  targetWidth = 746,
  targetHeight = 768,
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    if (aspectRatio) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    }
  }

  const getCroppedImg = useCallback(
    async (
      image: HTMLImageElement,
      crop: PixelCrop,
      scale = 1,
      rotate = 0,
    ): Promise<Blob> => {
      const canvas = canvasRef.current;
      if (!canvas || !crop) {
        throw new Error('Canvas or crop not available');
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No 2d context');
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      // Set canvas size to target dimensions
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const cropX = crop.x * scaleX;
      const cropY = crop.y * scaleY;
      const cropWidth = crop.width * scaleX;
      const cropHeight = crop.height * scaleY;

      ctx.save();

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw the cropped and scaled image
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        targetWidth,
        targetHeight,
      );

      ctx.restore();

      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          resolve(blob);
        }, 'image/jpeg', 0.95);
      });
    },
    [targetWidth, targetHeight]
  );

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) {
      return;
    }

    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(
        imgRef.current,
        completedCrop,
        scale,
        rotate,
      );
      onCropComplete(croppedImageBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Update preview canvas when crop changes
  useEffect(() => {
    if (completedCrop && imgRef.current && canvasRef.current) {
      getCroppedImg(imgRef.current, completedCrop, scale, rotate).catch(console.error);
    }
  }, [completedCrop, scale, rotate, getCroppedImg]);

  const resetCrop = () => {
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    }
    setScale(1);
    setRotate(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full max-h-[90vh] mx-4 p-6 relative flex flex-col">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl"
          disabled={isProcessing}
          aria-label="Close"
        >
          <X />
        </button>
        <div className="text-xl font-semibold mb-4">Crop Image</div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3 mb-3 p-2 bg-gray-50 rounded text-xs">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Scale:</span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-16"
              disabled={isProcessing}
            />
            <span className="text-gray-500 w-6">{scale.toFixed(1)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Rotate:</span>
            <input
              type="range"
              min="-180"
              max="180"
              step="1"
              value={rotate}
              onChange={(e) => setRotate(Number(e.target.value))}
              className="w-16"
              disabled={isProcessing}
            />
            <span className="text-gray-500 w-6">{rotate}°</span>
          </div>

          <button
            onClick={resetCrop}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
            disabled={isProcessing}
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>

        {/* Crop Area */}
        <div className="flex justify-center mb-3 flex-1 min-h-0">
          <div className="w-full h-full flex items-center justify-center border border-gray-200 rounded overflow-hidden">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              minWidth={minWidth}
              minHeight={minHeight}
              className="max-w-full max-h-full"
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={src}
                style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                onLoad={onImageLoad}
                className="max-w-full max-h-full object-contain"
              />
            </ReactCrop>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleCropComplete}
            disabled={!completedCrop || isProcessing}
            className="px-3 py-2 text-sm bg-brand-primary hover:bg-brand-primary-dark text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <Check className="h-3 w-3" />
                Apply
              </>
            )}
          </button>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}