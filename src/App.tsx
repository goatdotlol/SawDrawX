import React, { useState, useRef, useCallback } from 'react';
import { Upload, Settings, History, Play, Pause, Square, Pin, PinOff, Maximize2, Minimize2, X, Zap, Clock, CheckCircle, AlertCircle, Crosshair, Palette } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

interface DrawingStats {
  time: string;
  dots: number;
  accuracy: string;
}

interface CanvasRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface DrawingMethod {
  value: string;
  label: string;
  desc: string;
}

const DrawingAutomationApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [drawingMethod, setDrawingMethod] = useState<string>('matrix');
  const [speed, setSpeed] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [canvasRegion, setCanvasRegion] = useState<CanvasRegion | null>(null);
  const [isSelectingCanvas, setIsSelectingCanvas] = useState<boolean>(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [drawingStats, setDrawingStats] = useState<DrawingStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showNotification('File size must be under 10MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
      setUploadedImage(file);
      showNotification('Image uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const fakeEvent = { target: { files: [file] } } as any;
      handleFileUpload(fakeEvent);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const startDrawing = async () => {
    if (!uploadedImage || !canvasRegion) {
      showNotification('Please upload an image and select canvas region', 'error');
      return;
    }

    try {
      setIsDrawing(true);
      setProgress(0);
      
      // Call Rust backend to start drawing
      await invoke('start_drawing', {
        method: drawingMethod,
        speed: speed,
        canvas: canvasRegion,
      });

      // Simulate drawing process for now
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsDrawing(false);
            setDrawingStats({
              time: '2m 34s',
              dots: 15847,
              accuracy: '98.5%'
            });
            showNotification('Drawing completed successfully!', 'success');
            return 100;
          }
          return prev + 1;
        });
      }, 100);
    } catch (error) {
      showNotification(`Error: ${error}`, 'error');
      setIsDrawing(false);
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
    showNotification(isPaused ? 'Drawing resumed' : 'Drawing paused', 'info');
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setProgress(0);
    showNotification('Drawing stopped', 'info');
  };

  const handleCanvasSelect = async () => {
    setIsSelectingCanvas(true);
    showNotification('Click and drag to select canvas region', 'info');
    
    try {
      // Call Rust backend to capture screen and select region
      const region = await invoke<CanvasRegion>('select_canvas_region');
      setCanvasRegion(region);
      setIsSelectingCanvas(false);
      showNotification('Canvas region selected!', 'success');
    } catch (error) {
      showNotification(`Error: ${error}`, 'error');
      setIsSelectingCanvas(false);
    }
  };

  const drawingMethods: DrawingMethod[] = [
    { value: 'matrix', label: 'Matrix Dot (Fast Scan)', desc: 'Fast pixel-perfect scanning' },
    { value: 'dithering', label: 'Floyd-Steinberg Dithering', desc: 'High-quality B&W conversion' },
    { value: 'continuous', label: 'Continuous Line', desc: 'Never lifts pen' },
    { value: 'spiral', label: 'Spiral Raster', desc: 'Center to outside' },
    { value: 'scanline', label: 'Scanline Method', desc: 'Traditional line-by-line' },
    { value: 'stippling', label: 'Stippling/Pointillism', desc: 'Varying dot density' },
    { value: 'contour', label: 'Contour/Vector', desc: 'Traces outlines' }
  ];

  return (
    <div className={`h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white font-sans overflow-hidden ${isMinimized ? 'h-16' : ''}`}>
      {/* Custom Title Bar */}
      <div className="h-12 bg-gray-950/50 backdrop-blur-xl border-b border-gray-700/50 flex items-center justify-between px-4 select-none" data-tauri-drag-region>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <span className="font-semibold text-sm">SawBot Pro</span>
          <span className="text-xs text-gray-400">v2.0.0</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPinned(!isPinned)}
            className={`p-2 rounded-lg transition-all duration-200 ${isPinned ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-gray-700/50'}`}
            title={isPinned ? "Unpin window" : "Pin on top"}
          >
            {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-all duration-200"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => window.close()}
            className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all duration-200" 
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="flex h-[calc(100vh-3rem)]">
          {/* Sidebar */}
          <div className="w-72 bg-gray-800/50 backdrop-blur-xl border-r border-gray-700/50 flex flex-col">
            <div className="p-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Navigation</h2>
              <nav className="space-y-2">
                {[
                  { id: 'upload', label: 'Upload Image', icon: Upload },
                  { id: 'settings', label: 'Configuration', icon: Settings },
                  { id: 'history', label: 'History', icon: History }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-purple-500/20 text-purple-300 shadow-lg shadow-purple-500/10'
                        : 'hover:bg-gray-700/50 text-gray-300'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Status Card */}
            <div className="mt-auto p-6">
              <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-2xl p-4 border border-gray-600/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-3 h-3 rounded-full ${uploadedImage ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                  <span className="text-sm font-medium">{uploadedImage ? 'Ready to Draw' : 'No Image'}</span>
                </div>
                {uploadedImage && (
                  <div className="space-y-2 text-xs text-gray-400">
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span className="text-gray-200">{drawingMethods.find(m => m.value === drawingMethod)?.label.split(' ')[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Speed:</span>
                      <span className="text-gray-200">{speed}x</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-8">
              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">Upload Image</h1>
                      <p className="text-gray-400">Start by uploading the image you want to draw</p>
                    </div>
                  </div>

                  {!imagePreview ? (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                      className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl p-16 border-2 border-dashed border-gray-600/50 hover:border-purple-500/50 transition-all duration-300 cursor-pointer group hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="text-center">
                        <div className="mb-6 inline-block p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full group-hover:scale-110 transition-transform duration-300">
                          <Upload className="w-16 h-16 text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-semibold mb-3">Drop your image here</h3>
                        <p className="text-gray-400 mb-6">or click to browse</p>
                        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                          <span>PNG</span>
                          <span>•</span>
                          <span>JPG</span>
                          <span>•</span>
                          <span>JPEG</span>
                          <span>•</span>
                          <span>WebP</span>
                          <span>•</span>
                          <span>Max 10MB</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fadeIn">
                      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl p-6 border border-gray-700/50">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold">Image Preview</h3>
                          <button
                            onClick={() => {
                              setImagePreview(null);
                              setUploadedImage(null);
                            }}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-all duration-200"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="relative rounded-2xl overflow-hidden bg-gray-900/50 border border-gray-700/50">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-auto max-h-96 object-contain"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => setActiveTab('settings')}
                        className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-2xl font-semibold text-lg transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 flex items-center justify-center gap-3"
                      >
                        <Settings className="w-6 h-6" />
                        Configure Drawing Settings
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Configuration</h1>
                    <p className="text-gray-400">Customize your drawing automation</p>
                  </div>

                  {/* Drawing Method */}
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl p-6 border border-gray-700/50">
                    <div className="flex items-center gap-3 mb-4">
                      <Palette className="w-6 h-6 text-purple-400" />
                      <h3 className="text-xl font-semibold">Drawing Method</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {drawingMethods.map((method, idx) => (
                        <button
                          key={method.value}
                          onClick={() => setDrawingMethod(method.value)}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                            drawingMethod === method.value
                              ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20'
                              : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
                          }`}
                        >
                          <div className="text-2xl mb-2">{['⚡', '🎨', '➰', '🌀', '📊', '🔘', '✏️'][idx]}</div>
                          <div className="font-semibold text-sm mb-1">{method.label}</div>
                          <div className="text-xs text-gray-400">{method.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Speed Control */}
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl p-6 border border-gray-700/50">
                    <div className="flex items-center gap-3 mb-4">
                      <Zap className="w-6 h-6 text-purple-400" />
                      <h3 className="text-xl font-semibold">Drawing Speed</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Current Speed</span>
                        <span className="text-2xl font-bold text-purple-400">{speed}x</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        className="w-full h-3 bg-gray-700 rounded-full appearance-none cursor-pointer slider"
                        style={{
                          background: `linear-gradient(to right, rgb(168, 85, 247) 0%, rgb(168, 85, 247) ${(speed - 1) * 11.11}%, rgb(55, 65, 81) ${(speed - 1) * 11.11}%, rgb(55, 65, 81) 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Slow (High Accuracy)</span>
                        <span>Turbo (Speed Run)</span>
                      </div>
                    </div>
                  </div>

                  {/* Canvas Selection */}
                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl p-6 border border-gray-700/50">
                    <div className="flex items-center gap-3 mb-4">
                      <Crosshair className="w-6 h-6 text-purple-400" />
                      <h3 className="text-xl font-semibold">Canvas Region</h3>
                    </div>
                    {canvasRegion ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <div className="flex-1">
                            <div className="font-medium text-green-400">Canvas Selected</div>
                            <div className="text-sm text-gray-400">
                              {canvasRegion.width}x{canvasRegion.height} at ({canvasRegion.x}, {canvasRegion.y})
                            </div>
                          </div>
                          <button
                            onClick={handleCanvasSelect}
                            className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-all duration-200"
                          >
                            Reselect
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleCanvasSelect}
                        disabled={isSelectingCanvas}
                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        <Crosshair className="w-5 h-5" />
                        {isSelectingCanvas ? 'Selecting...' : 'Select Canvas Region'}
                      </button>
                    )}
                  </div>

                  {/* Start Drawing */}
                  {!isDrawing ? (
                    <button
                      onClick={startDrawing}
                      disabled={!uploadedImage || !canvasRegion}
                      className="w-full px-8 py-6 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-2xl font-bold text-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      <Play className="w-7 h-7" />
                      Start Drawing
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl p-6 border border-gray-700/50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold">Drawing Progress</span>
                          <span className="text-2xl font-bold text-purple-400">{progress}%</span>
                        </div>
                        <div className="h-4 bg-gray-700 rounded-full overflow-hidden mb-4">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 rounded-full"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <span>Estimated time: 2m 45s</span>
                          <span>Time elapsed: {Math.floor(progress / 100 * 165)}s</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={togglePause}
                          className="flex-1 px-6 py-4 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 font-semibold"
                        >
                          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                          {isPaused ? 'Resume' : 'Pause'}
                        </button>
                        <button
                          onClick={stopDrawing}
                          className="flex-1 px-6 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 font-semibold"
                        >
                          <Square className="w-5 h-5" />
                          Stop
                        </button>
                      </div>
                    </div>
                  )}

                  {drawingStats && (
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-3xl p-6 border border-green-500/30 animate-fadeIn">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-7 h-7 text-green-400" />
                        <h3 className="text-xl font-semibold text-green-400">Drawing Complete!</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                          <div className="text-2xl font-bold text-purple-400">{drawingStats.time}</div>
                          <div className="text-sm text-gray-400 mt-1">Total Time</div>
                        </div>
                        <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                          <div className="text-2xl font-bold text-purple-400">{drawingStats.dots}</div>
                          <div className="text-sm text-gray-400 mt-1">Dots Placed</div>
                        </div>
                        <div className="text-center p-4 bg-gray-800/50 rounded-xl">
                          <div className="text-2xl font-bold text-purple-400">{drawingStats.accuracy}</div>
                          <div className="text-sm text-gray-400 mt-1">Accuracy</div>
                        </div>
                      </div>
                      <button
                        onClick={() => setDrawingStats(null)}
                        className="w-full mt-4 px-6 py-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-xl transition-all duration-200"
                      >
                        Draw Another
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Drawing History</h1>
                    <p className="text-gray-400">View your previous drawings and stats</p>
                  </div>

                  <div className="text-center py-20">
                    <History className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-400 mb-2">No History Yet</h3>
                    <p className="text-gray-500">Your completed drawings will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-300' :
            notification.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-300' :
            'bg-blue-500/20 border-blue-500/30 text-blue-300'
          }`}>
            {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
             notification.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
             <Clock className="w-5 h-5" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgb(168, 85, 247), rgb(236, 72, 153));
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgb(168, 85, 247), rgb(236, 72, 153));
          cursor: pointer;
          border: none;
          box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
        }
      `}</style>
    </div>
  );
};

export default DrawingAutomationApp;