import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Square, CheckCircle, RefreshCw, X, AlertCircle, Scan, ArrowLeft } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "motion/react";
import { cn, fetchWithAuth } from "../lib/utils";

export default function Scanner() {
  const [resi, setResi] = useState("");
  const [manualResi, setManualResi] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<"idle" | "scanning" | "recording" | "uploading" | "success">("idle");
  const [error, setError] = useState("");
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeResiRef = useRef<string>("");

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualResi.trim()) {
      processBarcode(manualResi.trim());
      setManualResi("");
    }
  };
  
  const navigate = useNavigate();

  useEffect(() => {
    // Fokus awal
    if (manualInputRef.current) manualInputRef.current.focus();

    // Re-focus jika user klik tempat lain (untuk kenyamanan scanner fisik)
    const handleGlobalClick = () => {
      if ((status === "scanning" || status === "recording" || status === "idle") && manualInputRef.current) {
        manualInputRef.current.focus();
      }
    };
    document.addEventListener("click", handleGlobalClick);
    
    // Memberikan jeda agar DOM siap sebelum inisialisasi scanner
    const timer = setTimeout(() => {
      startScanner();
    }, 500);
    
    return () => {
      document.removeEventListener("click", handleGlobalClick);
      clearTimeout(timer);
      stopScanner();
      stopCamera();
    };
  }, [status]);

  const getSupportedMimeType = () => {
    const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
    return types.find(type => MediaRecorder.isTypeSupported(type)) || "";
  };

  const processBarcode = async (code: string) => {
    console.log("Processing Barcode:", code);
    
    // Jika sedang merekam, stop rekaman sebelumnya dan mulai baru
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log("Saving previous recording and switching to new resi:", code);
      mediaRecorderRef.current.stop();
      
      // Tunggu agar onstop diproses dan hardware siap
      setTimeout(() => {
        setResi(code);
        activeResiRef.current = code;
        startRecording(code, true); // true = reuse stream
      }, 500);
    } else {
      setResi(code);
      activeResiRef.current = code;
      stopScanner();
      setTimeout(() => {
        startRecording(code);
      }, 800);
    }
  };

  const startScanner = async () => {
    console.log("Initializing scanner...");
    if (status === "recording" || status === "uploading") return;
    
    setStatus("scanning");
    setError("");
    
    try {
      if (html5QrCodeRef.current) {
        await stopScanner();
      }
      
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;
      
      const config = { fps: 15, qrbox: { width: 250, height: 150 } };
      
      await html5QrCode.start(
        { facingMode: "environment" }, 
        config,
        (decodedText) => {
          processBarcode(decodedText);
        },
        () => {} // Abaikan error frame scanning
      );
    } catch (err: any) {
      console.error("Scanner Init Error:", err);
      if (!err.message?.includes("id = qr-reader")) {
        setError("Gagal memulai scanner. Pastikan izin kamera aktif.");
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
        console.log("Scanner stopped");
      } catch (err) {
        console.error("Stop scanner error:", err);
      }
    }
  };

  const startRecording = async (resiCode: string, reuseStream = false) => {
    console.log("Starting recording for resi:", resiCode);
    setStatus("recording");
    setError("");
    try {
      let stream: MediaStream;
      if (reuseStream && streamRef.current) {
        stream = streamRef.current;
      } else {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" },
            audio: true 
          });
        } catch (e) {
          console.warn("Microphone access failed, trying video only...");
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "environment" },
            audio: false
          });
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      const chunks: BlobPart[] = [];
      const recordingFor = resiCode; // Closure to preserve resi number
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorder.onstop = async () => {
        const finalBlob = new Blob(chunks, { type: mimeType });
        console.log(`Recording for ${recordingFor} stopped, uploading...`);
        uploadVideoBlob(finalBlob, recordingFor);
      };
      
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err: any) {
      console.error("Camera Access Error:", err);
      setError(`Kamera tidak bisa diakses: ${err.message}`);
      setStatus("idle");
    }
  };

  const uploadVideoBlob = async (blobToUpload: Blob, resiCode: string) => {
    if (!blobToUpload || blobToUpload.size === 0) return;
    
    console.log(`Uploading ${resiCode}...`);
    const formData = new FormData();
    formData.append("video", blobToUpload, `${resiCode}.webm`);
    formData.append("resiNumber", resiCode);

    try {
      const res = await fetchWithAuth("/packing", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error();
      console.log(`Upload success for ${resiCode}`);
    } catch (err) {
      console.error(`Upload failed for ${resiCode}`);
      setError(`Gagal mengunggah video untuk resi ${resiCode}`);
    }
  };

  const stopAll = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    stopCamera();
    setResi("");
    setStatus("idle");
    setTimeout(() => {
      startScanner();
    }, 500);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const reset = () => {
    stopCamera();
    setResi("");
    setVideoBlob(null);
    setStatus("idle");
    setError("");
    setTimeout(() => startScanner(), 500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="p-2 bg-white rounded-xl border border-slate-200">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Packing Pro</h2>
            <p className="text-xs text-slate-500 font-medium">Mode: <span className="text-blue-600 uppercase font-bold text-[10px]">Autonext Record</span></p>
          </div>
        </div>
        <div className={cn(
          "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all",
          status === "recording" ? "bg-red-100 text-red-600 shadow-sm" : 
          "bg-blue-100 text-blue-600"
        )}>
          {status === "recording" && <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />}
          {status === "recording" ? "Merekam..." : status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 aspect-video md:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white group">
          <AnimatePresence mode="wait">
            {(status === "scanning" || status === "idle") && (
              <motion.div 
                key="scanner"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <div id="qr-reader" className="w-full h-full border-none"></div>
                {status === "scanning" && (
                  <div className="absolute inset-0 border-2 border-dashed border-white/20 m-12 pointer-events-none rounded-2xl flex items-center justify-center">
                     <div className="w-full h-1 bg-blue-500/30 blur-sm animate-[scan_2s_ease-in-out_infinite]" />
                  </div>
                )}
              </motion.div>
            )}

            {status === "recording" && (
              <motion.video
                key="video"
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            )}
          </AnimatePresence>

          {status === "recording" && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-widest border border-white/10 shadow-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              RECORDING: {resi}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 relative">Input Scanner</h3>
            <form onSubmit={handleManualScan} className="flex gap-2 relative">
              <input 
                ref={manualInputRef}
                type="text"
                placeholder="Scan resi baru di sini..."
                value={manualResi}
                onChange={(e) => setManualResi(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
              />
              <button type="submit" className="bg-slate-900 text-white px-6 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-black transition-colors">OK</button>
            </form>
            <p className="text-[10px] text-slate-400 mt-3 font-medium italic relative">*Perekaman berpindah otomatis saat scan resi lain terdeteksi.</p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm ring-1 ring-slate-100">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Status Kerja</h3>
            {resi ? (
              <div className="space-y-4">
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-inner">
                  <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">Resi Aktif</p>
                  <p className="text-3xl font-black text-white tracking-tighter truncate">{resi}</p>
                </div>
                
                <button
                  onClick={stopAll}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-100 group"
                >
                  <Square size={20} fill="currentColor" className="group-hover:scale-95 transition-transform" /> 
                  Selesai Kerja (Stop Record)
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4 border border-dashed border-slate-200">
                  <Scan size={32} />
                </div>
                <p className="text-slate-400 font-medium tracking-tight">Siap bekerja, silakan scan paket</p>
              </div>
            )}
          </div>

          <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg">
             <h3 className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-4">Efisiensi Maksimal</h3>
             <ul className="space-y-4">
               {[
                 "Scan paket & langsung packing",
                 "Selesai satu, langsung scan paket berikutnya",
                 "Sistem otomatis mengelola video rekaman"
               ].map((step, idx) => (
                 <li key={idx} className="flex gap-3 items-start">
                    <CheckCircle size={16} className="text-blue-200 mt-0.5 shrink-0" />
                    <p className="text-xs font-bold leading-relaxed">{step}</p>
                 </li>
               ))}
             </ul>
          </div>
        </div>
      </div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100"
        >
          <AlertCircle size={20} />
          <p className="text-sm font-bold">{error}</p>
          <button onClick={reset} className="ml-auto text-xs underline font-bold px-3 py-1 bg-white rounded-lg shadow-sm">Ulangi</button>
        </motion.div>
      )}
    </div>
  );
}
