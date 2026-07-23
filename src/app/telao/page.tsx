"use client";

import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-qr-code';
import { Loader2, Trophy, Users, MonitorPlay, Sparkles, Terminal } from 'lucide-react';

const CONGREGACOES = [
    "Adelaide", "Amanda 1", "Amanda 2", "Amanda 4", "Amanda 5", "Ângulo", "Boa Esperança", "Bom Repouso", "Brasil", "Carmem Cristina", "Colinas", "Conquista", "Esmeralda", "Fátima 1", "Figueiras", "Guedes", "Horto", "Interlagos", "Maria de Lourdes", "Mirante", "Nova América", "Nova Europa", "Nova Hortolândia 1", "Nova Hortolândia 2", "Odimar", "Orestes Ôngaro", "Paviotti", "Perón", "Poloni", "Pq. Hortolândia", "Remanso Campineiro", "Rita de Cassia", "Rosolém", "Santana", "São Bento", "São Jorge", "São Sebastião 1", "São Sebastião 2", "Santa Clara", "Templo Central", "Terras de Santa Maria",
];

function TelaoEngine() {
    const searchParams = useSearchParams();
    const eventoId = searchParams.get('evento');

    const [evento, setEvento] = useState<any>(null);
    const [cadastros, setCadastros] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');
    const [lastUpdate, setLastUpdate] = useState(Date.now());

    const fetchData = useCallback(async () => {
        if (!eventoId) return;
        const [resEvento, resCadastros] = await Promise.all([
            supabase.from('eventos').select('*').eq('id', eventoId).single(),
            supabase.from('cadastros').select('*, presencas(*)')
        ]);

        if (resEvento.data) setEvento(resEvento.data);
        if (resCadastros.data) setCadastros(resCadastros.data);
        
        setLastUpdate(Date.now());
        setLoading(false);
    }, [eventoId]);

    useEffect(() => {
        setMounted(true);
        setBaseUrl(window.location.origin);
    }, []);

    useEffect(() => {
        if (!eventoId) return;
        
        fetchData();

        const channel = supabase.channel('telao-realtime')
            .on(
                'postgres_changes', 
                { event: '*', schema: 'public', table: 'presencas' }, 
                () => {
                    fetchData();
                }
            )
            .on(
                'postgres_changes', 
                { event: '*', schema: 'public', table: 'cadastros' }, 
                () => {
                    fetchData();
                }
            )
            .subscribe();

        return () => { 
            supabase.removeChannel(channel); 
        };
    }, [eventoId, fetchData]);

    const totalPresencas = useMemo(() => {
        return cadastros.filter(c => c.presencas?.some((p: any) => p.evento_id === eventoId)).length;
    }, [cadastros, eventoId]);

    const ranking = useMemo(() => {
        return CONGREGACOES.map(cong => {
            const cads = cadastros.filter(c => c.congregacao === cong);
            const presencas = cads.filter(c => c.presencas?.some((p: any) => p.evento_id === eventoId)).length;
            return { cong, presencas };
        }).filter(s => s.presencas > 0).sort((a, b) => b.presencas - a.presencas);
    }, [cadastros, eventoId]);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    if (!mounted || loading) {
        return (
            <div className="h-screen w-screen overflow-hidden bg-[#050505] flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                    <div className="absolute inset-0 blur-xl bg-emerald-500/20 rounded-full animate-pulse" />
                    <Loader2 size={64} className="text-emerald-400 animate-spin relative z-10" />
                </div>
                <p className="text-emerald-400/60 font-black tracking-[0.3em] uppercase text-sm animate-pulse">
                    Conectando...
                </p>
            </div>
        );
    }

    if (!evento) {
        return (
            <div className="h-screen w-screen overflow-hidden bg-[#050505] flex items-center justify-center p-6">
                <div className="bg-red-500/10 border border-red-500/20 px-8 py-6 rounded-3xl">
                    <p className="text-red-400 font-black text-2xl uppercase tracking-[0.2em]">Link Inválido</p>
                </div>
            </div>
        );
    }

    return (
        <div 
            onDoubleClick={toggleFullScreen}
            className="h-screen w-screen bg-[#050505] flex items-center justify-center overflow-hidden relative select-none font-sans p-6 xl:p-12 cursor-default"
        >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#10b98115,#050505_70%)] pointer-events-none" />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="w-full h-full max-w-[1920px] flex flex-col xl:flex-row items-center justify-between gap-8 xl:gap-16 relative z-10">
                
                <div className="flex-1 w-full max-w-[700px] flex flex-col items-center xl:items-start text-center xl:text-left justify-center h-full">
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6 xl:mb-10 backdrop-blur-md">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-emerald-400 text-xs xl:text-sm font-black tracking-[0.3em] uppercase">
                            Transmissão Ao Vivo
                        </span>
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl xl:text-[6rem] font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 tracking-tighter uppercase leading-[1.05] mb-4 xl:mb-6 drop-shadow-2xl">
                        {evento.nome}
                    </h1>
                    
                    <p className="text-base xl:text-2xl font-bold text-emerald-400/80 uppercase tracking-[0.2em] mb-8 xl:mb-14 flex items-center gap-3">
                        <Sparkles size={24} className="text-emerald-400 hidden xl:block animate-pulse" />
                        Aponte a câmera para check-in
                    </p>

                    <div className="relative group w-full max-w-[280px] xl:max-w-[420px] aspect-square">
                        <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-[2.5rem] blur opacity-20 animate-pulse" />
                        <div className="relative w-full h-full bg-white p-5 xl:p-8 rounded-[2rem] shadow-2xl flex items-center justify-center">
                            <QRCode value={`${baseUrl}/checkin?evento=${evento.id}`} size={420} bgColor="#ffffff" fgColor="#050505" level="H" style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                        </div>
                    </div>
                </div>

                <div className="flex-1 w-full max-w-[850px] flex flex-col gap-6 xl:gap-8 h-full justify-center pb-12 xl:pb-0">
                    <div key={`total-${lastUpdate}`} className="shrink-0 bg-white/[0.02] backdrop-blur-2xl border border-white/5 p-6 xl:p-10 rounded-[2rem] xl:rounded-[2.5rem] flex items-center justify-between shadow-2xl relative overflow-hidden animate-in slide-in-from-right-4 duration-500">
                        <div className="absolute top-0 right-0 w-48 h-48 xl:w-64 xl:h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                        <div className="relative z-10">
                            <p className="text-gray-400 text-xs xl:text-base font-black uppercase tracking-[0.3em] mb-2 xl:mb-3 flex items-center gap-2 xl:gap-3">
                                <Users size={20} className="text-emerald-500" /> Total Presentes
                            </p>
                            <p className="text-7xl xl:text-[8rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tighter leading-none">
                                {totalPresencas}
                            </p>
                        </div>
                        <div className="relative z-10 w-20 h-20 xl:w-32 xl:h-32 rounded-full border border-emerald-500/20 flex items-center justify-center bg-emerald-500/5 shadow-[0_0_50px_rgba(16,185,129,0.15)]">
                            <MonitorPlay size={40} className="text-emerald-400 opacity-80" />
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 bg-white/[0.02] backdrop-blur-2xl border border-white/5 p-6 xl:p-10 rounded-[2rem] xl:rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden">
                        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#050505] to-transparent z-10 pointer-events-none" />
                        
                        <div className="shrink-0 flex items-center gap-4 border-b border-white/5 pb-5 xl:pb-6 mb-5 xl:mb-6 relative z-20">
                            <div className="p-2.5 xl:p-3 bg-amber-500/10 rounded-xl xl:rounded-2xl border border-amber-500/20">
                                <Trophy className="text-amber-400 w-6 h-6 xl:w-8 xl:h-8" />
                            </div>
                            <h4 className="font-black text-xl xl:text-3xl uppercase tracking-[0.2em] text-white">Top Congregações</h4>
                        </div>
                        
                        <div className="flex-1 overflow-hidden flex flex-col justify-start gap-4 xl:gap-6 relative z-20">
                            {ranking.slice(0, 5).map((stat, idx) => {
                                const maxPresencas = ranking[0]?.presencas || 1;
                                const pct = Math.round((stat.presencas / maxPresencas) * 100);
                                
                                const getTrophyColor = (index: number) => {
                                    if (index === 0) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
                                    if (index === 1) return 'text-slate-300 bg-slate-300/10 border-slate-300/20';
                                    if (index === 2) return 'text-amber-600 bg-amber-600/10 border-amber-600/20';
                                    return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
                                };
                                
                                const getBarColor = (index: number) => {
                                    if (index === 0) return 'from-amber-400 to-orange-500 shadow-[0_0_15px_rgba(251,191,36,0.4)]';
                                    if (index === 1) return 'from-slate-300 to-slate-400';
                                    if (index === 2) return 'from-amber-600 to-amber-700';
                                    return 'from-emerald-500 to-cyan-500';
                                };

                                return (
                                    <div key={stat.cong} className="flex flex-col justify-center space-y-2 xl:space-y-3 animate-in slide-in-from-right-8 duration-700">
                                        <div className="flex justify-between items-end px-1">
                                            <div className="flex items-center gap-3 xl:gap-4 max-w-[80%]">
                                                <span className={`w-8 h-8 xl:w-11 xl:h-11 rounded-lg xl:rounded-xl flex items-center justify-center font-black text-sm xl:text-lg border ${getTrophyColor(idx)} shrink-0`}>
                                                    {idx + 1}
                                                </span>
                                                <span className="text-gray-200 font-bold text-lg xl:text-2xl uppercase tracking-widest truncate">
                                                    {stat.cong}
                                                </span>
                                            </div>
                                            <span key={`${stat.cong}-${stat.presencas}`} className="text-white font-black text-2xl xl:text-4xl leading-none animate-in zoom-in duration-300">
                                                {stat.presencas}
                                            </span>
                                        </div>
                                        <div className="w-full bg-[#0f0f12] h-2 xl:h-3 rounded-full overflow-hidden p-0.5 border border-white/5 shrink-0">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r ${getBarColor(idx)}`} 
                                                style={{ width: `${pct}%` }} 
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            
                            {ranking.length === 0 && (
                                <div className="h-full w-full flex flex-col items-center justify-center text-center px-4">
                                    <div className="w-16 h-16 xl:w-24 xl:h-24 bg-white/5 rounded-full flex items-center justify-center mb-4 xl:mb-6">
                                        <Users className="text-gray-600 w-8 h-8 xl:w-12 xl:h-12" />
                                    </div>
                                    <p className="text-gray-500 text-base xl:text-2xl font-black uppercase tracking-[0.2em] leading-relaxed">
                                        Aguardando Check-ins<br/>
                                        <span className="text-emerald-500/50 text-xs xl:text-base">O ranking aparecerá aqui</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-[#050505]/80 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_0_40px_rgba(0,0,0,0.8)] z-50">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-[10px] xl:text-xs font-bold tracking-[0.3em] uppercase">
                        Developed By
                    </span>
                    <span className="text-white text-xs xl:text-sm font-black tracking-widest uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                        Igor Felipe
                    </span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                    </svg>
                    <span className="text-emerald-500/80 text-[10px] xl:text-xs font-black tracking-[0.2em]">
                        @_igorfelipe7
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function TelaoPublicoPage() {
    return (
        <Suspense fallback={
            <div className="h-screen w-screen overflow-hidden bg-[#050505] flex items-center justify-center">
                <Loader2 size={64} className="text-emerald-500 animate-spin" />
            </div>
        }>
            <TelaoEngine />
        </Suspense>
    );
}
