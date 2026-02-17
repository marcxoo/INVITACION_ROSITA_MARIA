'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF worker
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface ModernPDFViewerProps {
    file: string;
    onOpenRsvp: () => void;
    onOpenMap: () => void;
    onLoad?: (loaded: boolean) => void;
}

export default function ModernPDFViewer({ file, onOpenRsvp, onOpenMap, onLoad }: ModernPDFViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [isLoaded, setIsLoaded] = useState(false); // Controls the logical "ready" state
    const [showLoader, setShowLoader] = useState(true); // Controls the visual presence of loader
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [containerWidth, setContainerWidth] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Update container width for responsiveness
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };

        window.addEventListener('resize', updateWidth);
        updateWidth();

        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    // Called when the FIRST page is fully painted on current view
    function onPageRenderSuccess() {
        if (!isLoaded) {
            // Add a small buffer to ensure visual stability
            setTimeout(() => {
                setIsLoaded(true);
                if (onLoad) onLoad(true);

                // Start fading out
                setTimeout(() => {
                    setShowLoader(false);
                }, 500); // Wait for transition duration
            }, 500);
        }
    }

    // Callback for download progress
    function onDocumentLoadProgress({ loaded, total }: { loaded: number; total: number }) {
        if (total > 0) {
            const percent = Math.round((loaded / total) * 100);
            setLoadingProgress(percent);
        }
    }

    return (
        <div className="w-full flex flex-col items-center bg-paper min-h-screen relative" ref={containerRef}>

            {/* LOADER - Always present in DOM until fading is done, changing opacity */}
            {showLoader && (
                <div
                    className={`fixed inset-0 z-[50] flex flex-col items-center justify-center bg-paper text-plum transition-opacity duration-700 ease-in-out ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
                >
                    <div className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(#7A2D3E 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}
                    />
                    <div className="relative z-10 flex flex-col items-center w-full max-w-xs px-6">
                        <div className="w-16 h-16 border-4 border-baby-pink border-t-plum rounded-full animate-spin mb-6"></div>
                        <div className="text-4xl font-bold font-vibes animate-pulse">Cargando Invitación...</div>

                        {/* PROGRESS BAR */}
                        <div className="w-full h-2 bg-gray-200 rounded-full mt-6 overflow-hidden border border-plum/10">
                            <div
                                className="h-full bg-plum transition-all duration-300 ease-out"
                                style={{ width: `${loadingProgress}%` }}
                            />
                        </div>
                        <p className="mt-2 text-sm font-playfair opacity-80">{loadingProgress}% completado</p>
                    </div>
                </div>
            )}

            <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadProgress={onDocumentLoadProgress}
                loading={null} // We handle loading with our custom overlay
                error={
                    <div className="text-red-500 p-10 font-bold bg-white rounded shadow font-playfair relative z-[60]">
                        Error al cargar el PDF. Por favor recarga la página.
                    </div>
                }
                className="shadow-2xl"
            >
                {Array.from(new Array(numPages), (el, index) => (
                    <div key={`page_${index + 1}`} className="relative">
                        <Page
                            pageNumber={index + 1}
                            width={containerWidth ? Math.min(containerWidth, 800) : undefined}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="bg-white"
                            // Only trigger success on the first page to dissolve loader
                            onRenderSuccess={index === 0 ? onPageRenderSuccess : undefined}
                        />

                        {/* Interactive Buttons on Last Page */}
                        {index + 1 === numPages && isLoaded && (
                            <>
                                {/* MAP BUTTON */}
                                <div
                                    onClick={onOpenMap}
                                    className="absolute cursor-pointer z-20 rounded-full hover:bg-black/5 transition-colors"
                                    style={{
                                        top: '70.069%',
                                        left: '12.180%',
                                        width: '38.704%',
                                        height: '7.913%',
                                    }}
                                    title="Ver Mapa"
                                />

                                {/* RSVP BUTTON */}
                                <div
                                    onClick={onOpenRsvp}
                                    className="absolute cursor-pointer z-20 rounded-full hover:bg-black/5 transition-colors"
                                    style={{
                                        top: '78.336%',
                                        left: '46.086%',
                                        width: '39.439%',
                                        height: '8.130%',
                                    }}
                                    title="Confirmar Asistencia"
                                />
                            </>
                        )}
                    </div>
                ))}
            </Document>

            {/* Background decoration removed */}
        </div>
    );
}
