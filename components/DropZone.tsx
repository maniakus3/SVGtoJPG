
import React, { useState, useCallback } from 'react';
import { Upload, FileCode } from 'lucide-react';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded }) => {
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
    
    // Fix: Explicitly cast to File[] to avoid 'unknown' type errors on file properties
    const files = (Array.from(e.dataTransfer.files) as File[]).filter(
      (file) => file.type === 'image/svg+xml' || file.name.endsWith('.svg')
    );
    
    if (files.length > 0) {
      onFilesAdded(files);
    }
  }, [onFilesAdded]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // Fix: Explicitly cast to File[] to avoid 'unknown' type errors on file properties
      const files = (Array.from(e.target.files) as File[]).filter(
        (file) => file.type === 'image/svg+xml' || file.name.endsWith('.svg')
      );
      onFilesAdded(files);
      // Reset input
      e.target.value = '';
    }
  }, [onFilesAdded]);

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
        accept=".svg"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}`}>
        <Upload className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold text-slate-800 mb-2">
        {isDragging ? 'Drop your SVGs now' : 'Drop SVG files here'}
      </h3>
      <p className="text-slate-500 text-sm max-w-xs">
        Drag and drop multiple SVG files or click to browse your computer
      </p>
      
      <div className="mt-8 flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
        <FileCode className="w-4 h-4" />
        <span>Supports .svg format</span>
      </div>
    </div>
  );
};

export default DropZone;
