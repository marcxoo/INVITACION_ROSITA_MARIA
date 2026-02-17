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
    const [isLoaded, setIsLoaded] = useState(false);
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
        setIsLoaded(true);
        if (onLoad) onLoad(true);
    }

    return (
        <div className="w-full flex flex-col items-center bg-paper min-h-screen relative" ref={containerRef}>

            {!isLoaded && (
                <div className="fixed inset-0 z-[50] flex flex-col items-center justify-center bg-paper text-plum">
                    <div className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(#7A2D3E 1px, transparent 1px)',
                            backgroundSize: '20px 20px'
                        }}
                    />
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-baby-pink border-t-plum rounded-full animate-spin mb-6"></div>
                        <div className="text-4xl font-bold font-vibes animate-pulse">Cargando Invitación...</div>
                        <p className="mt-2 text-md font-playfair opacity-80">Preparando todos los detalles</p>
                    </div>
                </div>
            )}

            <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                    <div className="text-plum p-10 font-vibes text-xl">Cargando documento...</div>
                }
                error={
                    <div className="text-red-500 p-10 font-bold bg-white rounded shadow font-playfair">
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
