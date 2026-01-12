
import React from 'react';
import { Trash2, FileImage, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { SVGFile } from '../types';

interface FileCardProps {
  item: SVGFile;
  onRemove: (id: string) => void;
}

const FileCard: React.FC<FileCardProps> = ({ item, onRemove }) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className="w-16 h-16 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0 border border-slate-100">
        <img 
          src={item.previewUrl} 
          alt={item.name} 
          className="w-full h-full object-contain p-1"
        />
      </div>
      
      <div className="flex-grow min-w-0">
        <h4 className="text-sm font-semibold text-slate-800 truncate" title={item.name}>
          {item.name}
        </h4>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-slate-500">{formatSize(item.size)}</span>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5">
            {item.status === 'pending' && (
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                <Clock className="w-3 h-3" /> Pending
              </span>
            )}
            {item.status === 'converting' && (
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-blue-500 animate-pulse">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> Converting
              </span>
            )}
            {item.status === 'completed' && (
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-emerald-500">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </span>
            )}
            {item.status === 'error' && (
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-red-500">
                <AlertCircle className="w-3 h-3" /> Error
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => onRemove(item.id)}
        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
        title="Remove file"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FileCard;
