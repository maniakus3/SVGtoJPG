import React, { useState, useCallback } from 'react';
import { Upload, FileCode, ImageIcon } from 'lucide-react';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
  mode: 'svg' | 'heic';
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded, mode }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const acceptedExtensions = mode === 'svg' ? ['.svg'] : ['.heic', '.heif'];
    
    // Explicitly typing the file as File to fix "Property 'name' does not exist on type 'unknown'"
    const files = Array.from(e.dataTransfer.files).filter((file: File) => {
      const name = file.name.toLowerCase();
      return acceptedExtensions.some(ext => name.endsWith(ext));
    });
    
    if (files.length > 0) {
      onFilesAdded(files);
    }
  }, [onFilesAdded, mode]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const acceptedExtensions = mode === 'svg' ? ['.svg'] : ['.heic', '.heif'];
      // Explicitly typing the file as File to fix "Property 'name' does not exist on type 'unknown'"
      const files = Array.from(e.target.files).filter((file: File) => {
        const name = file.name.toLowerCase();
        return acceptedExtensions.some(ext => name.endsWith(ext));
      });
      onFilesAdded(files);
      e.target.value = '';
    }
  }, [onFilesAdded, mode]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col items-center justify-center text-center ${
        isDragging 
          ? 'border-blue-500 bg-blue-50 scale-[1.01]' 
          : 'border-slate-300 hover:border-slate-400 bg-white'
      }`}
    >
      <input
        type="file"
        multiple
        accept={mode === 'svg' ? '.svg' : '.heic,.heif'}
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
        {mode === 'svg' ? <FileCode className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
      </div>
      <h3 className="text-xl font-semibold text-slate-800 mb-2">
        {isDragging ? `Upuść pliki ${mode.toUpperCase()}` : `Przeciągnij pliki ${mode.toUpperCase()}`}
      </h3>
      <p className="text-slate-500 text-sm max-w-xs">
        Kliknij lub przeciągnij wiele plików {mode.toUpperCase()}, aby rozpocząć konwersję.
      </p>
      
      <div className="mt-8 flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
        <span>Obsługuje format {mode === 'svg' ? '.svg' : '.heic / .heif'}</span>
      </div>
    </div>
  );
};

export default DropZone;