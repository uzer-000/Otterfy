'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';

interface ImageDropzoneProps {
  value?: string | null;
  onChange: (base64Url: string) => void;
  onRemove?: () => void;
  label?: string;
  sublabel?: string;
  aspectRatio?: 'square' | 'banner';
  maxSizeMB?: number;
  className?: string;
}

export default function ImageDropzone({
  value,
  onChange,
  onRemove,
  label = 'Imagem',
  sublabel = 'PNG, JPG ou WEBP (máx. 10MB)',
  aspectRatio = 'square',
  maxSizeMB = 10,
  className = '',
}: ImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress image to clean base64 data URL via Canvas
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor envie apenas ficheiros de imagem (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`A imagem é muito grande. O tamanho máximo permitido é ${maxSizeMB}MB.`);
      return;
    }

    setError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Max dimensions for database storage & snappy loading
        const maxDim = aspectRatio === 'banner' ? 1400 : 900;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          onChange(compressed);
        } else {
          onChange(result);
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        onChange(result);
        setIsProcessing(false);
      };
      img.src = result;
    };
    reader.onerror = () => {
      setError('Falha ao ler imagem. Tente novamente.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) onRemove();
    else onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Hidden Native File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Main Interactive Dropzone Box */}
      <div
        onClick={handleBoxClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative group cursor-pointer transition-all duration-200 rounded-2xl border-2 border-dashed overflow-hidden flex flex-col items-center justify-center text-center select-none ${
          aspectRatio === 'banner' ? 'aspect-[3.2/1] min-h-[140px]' : 'aspect-square min-h-[180px] max-h-[280px]'
        } ${
          isDragging
            ? 'border-violet-500 bg-violet-600/15 scale-[1.01] shadow-[0_0_25px_rgba(124,58,237,0.35)]'
            : value
            ? 'border-[#262135] bg-[#0E0C13] hover:border-violet-500/50'
            : 'border-[#262135] bg-[#0F0E14] hover:border-violet-500/50 hover:bg-[#14121B]'
        }`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2 p-6">
            <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            <span className="text-xs text-violet-400 font-medium">A processar imagem...</span>
          </div>
        ) : value ? (
          <div className="relative w-full h-full group">
            {/* Image Preview */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Preview"
              className={`w-full h-full ${aspectRatio === 'banner' ? 'object-cover' : 'object-contain sm:object-cover'}`}
            />

            {/* Hover Actions Overlay */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2.5 p-4">
              <span className="text-xs font-semibold text-white bg-violet-600/90 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Alterar Imagem
              </span>
              <button
                type="button"
                onClick={handleRemove}
                className="text-[11px] font-semibold text-red-300 hover:text-red-200 bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded-lg border border-red-500/30 transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center justify-center space-y-3 pointer-events-none">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              isDragging ? 'bg-violet-600 text-white scale-110' : 'bg-violet-600/10 border border-violet-500/20 text-violet-400 group-hover:scale-105'
            }`}>
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>

            {/* Text guidance */}
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#F8FAFC]">
                {isDragging ? 'Solte a imagem aqui...' : 'Arraste e solte a imagem aqui'}
              </p>
              <p className="text-[11px] text-[#94A3B8]">
                ou <span className="text-violet-400 font-semibold underline underline-offset-2">clique para procurar</span> no seu computador
              </p>
              <p className="text-[10px] text-[#64748B] pt-1">{sublabel}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error feedback */}
      {error && (
        <p className="text-xs text-red-400 font-medium animate-fadeIn flex items-center gap-1.5">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}
