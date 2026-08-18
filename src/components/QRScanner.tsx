/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, RefreshCw, Zap, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';

interface QRScannerProps {
  language: string;
  translations: Record<string, any>;
  recommendations: any[];
  onMatch: (id: string) => void;
  onClose: () => void;
  triggerHaptic: (pattern?: number | number[]) => void;
}

export default function QRScanner({
  language,
  translations,
  recommendations,
  onMatch,
  onClose,
  triggerHaptic,
}: QRScannerProps) {
  const t = translations[language] || translations['en'];

  const [isActive, setIsActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Clean up streams and loops on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleDecodedCode = (qrContent: string) => {
    let matchedId = '';

    // Match against existing recommendation IDs (either direct or URL query patterns)
    if (recommendations.some(r => r.id === qrContent)) {
      matchedId = qrContent;
    } else {
      try {
        // Check if it represents a URL
        if (qrContent.startsWith('http://') || qrContent.startsWith('https://')) {
          const urlObj = new URL(qrContent);
          const searchParams = urlObj.searchParams;
          const idParam = searchParams.get('id') || searchParams.get('rec') || searchParams.get('recommendation');
          if (idParam && recommendations.some(r => r.id === idParam)) {
            matchedId = idParam;
          } else {
            // Peek trailing segment e.g. /detail/1
            const segments = urlObj.pathname.split('/').filter(Boolean);
            const lastSegment = segments[segments.length - 1];
            if (lastSegment && recommendations.some(r => r.id === lastSegment)) {
              matchedId = lastSegment;
            }
          }
        } else {
          // Try regex search or fuzzy checks
          const matched = recommendations.find(r => qrContent.toLowerCase().includes(r.id.toLowerCase()));
          if (matched) {
            matchedId = matched.id;
          }
        }
      } catch (e) {
        // Fuzzy lookups
        const matched = recommendations.find(r => qrContent.toLowerCase().includes(r.id.toLowerCase()));
        if (matched) {
          matchedId = matched.id;
        }
      }
    }

    if (matchedId) {
      triggerHaptic([15, 60, 15]);
      stopCamera();
      onMatch(matchedId);
    } else {
      console.warn('QR Code scanned but no matching recommendation found: ', qrContent);
      setErrorMsg(language === 'sr' ? 'Automatska provera nije uspela. Izaberite drugi kod.' : language === 'zh' ? '验证推荐不成功，请选择其他二维码。' : 'Recommendation check failed. Please try a different QR code.');
      triggerHaptic([30, 80, 30]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    triggerHaptic(10);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = img.width;
          canvas.height = img.height;
          context.drawImage(img, 0, 0);
          try {
            const imageData = context.getImageData(0, 0, img.width, img.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });
            if (code && code.data) {
              handleDecodedCode(code.data.trim());
            } else {
              setErrorMsg(language === 'sr' ? 'Nismo pronašli važeći QR kod na slici.' : language === 'zh' ? '在图片中未检测到有效的二维码。' : 'No valid QR code detected in the image.');
              triggerHaptic([30, 80, 30]);
            }
          } catch (err) {
            console.error('Failed to parse uploaded image:', err);
            setErrorMsg(language === 'sr' ? 'Greška pri čitanju slike. Izaberite drugu.' : language === 'zh' ? '读取图片失败，请选择其他。' : 'Failed to read image. Please select another.');
            triggerHaptic([30, 80, 30]);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    setErrorMsg(null);
    triggerHaptic(15);
    try {
      // Stop any existing stream
      if (streamRef.current) {
        stopCamera();
      }

      // Contextual Permission Request
      const constraints: MediaStreamConstraints = {
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS
        videoRef.current.play().catch(e => {
          console.error("Video play failed:", e);
        });
      }

      setIsActive(true);

      // Check if torch/flashlight is supported
      const track = stream.getVideoTracks()[0];
      if (track) {
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if ('torch' in capabilities) {
          setHasTorch(true);
        }
      }

      // Start decoding loop
      animationFrameRef.current = requestAnimationFrame(tick);

    } catch (err: any) {
      console.error('Camera permission or loading error:', err);
      // Give a precise, descriptive error matching privacy expectations
      setErrorMsg(t.camera_permission_denied || 'Camera access denied. Please use the camera upload button above or enable camera access in device settings.');
      triggerHaptic([30, 80, 30]);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    setTorchOn(false);
    setHasTorch(false);
    setIsActive(false);
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        if ('torch' in capabilities) {
          const nextTorchState = !torchOn;
          await track.applyConstraints({
            advanced: [{ torch: nextTorchState } as any],
          });
          setTorchOn(nextTorchState);
          triggerHaptic(10);
        }
      } catch (e) {
        console.warn('Torch not supported or failed to toggle:', e);
      }
    }
  };

  const tick = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(tick);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (context) {
      // Draw video frame to our hidden analysis canvas
      const width = video.videoWidth;
      const height = video.videoHeight;
      canvas.width = width;
      canvas.height = height;

      context.drawImage(video, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);

      // Call jsQR decoder
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleDecodedCode(code.data.trim());
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const handleClose = () => {
    triggerHaptic(10);
    stopCamera();
    onClose();
  };

  return (
    <div className="bg-white border border-border-main rounded-[40px] p-6 shadow-tactile space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse" />
          <h4 className="text-[10px] uppercase tracking-[0.4em] text-[#8C8A7D] font-black">{t.scan_qr || "Scan QR Code"}</h4>
        </div>
        <button 
          onClick={handleClose}
          className="p-1.5 bg-brand-pearl hover:bg-brand-pearl/80 rounded-full text-brand-charcoal border border-border-main active:scale-90 transition-all cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      <p className="text-[10px] text-brand-charcoal/60 leading-relaxed font-sans mt-1">
        {t.qr_scanner_desc || "Scan a recommendation QR code to instantly pull up its details."}
      </p>

      {/* Main scanner view frame */}
      <div className="relative aspect-square w-full max-w-[280px] mx-auto overflow-hidden rounded-[32px] bg-brand-charcoal border border-border-main flex flex-col items-center justify-center">
        {!isActive ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-brand-pearl border border-border-main/50 flex items-center justify-center text-brand-charcoal/60 relative">
              <Camera size={26} className="text-brand-charcoal/70" />
            </div>

            {errorMsg ? (
              <div className="space-y-3 max-w-[240px]">
                <div className="flex items-center justify-center gap-1.5 text-accent-red">
                  <AlertCircle size={14} />
                  <span className="text-[9px] uppercase font-bold tracking-wider">{t.error || "Error"}</span>
                </div>
                <p className="text-[10px] text-[#A64B2A]/85 font-medium leading-normal">{errorMsg}</p>
                <div className="flex flex-col gap-2 pt-1 justify-center items-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-brand-pearl text-brand-charcoal rounded-full text-[8px] font-black uppercase tracking-widest hover:bg-brand-pearl/90 active:scale-95 transition-all border border-border-main/50 select-none cursor-pointer"
                  >
                    📂 {language === 'sr' ? 'Izaberi sliku' : language === 'zh' ? '上传二维码图片' : 'Upload QR Image'}
                  </button>
                  <button
                    onClick={startCamera}
                    className="text-[8px] font-bold text-white/70 hover:text-white underline tracking-wider uppercase select-none cursor-pointer"
                  >
                    {language === 'sr' ? 'Započni strim kamere' : language === 'zh' ? '或启用 live 摄像头' : 'Or try live Camera Stream'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 w-full px-4 flex flex-col items-center">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-[220px] px-5 py-3 bg-brand-charcoal text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-brand-charcoal/90 hover:scale-[1.02] active:scale-[0.98] transition-all border border-white/10 select-none cursor-pointer"
                >
                  📸 {language === 'sr' ? 'Slikaj ili učitaj QR' : language === 'zh' ? '拍照或上传二维码' : 'Take Photo or Choose QR'}
                </button>
                
                <button
                  onClick={startCamera}
                  className="text-[8px] font-medium text-white/50 hover:text-white/80 transition-all select-none cursor-pointer"
                >
                  {language === 'sr' ? 'Započni skeniranje uživo' : language === 'zh' ? '开启即时视频扫描' : 'Use live Video Scanner'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <video 
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              muted
              playsInline
              autoPlay
            />
            {/* Target overlay corners */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[180px] h-[180px] border-2 border-white/25 rounded-2xl relative">
                {/* Custom corners */}
                <span className="absolute -top-[2px] -left-[2px] w-5 h-5 border-t-[3px] border-l-[3px] border-accent-teal rounded-tl-lg" />
                <span className="absolute -top-[2px] -right-[2px] w-5 h-5 border-t-[3px] border-r-[3px] border-accent-teal rounded-tr-lg" />
                <span className="absolute -bottom-[2px] -left-[2px] w-5 h-5 border-b-[3px] border-l-[3px] border-accent-teal rounded-bl-lg" />
                <span className="absolute -bottom-[2px] -right-[2px] w-5 h-5 border-b-[3px] border-r-[3px] border-accent-teal rounded-br-lg" />
                
                {/* Horizontal Scan line */}
                <div className="absolute left-[10%] right-[10%] top-1/2 -translate-y-1/2 h-[1px] bg-accent-teal shadow-[0_0_12px_#008080] opacity-80 animate-[ping_1.8s_infinite] pointer-events-none" />
              </div>
            </div>

            {/* Quick Torch Option */}
            {hasTorch && (
              <button
                onClick={toggleTorch}
                className={`absolute bottom-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-xl text-white border border-white/10 active:scale-90 transition-all select-none cursor-pointer ${torchOn ? 'text-yellow-400 border-yellow-400/50 bg-yellow-950/40' : ''}`}
              >
                <Zap size={14} className={torchOn ? 'fill-yellow-400' : ''} />
              </button>
            )}

            {/* Tap to stop */}
            <button
              onClick={stopCamera}
              className="absolute bottom-4 left-4 flex items-center gap-1 px-3 py-1.5 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-full text-[7px] font-black uppercase tracking-wider transition-all select-none cursor-pointer border border-white/10"
            >
              <RefreshCw size={8} className="animate-spin" />
              <span>Pause Scan</span>
            </button>
          </>
        )}
      </div>

      {/* Hidden processing canvas & file input */}
      <canvas ref={canvasRef} className="hidden" />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
}
