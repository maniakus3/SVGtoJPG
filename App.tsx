
import React, { useState, useCallback } from 'react';
import { Download, Layers, X, Trash2, DownloadCloud, Sparkles } from 'lucide-react';
import JSZip from 'jszip';
import saveAs from 'file-saver';
import DropZone from './components/DropZone';
import FileCard from './components/FileCard';
import { SVGFile, ConversionStatus } from './types';
import { convertSvgToJpg } from './services/converter';

const App: React.FC = () => {
  const [files, setFiles] = useState<SVGFile[]>([]);
  const [status, setStatus] = useState<ConversionStatus>(ConversionStatus.IDLE);
  const [progress, setProgress] = useState(0);

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    setFiles(prev => {
      // Create a Set of existing names to efficiently check for duplicates
      const existingNames = new Set(prev.map(f => f.name));
      const mappedFiles: SVGFile[] = [];

      newFiles.forEach(file => {
        let finalName = file.name;
        
        // If name exists, append (kopia N)
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
        
        // Add the new unique name to the Set so subsequent files in this batch 
        // also check against it (e.g., if dropping 2 files named 'image.svg' at once)
        existingNames.add(finalName);

        mappedFiles.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          previewUrl: URL.createObjectURL(file),
          name: finalName,
          size: file.size,
          status: 'pending'
        });
      });

      return [...prev, ...mappedFiles];
    });
    setStatus(ConversionStatus.IDLE);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      const removed = prev.find(f => f.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return filtered;
    });
  }, []);

  const clearAll = useCallback(() => {
    files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
    setStatus(ConversionStatus.IDLE);
    setProgress(0);
  }, [files]);

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
        
        // Update item status in UI
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'converting' } : f));

        try {
          const jpgBlob = await convertSvgToJpg(item.file);
          // Use the unique name from state, replacing extension with .jpg
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
      saveAs(content, `converted_svgs_${Date.now()}.zip`);
      
      // Auto-clear logic: Remove all projects/files immediately after export
      // Wait a small bit to ensure the browser UI handled the saveAs trigger
      setTimeout(() => {
        clearAll();
      }, 500);

    } catch (error) {
      console.error("Batch conversion failed", error);
      setStatus(ConversionStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">SVG<span className="text-blue-600">to</span>JPG</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 italic">Privacy: Files deleted after export</span>
              <div className="h-4 w-[1px] bg-slate-200"></div>
              <button 
                onClick={clearAll}
                disabled={files.length === 0 || status === ConversionStatus.PROCESSING}
                className="text-sm font-medium text-slate-500 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-colors"
              >
                <X className="w-4 h-4" /> Clear
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white pt-12 pb-16 px-4 border-b border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3 h-3" /> Browser-Only Processing
          </div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl mb-4">
            SVG to JPG Instant Batch
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Konwertuj pliki SVG na JPG masowo. Twoje pliki nie opuszczają przeglądarki i są usuwane z pamięci natychmiast po pobraniu.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10">
        <div className="space-y-8">
          {/* Dropzone Area */}
          <div className="shadow-xl rounded-2xl overflow-hidden">
            <DropZone onFilesAdded={handleFilesAdded} />
          </div>

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  Pliki do konwersji
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

          {/* Empty State Illustration */}
          {files.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center opacity-40 grayscale pointer-events-none">
              <DownloadCloud className="w-16 h-16 text-slate-300 mb-4" />
              <p className="text-slate-400 font-medium">Brak plików w kolejce</p>
            </div>
          )}
        </div>
      </main>

      {/* Persistent Footer CTA */}
      {files.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-30">
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

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleExport}
                disabled={status === ConversionStatus.PROCESSING}
                className="flex-1 sm:flex-none bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-200"
              >
                {status === ConversionStatus.PROCESSING ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Konwertuję...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Eksportuj do JPG i wyczyść
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
