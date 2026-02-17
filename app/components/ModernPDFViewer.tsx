'use client';

import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure PDF worker
if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
}

// Optimization options for the PDF document
const documentOptions = {
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

import CountdownTimer from './CountdownTimer';

interface ButtonPosition {
    top: string;
    left: string;
    width: string;
    height: string;
}

interface TimerConfig {
    page: number;
    top: string;
    left: string;
}

interface ButtonsConfig {
    map: ButtonPosition;
    rsvp: ButtonPosition;
}

interface ModernPDFViewerProps {
    file: string;
    onOpenRsvp: () => void;
    onOpenMap: () => void;
    onLoad?: (loaded: boolean) => void;
    timerConfig?: TimerConfig;
    buttonsConfig?: ButtonsConfig;
}

export default function ModernPDFViewer({ file, onOpenRsvp, onOpenMap, onLoad, timerConfig, buttonsConfig }: ModernPDFViewerProps) {
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
            const percent = Math.min(100, Math.round((loaded / total) * 100)); // Ensure it never goes above 100
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
                        <div className="text-3xl sm:text-4xl font-bold font-vibes animate-pulse whitespace-nowrap">Cargando Invitación...</div>

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
                options={documentOptions}
                loading={null}
                error={
                    <div className="text-red-500 p-10 font-bold bg-white rounded shadow font-playfair relative z-[60]">
                        Error al cargar el PDF. Por favor recarga la página.
                    </div>
                }
                className="shadow-2xl"
            >
                {Array.from(new Array(numPages), (el, index) => (
                    <div key={`page_${index + 1}`} className="relative group/page">
                        <Page
                            pageNumber={index + 1}
                            width={containerWidth ? Math.min(containerWidth, 800) : undefined}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            className="bg-white"
                            // Optimize rendering: lower DPR on mobile for speed
                            devicePixelRatio={typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1}
                            // Only trigger success on the first page to dissolve loader
                            onRenderSuccess={index === 0 ? onPageRenderSuccess : undefined}
                        />



                        {/* TIMER */}
                        {index + 1 === (timerConfig?.page || 1) && isLoaded && (
                            <div
                                className="absolute z-[40] pointer-events-none w-full"
                                style={{
                                    top: timerConfig?.top || '60%',
                                    left: timerConfig?.left || '50%',
                                    transform: 'translateX(-50%)',
                                }}
                            >
                                <CountdownTimer />
                            </div>
                        )}

                        {/* BUTTONS */}
                        {index + 1 === numPages && isLoaded && (
                            <>
                                {/* MAP BUTTON */}
                                <div
                                    onClick={onOpenMap}
                                    className="absolute cursor-pointer z-40 rounded-full hover:bg-black/5 transition-colors border-2 border-transparent hover:border-plum/20"
                                    style={{
                                        top: buttonsConfig?.map.top || '70.069%',
                                        left: buttonsConfig?.map.left || '12.180%',
                                        width: buttonsConfig?.map.width || '38.704%',
                                        height: buttonsConfig?.map.height || '7.913%',
                                    }}
                                    title="Ver Mapa"
                                />

                                {/* RSVP BUTTON */}
                                <div
                                    onClick={onOpenRsvp}
                                    className="absolute cursor-pointer z-40 rounded-full hover:bg-black/5 transition-colors border-2 border-transparent hover:border-plum/20"
                                    style={{
                                        top: buttonsConfig?.rsvp.top || '78.336%',
                                        left: buttonsConfig?.rsvp.left || '46.086%',
                                        width: buttonsConfig?.rsvp.width || '39.439%',
                                        height: buttonsConfig?.rsvp.height || '8.130%',
                                    }}
                                    title="Confirmar Asistencia"
                                />
                            </>
                        )}
                    </div>
                ))}
            </Document>
        </div>
    );
}
