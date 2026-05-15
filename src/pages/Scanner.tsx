// import React, { useState, useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { Camera, Square, CheckCircle, RefreshCw, X, AlertCircle, Scan, ArrowLeft } from "lucide-react";
// import { Html5Qrcode } from "html5-qrcode";
// import { motion, AnimatePresence } from "motion/react";
// import { cn, fetchWithAuth } from "../lib/utils";

// export default function Scanner() {
//   const [resi, setResi] = useState("");
//   const [manualResi, setManualResi] = useState("");
//   const [isRecording, setIsRecording] = useState(false);
//   const [status, setStatus] = useState<"idle" | "scanning" | "recording" | "uploading" | "success">("idle");
//   const [error, setError] = useState("");
//   const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  
//   // STATE BARU UNTUK MODAL DUPLIKAT
//   const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
//   const [pendingResi, setPendingResi] = useState("");
  
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const manualInputRef = useRef<HTMLInputElement>(null);
//   const mediaRecorderRef = useRef<MediaRecorder | null>(null);
//   const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
//   const streamRef = useRef<MediaStream | null>(null);
//   const activeResiRef = useRef<string>("");
//   const isCheckingRef = useRef<boolean>(false); // Mencegah scan berulang saat mengecek

//   const navigate = useNavigate();

//   useEffect(() => {
//     if (manualInputRef.current) manualInputRef.current.focus();

//     const handleGlobalClick = () => {
//       if ((status === "scanning" || status === "recording" || status === "idle") && manualInputRef.current && !isDuplicateModalOpen) {
//         manualInputRef.current.focus();
//       }
//     };
//     document.addEventListener("click", handleGlobalClick);
    
//     const timer = setTimeout(() => {
//       startScanner();
//     }, 500);
    
//     return () => {
//       document.removeEventListener("click", handleGlobalClick);
//       clearTimeout(timer);
//       stopScanner();
//       stopCamera();
//     };
//   }, [status, isDuplicateModalOpen]);

//   const getSupportedMimeType = () => {
//     const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
//     return types.find(type => MediaRecorder.isTypeSupported(type)) || "";
//   };

//   const handleManualScan = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (manualResi.trim()) {
//       processBarcode(manualResi.trim());
//     }
//   };

//   // LOGIKA BARU: Cek duplikat terlebih dahulu sebelum pindah rekaman
//   const processBarcode = async (code: string) => {
//     if (isCheckingRef.current) return; // Cegah double trigger
//     isCheckingRef.current = true;
//     console.log("Checking Barcode:", code);
    
//     try {
//       const res = await fetchWithAuth(`/packing/check/${code}`);
//       const data = await res.json();

//       if (data.exists) {
//         // Jika duplikat, munculkan modal (rekaman saat ini biarkan tetap jalan)
//         setPendingResi(code);
//         setIsDuplicateModalOpen(true);
//       } else {
//         // Jika aman, langsung eksekusi perpindahan rekaman
//         executeBarcodeSwitch(code);
//       }
//     } catch (err) {
//       console.error("Gagal cek resi, melanjutkan sebagai fallback", err);
//       executeBarcodeSwitch(code);
//     } finally {
//       isCheckingRef.current = false;
//       setManualResi("");
//     }
//   };

//   // FUNGSI PERPINDAHAN REKAMAN (Dipisah agar bisa dipanggil dari Modal)
//   const executeBarcodeSwitch = (code: string) => {
//     if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
//       console.log("Saving previous recording and switching to new resi:", code);
//       mediaRecorderRef.current.stop(); // Stop rekaman lama (otomatis ter-upload)
      
//       setTimeout(() => {
//         setResi(code);
//         activeResiRef.current = code;
//         startRecording(code, true); 
//       }, 500);
//     } else {
//       setResi(code);
//       activeResiRef.current = code;
//       stopScanner();
//       setTimeout(() => {
//         startRecording(code);
//       }, 800);
//     }
//   };

//   const startScanner = async () => {
//     console.log("Initializing scanner...");
//     if (status === "recording" || status === "uploading") return;
    
//     setStatus("scanning");
//     setError("");
    
//     try {
//       if (html5QrCodeRef.current) {
//         await stopScanner();
//       }
      
//       const html5QrCode = new Html5Qrcode("qr-reader");
//       html5QrCodeRef.current = html5QrCode;
      
//       const config = { fps: 15, qrbox: { width: 250, height: 150 } };
      
//       await html5QrCode.start(
//         { facingMode: "environment" }, 
//         config,
//         (decodedText) => {
//           processBarcode(decodedText);
//         },
//         () => {}
//       );
//     } catch (err: any) {
//       console.error("Scanner Init Error:", err);
//       if (!err.message?.includes("id = qr-reader")) {
//         setError("Gagal memulai scanner. Pastikan izin kamera aktif.");
//       }
//     }
//   };

//   const stopScanner = async () => {
//     if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
//       try {
//         await html5QrCodeRef.current.stop();
//         html5QrCodeRef.current = null;
//       } catch (err) {
//         console.error("Stop scanner error:", err);
//       }
//     }
//   };

//   const startRecording = async (resiCode: string, reuseStream = false) => {
//     console.log("Starting recording for resi:", resiCode);
//     setStatus("recording");
//     setError("");
//     try {
//       let stream: MediaStream;
//       if (reuseStream && streamRef.current) {
//         stream = streamRef.current;
//       } else {
//         try {
//           stream = await navigator.mediaDevices.getUserMedia({ 
//             video: { facingMode: "environment" },
//             audio: true 
//           });
//         } catch (e) {
//           stream = await navigator.mediaDevices.getUserMedia({ 
//             video: { facingMode: "environment" },
//             audio: false
//           });
//         }
//       }

//       streamRef.current = stream;
//       if (videoRef.current) {
//         videoRef.current.srcObject = stream;
//         videoRef.current.play();
//       }

//       const mimeType = getSupportedMimeType();
//       // KOMPRESI SUDAH DITERAPKAN DI SINI:
//       const options = {
//         mimeType: 'video/webm;codecs=vp8',
//         videoBitsPerSecond: 250000 
//       };   
//       const mediaRecorder = new MediaRecorder(stream, options);
//       const chunks: BlobPart[] = [];
//       const recordingFor = resiCode;
     
//       mediaRecorder.ondataavailable = (e) => {
//         if (e.data.size > 0) chunks.push(e.data);
//       };
      
//       mediaRecorder.onstop = async () => {
//         const finalBlob = new Blob(chunks, { type: mimeType });
//         uploadVideoBlob(finalBlob, recordingFor);
//       };
      
//       mediaRecorder.start(1000);
//       mediaRecorderRef.current = mediaRecorder;
//       setIsRecording(true);
//     } catch (err: any) {
//       setError(`Kamera tidak bisa diakses: ${err.message}`);
//       setStatus("idle");
//     }
//   };

//   const uploadVideoBlob = async (blobToUpload: Blob, resiCode: string) => {
//     if (!blobToUpload || blobToUpload.size === 0) return;
    
//     const formData = new FormData();
//     formData.append("video", blobToUpload, `${resiCode}.webm`);
//     formData.append("resiNumber", resiCode);

//     try {
//       const res = await fetchWithAuth("/packing", {
//         method: "POST",
//         body: formData,
//       });
//       if (!res.ok) throw new Error();
//       console.log(`Upload success for ${resiCode}`);
//     } catch (err) {
//       setError(`Gagal mengunggah video untuk resi ${resiCode}`);
//     }
//   };

//   const stopAll = () => {
//     if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
//       mediaRecorderRef.current.stop();
//     }
//     setIsRecording(false);
//     stopCamera();
//     setResi("");
//     setStatus("idle");
//     setTimeout(() => {
//       startScanner();
//     }, 500);
//   };

//   const stopCamera = () => {
//     if (streamRef.current) {
//       streamRef.current.getTracks().forEach(track => track.stop());
//       streamRef.current = null;
//     }
//   };

//   const reset = () => {
//     stopCamera();
//     setResi("");
//     setVideoBlob(null);
//     setStatus("idle");
//     setError("");
//     setTimeout(() => startScanner(), 500);
//   };

//   return (
//     <div className="space-y-6 max-w-4xl mx-auto">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <button onClick={() => navigate("/")} className="p-2 bg-white rounded-xl border border-slate-200">
//             <ArrowLeft size={20} />
//           </button>
//           <div>
//             <h2 className="text-xl font-bold text-slate-900 tracking-tight">Packing Pro</h2>
//             <p className="text-xs text-slate-500 font-medium">Mode: <span className="text-blue-600 uppercase font-bold text-[10px]">Autonext Record</span></p>
//           </div>
//         </div>
//         <div className={cn(
//           "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all",
//           status === "recording" ? "bg-red-100 text-red-600 shadow-sm" : 
//           "bg-blue-100 text-blue-600"
//         )}>
//           {status === "recording" && <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />}
//           {status === "recording" ? "Merekam..." : status}
//         </div>
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="bg-slate-900 aspect-video md:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl relative border-4 border-white group">
//           <AnimatePresence mode="wait">
//             {(status === "scanning" || status === "idle") && (
//               <motion.div 
//                 key="scanner"
//                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//                 className="w-full h-full"
//               >
//                 <div id="qr-reader" className="w-full h-full border-none"></div>
//                 {status === "scanning" && (
//                   <div className="absolute inset-0 border-2 border-dashed border-white/20 m-12 pointer-events-none rounded-2xl flex items-center justify-center">
//                       <div className="w-full h-1 bg-blue-500/30 blur-sm animate-[scan_2s_ease-in-out_infinite]" />
//                   </div>
//                 )}
//               </motion.div>
//             )}

//             {status === "recording" && (
//               <motion.video
//                 key="video"
//                 ref={videoRef}
//                 autoPlay
//                 muted
//                 playsInline
//                 className="w-full h-full object-cover"
//               />
//             )}
//           </AnimatePresence>

//           {status === "recording" && (
//             <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-widest border border-white/10 shadow-lg">
//               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
//               RECORDING: {resi}
//             </div>
//           )}
//         </div>

//         <div className="space-y-6">
//           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
//             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 relative">Input Scanner</h3>
//             <form onSubmit={handleManualScan} className="flex gap-2 relative">
//               <input 
//                 ref={manualInputRef}
//                 type="text"
//                 placeholder="Scan resi baru di sini..."
//                 value={manualResi}
//                 onChange={(e) => setManualResi(e.target.value)}
//                 disabled={isDuplicateModalOpen}
//                 className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg disabled:opacity-50"
//               />
//               <button type="submit" disabled={isDuplicateModalOpen} className="bg-slate-900 text-white px-6 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50">OK</button>
//             </form>
//             <p className="text-[10px] text-slate-400 mt-3 font-medium italic relative">*Perekaman berpindah otomatis saat scan resi lain terdeteksi.</p>
//           </div>

//           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm ring-1 ring-slate-100">
//             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Status Kerja</h3>
//             {resi ? (
//               <div className="space-y-4">
//                 <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-inner">
//                   <p className="text-[10px] text-slate-500 font-bold uppercase mb-1 tracking-widest">Resi Aktif</p>
//                   <p className="text-3xl font-black text-white tracking-tighter truncate">{resi}</p>
//                 </div>
                
//                 <button
//                   onClick={stopAll}
//                   className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-red-100 group"
//                 >
//                   <Square size={20} fill="currentColor" className="group-hover:scale-95 transition-transform" /> 
//                   Selesai Kerja (Stop Record)
//                 </button>
//               </div>
//             ) : (
//               <div className="flex flex-col items-center justify-center py-10 text-center">
//                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4 border border-dashed border-slate-200">
//                   <Scan size={32} />
//                 </div>
//                 <p className="text-slate-400 font-medium tracking-tight">Siap bekerja, silakan scan paket</p>
//               </div>
//             )}
//           </div>

//           <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-lg">
//              <h3 className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-4">Efisiensi Maksimal</h3>
//              <ul className="space-y-4">
//                {[
//                  "Scan paket & langsung packing",
//                  "Selesai satu, langsung scan paket berikutnya",
//                  "Sistem otomatis mengelola video rekaman"
//                ].map((step, idx) => (
//                  <li key={idx} className="flex gap-3 items-start">
//                     <CheckCircle size={16} className="text-blue-200 mt-0.5 shrink-0" />
//                     <p className="text-xs font-bold leading-relaxed">{step}</p>
//                  </li>
//                ))}
//              </ul>
//           </div>
//         </div>
//       </div>

//       {error && (
//         <motion.div 
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 border border-red-100"
//         >
//           <AlertCircle size={20} />
//           <p className="text-sm font-bold">{error}</p>
//           <button onClick={reset} className="ml-auto text-xs underline font-bold px-3 py-1 bg-white rounded-lg shadow-sm">Ulangi</button>
//         </motion.div>
//       )}

//       {/* MODAL PERINGATAN DUPLIKAT RESI */}
//       <AnimatePresence>
//         {isDuplicateModalOpen && (
//           <motion.div 
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             className="fixed inset-0 z-[100] flex items-center justify-center p-4"
//           >
//             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDuplicateModalOpen(false)} />
//             <motion.div 
//               initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
//               className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center"
//             >
//               <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-red-50">
//                 <AlertCircle size={40} />
//               </div>
//               <h3 className="text-2xl font-black text-slate-900 mb-2">Resi Terdeteksi Ganda!</h3>
//               <p className="text-slate-500 font-medium mb-8 leading-relaxed">
//                 Nomor resi <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded font-bold">{pendingResi}</span> sudah pernah di-packing sebelumnya. Yakin ingin menimpa (overwrite) data lamanya?
//               </p>
//               <div className="flex gap-4">
//                 <button 
//                   onClick={() => {
//                     setIsDuplicateModalOpen(false);
//                     setPendingResi("");
//                     if (manualInputRef.current) manualInputRef.current.focus();
//                   }} 
//                   className="flex-1 py-3.5 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
//                 >
//                   Batalkan
//                 </button>
//                 <button 
//                   onClick={() => {
//                     setIsDuplicateModalOpen(false);
//                     executeBarcodeSwitch(pendingResi);
//                   }} 
//                   className="flex-1 py-3.5 font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
//                 >
//                   Ya, Timpa Data
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

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
  
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [pendingResi, setPendingResi] = useState("");
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeResiRef = useRef<string>("");
  const isCheckingRef = useRef<boolean>(false); 

  const navigate = useNavigate();

  useEffect(() => {
    if (manualInputRef.current) manualInputRef.current.focus();

    const handleGlobalClick = () => {
      if ((status === "scanning" || status === "recording" || status === "idle") && manualInputRef.current && !isDuplicateModalOpen) {
        manualInputRef.current.focus();
      }
    };
    document.addEventListener("click", handleGlobalClick);
    
    const timer = setTimeout(() => {
      startScanner();
    }, 500);
    
    return () => {
      document.removeEventListener("click", handleGlobalClick);
      clearTimeout(timer);
      stopScanner();
      stopCamera();
    };
  }, [status, isDuplicateModalOpen]);

  const getSupportedMimeType = () => {
    const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
    return types.find(type => MediaRecorder.isTypeSupported(type)) || "";
  };

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualResi.trim()) {
      processBarcode(manualResi.trim());
    }
  };

  const processBarcode = async (code: string) => {
    if (isCheckingRef.current) return; 
    isCheckingRef.current = true;
    console.log("Checking Barcode:", code);
    
    try {
      const res = await fetchWithAuth(`/packing/check/${code}`);
      const data = await res.json();

      if (data.exists) {
        // HANYA MUNCULKAN MODAL BLOCKING, TIDAK ADA OPSI TIMPA
        setPendingResi(code);
        setIsDuplicateModalOpen(true);
      } else {
        // Jika aman (belum ada), lanjut eksekusi perpindahan rekaman
        executeBarcodeSwitch(code);
      }
    } catch (err) {
      console.error("Gagal cek resi, melanjutkan sebagai fallback", err);
      // Jika server error sesaat, kita tetap izinkan lewat agar kerjaan gudang tidak terhenti
      executeBarcodeSwitch(code);
    } finally {
      isCheckingRef.current = false;
      setManualResi("");
    }
  };

  const executeBarcodeSwitch = (code: string) => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log("Saving previous recording and switching to new resi:", code);
      mediaRecorderRef.current.stop(); 
      
      setTimeout(() => {
        setResi(code);
        activeResiRef.current = code;
        startRecording(code, true); 
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
        () => {}
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
      } catch (err) {
        console.error("Stop scanner error:", err);
      }
    }
  };

  const startRecording = async (resiCode: string, reuseStream = false) => {
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
      const options = {
        mimeType: 'video/webm;codecs=vp8',
        videoBitsPerSecond: 250000 
      };   
      const mediaRecorder = new MediaRecorder(stream, options);
      const chunks: BlobPart[] = [];
      const recordingFor = resiCode;
     
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorder.onstop = async () => {
        const finalBlob = new Blob(chunks, { type: mimeType });
        uploadVideoBlob(finalBlob, recordingFor);
      };
      
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err: any) {
      setError(`Kamera tidak bisa diakses: ${err.message}`);
      setStatus("idle");
    }
  };

  const uploadVideoBlob = async (blobToUpload: Blob, resiCode: string) => {
    if (!blobToUpload || blobToUpload.size === 0) return;
    
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
                disabled={isDuplicateModalOpen}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg disabled:opacity-50"
              />
              <button type="submit" disabled={isDuplicateModalOpen} className="bg-slate-900 text-white px-6 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50">OK</button>
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

      {/* MODAL PERINGATAN DUPLIKAT RESI (HARD BLOCKING) */}
      <AnimatePresence>
        {isDuplicateModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDuplicateModalOpen(false)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-red-50">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Resi Ditolak!</h3>
              <p className="text-slate-500 font-medium mb-8 leading-relaxed">
                Nomor resi <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded font-bold">{pendingResi}</span> sudah pernah di-packing sebelumnya. Sistem menolak input data ganda.
              </p>
              <div className="flex justify-center">
                <button 
                  onClick={() => {
                    setIsDuplicateModalOpen(false);
                    setPendingResi("");
                    if (manualInputRef.current) manualInputRef.current.focus();
                  }} 
                  className="w-full py-4 font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-lg shadow-red-200"
                >
                  Mengerti & Lanjutkan Kerja
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}