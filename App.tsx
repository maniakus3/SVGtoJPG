import React, { useState, useCallback } from 'react';
import { Download, Layers, X, Trash2, DownloadCloud, Sparkles, Image as ImageIcon, FileCode } from 'lucide-react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import DropZone from './components/DropZone';
import FileCard from './components/FileCard';
import { SVGFile, ConversionStatus } from './types';
import { convertSvgToJpg } from './services/converter';
import { convertHeicToJpg } from './services/heicConverter';

type ConverterMode = 'svg' | 'heic';

const App: React.FC = () => {
  const [mode, setMode] = useState<ConverterMode>('svg');
  const [files, setFiles] = useState<SVGFile[]>([]);
  const [status, setStatus] = useState<ConversionStatus>(ConversionStatus.IDLE);
  const [progress, setProgress] = useState(0);

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    setFiles(prev => {
      const existingNames = new Set(prev.map(f => f.name));
      const mappedFiles: SVGFile[] = [];

      newFiles.forEach(file => {
        let finalName = file.name;
        
        if (existingNames.has(finalName)) {
          const lastDotIndex = finalName.lastIndexOf('.');
          const nameWithoutExt = lastDotIndex !== -1 ? finalName.slice(0, lastDotIndex) : finalName;
          const ext = lastDotIndex !== -1 ? finalName.slice(lastDotIndex) : '';
          
          let counter = 1;
          while (existingNames.has(finalName)) {
            finalName = `${nameWithoutExt} (kopia ${counter})${ext}`;
            counter++;
          }
        }
        
        existingNames.add(finalName);

        mappedFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          previewUrl: mode === 'svg' ? URL.createObjectURL(file) : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=100&q=20', // Placeholder for HEIC previews as browser can't render them directly
          name: finalName,
          size: file.size,
          status: 'pending'
        });
      });

      return [...prev, ...mappedFiles];
    });
    setStatus(ConversionStatus.IDLE);
  }, [mode]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      const removed = prev.find(f => f.id === id);
      if (removed && mode === 'svg') URL.revokeObjectURL(removed.previewUrl);
      return filtered;
    });
  }, [mode]);

  const clearAll = useCallback(() => {
    if (mode === 'svg') {
      files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    }
    setFiles([]);
    setStatus(ConversionStatus.IDLE);
    setProgress(0);
  }, [files, mode]);

  const handleExport = async () => {
    if (files.length === 0) return;

    setStatus(ConversionStatus.PROCESSING);
    setProgress(0);
    
    const zip = new JSZip();
    let completedCount = 0;

    const filesToConvert = [...files];

    try {
      for (let i = 0; i < filesToConvert.length; i++) {
        const item = filesToConvert[i];
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'converting' } : f));

        try {
          const jpgBlob = mode === 'svg' 
            ? await convertSvgToJpg(item.file) 
            : await convertHeicToJpg(item.file);
            
          const fileName = item.name.replace(/\.[^/.]+$/, "") + ".jpg";
          zip.file(fileName, jpgBlob);
          
          setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'completed' } : f));
        } catch (err) {
          console.error(`Failed to convert ${item.name}`, err);
          setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error' } : f));
        }

        completedCount++;
        setProgress(Math.round((completedCount / filesToConvert.length) * 100));
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `converted_${mode}_${Date.now()}.zip`);
      
      setTimeout(() => {
        clearAll();
      }, 500);

    } catch (error) {
      console.error("Batch conversion failed", error);
      setStatus(ConversionStatus.ERROR);
    }
  };

  const switchMode = (newMode: ConverterMode) => {
    if (files.length > 0) {
      if (!confirm("Zmiana trybu wyczyści obecną listę plików. Kontynuować?")) return;
    }
    clearAll();
    setMode(newMode);
  };

  return (
    <div className="min-h-screen pb-20">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Konwerter<span className="text-blue-600">Pro</span></h1>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={clearAll}
                disabled={files.length === 0 || status === ConversionStatus.PROCESSING}
                className="text-sm font-medium text-slate-500 hover:text-red-600 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                <X className="w-4 h-4" /> Wyczyść
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="bg-white pt-12 pb-8 px-4 border-b border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3 h-3" /> 100% Bezpieczne & Lokalne
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl mb-6">
            Masowa konwersja do JPG
          </h2>
          
          {/* Mode Switcher */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl mb-8">
            <button
              onClick={() => switchMode('svg')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === 'svg' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileCode className="w-4 h-4" /> SVG na JPG
            </button>
            <button
              onClick={() => switchMode('heic')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                mode === 'heic' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> HEIC na JPG
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="space-y-8">
          <div className="shadow-xl rounded-2xl overflow-hidden">
            <DropZone onFilesAdded={handleFilesAdded} mode={mode} />
          </div>

          {files.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Kolejka plików
                  <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full">{files.length}</span>
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map(item => (
                  <FileCard 
                    key={item.id} 
                    item={item} 
                    onRemove={removeFile} 
                  />
                ))}
              </div>
            </div>
          )}

          {files.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center opacity-40 grayscale pointer-events-none text-center">
              <DownloadCloud className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-slate-400 font-medium">Wybierz tryb i dodaj pliki</p>
            </div>
          )}
        </div>
      </main>

      {files.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-2xl z-30">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex-grow sm:flex-grow-0 min-w-[200px]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    {status === ConversionStatus.PROCESSING ? 'Przetwarzanie...' : 'Gotowy do eksportu'}
                  </span>
                  <span className="text-xs font-bold text-blue-600">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={status === ConversionStatus.PROCESSING}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {status === ConversionStatus.PROCESSING ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Przetwarzanie...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Eksportuj jako JPG (.zip)
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;