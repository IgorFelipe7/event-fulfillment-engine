"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-qr-code';
import { Loader2, Trophy, Users, MonitorPlay } from 'lucide-react';

const CONGREGACOES = [
    "Adelaide", "Amanda 1", "Amanda 2", "Amanda 4", "Amanda 5", "Ângulo", "Boa Esperança", "Bom Repouso", "Brasil", "Carmem Cristina", "Colinas", "Conquista", "Esmeralda", "Fátima 1", "Figueiras", "Guedes", "Horto", "Interlagos", "Maria de Lourdes", "Mirante", "Nova América", "Nova Europa", "Nova Hortolândia 1", "Nova Hortolândia 2", "Odimar", "Orestes Ôngaro", "Paviotti", "Perón", "Poloni", "Pq. Hortolândia", "Remanso Campineiro", "Rita de Cassia", "Rosolém", "Santana", "São Bento", "São Jorge", "São Sebastião 1", "São Sebastião 2", "Santa Clara", "Templo Central", "Terras de Santa Maria",
];

function TelaoEngine() {
    const searchParams = useSearchParams();
    const eventoId = searchParams.get('evento');

    const [evento, setEvento] = useState<any>(null);
    const [cadastros, setCadastros] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        if (!eventoId) return;
        const [resEvento, resCadastros] = await Promise.all([
            supabase.from('eventos').select('*').eq('id', eventoId).single(),
            supabase.from('cadastros').select('*, presencas(*)')
        ]);

        if (resEvento.data) setEvento(resEvento.data);
        if (resCadastros.data) setCadastros(resCadastros.data);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();

        const channel = supabase.channel('telao-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'presencas', filter: `evento_id=eq.${eventoId}` }, () => {
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cadastros' }, () => {
                fetchData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [eventoId]);

    const totalPresencas = useMemo(() => {
        return cadastros.filter(c => c.presencas?.some((p: any) => p.evento_id === eventoId)).length;
    }, [cadastros, eventoId]);

    const ranking = useMemo(() => {
        return CONGREGACOES.map(cong => {
            const cads = cadastros.filter(c => c.congregacao === cong);
            const presencas = cads.filter(c => c.presencas?.some((p: any) => p.evento_id === selectedEventoId)).length;
            return { cong, presencas };
        }).filter(s => s.presencas > 0).sort((a, b) => b.presencas - a.presencas);
    }, [cadastros, eventoId]);

    const selectedEventoId = eventoId;

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020203] flex flex-col items-center justify-center space-y-4">
                <Loader2 size={64} className="text-emerald-500 animate-spin" />
                <p className="text-emerald-500/50 font-black tracking-widest uppercase text-sm">Conectando ao Evento...</p>
            </div>
        );
    }

    if (!evento) {
        return (
            <div className="min-h-screen bg-[#020203] flex items-center justify-center">
                <p className="text-red-500 font-black text-2xl uppercase tracking-widest">Link de Telão Inválido</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#020203] flex items-center justify-center overflow-hidden relative select-none font-sans p-8">
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-[#3c5491] rounded-full mix-blend-screen filter blur-[200px] opacity-20 pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-emerald-500 rounded-full mix-blend-screen filter blur-[200px] opacity-10 pointer-events-none animate-pulse" />

            <div className="w-full max-w-[1600px] h-full max-h-[900px] flex flex-col lg:flex-row items-center gap-12 lg:gap-20 relative z-10 animate-in fade-in zoom-in-95 duration-1000">
                
                <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                        <MonitorPlay size={16} className="text-emerald-400" />
                        <span className="text-emerald-400 text-xs font-black tracking-[0.3em] uppercase">Transmissão Ao Vivo</span>
                    </div>
                    
                    <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-none mb-4 drop-shadow-2xl">
                        {evento.nome}
                    </h1>
                    <p className="text-xl lg:text-2xl font-bold text-gray-500 uppercase tracking-[0.3em] mb-12">
                        Faça seu Check-in pelo celular
                    </p>

                    <div className="bg-white p-6 lg:p-10 rounded-[3rem] shadow-[0_0_100px_rgba(16,185,129,0.15)] border-8 border-white/5 transition-transform duration-700 hover:scale-105">
                        <QRCode value={`${typeof window !== 'undefined' ? window.location.origin : ''}/checkin?evento=${evento.id}`} size={360} bgColor="#ffffff" fgColor="#020203" level="H" />
                    </div>
                </div>

                <div className="flex-1 w-full flex flex-col gap-8">
                    <div className="bg-[#09090b]/80 backdrop-blur-3xl border border-white/10 p-8 lg:p-12 rounded-[3rem] shadow-2xl flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm lg:text-base font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                <Users size={20} className="text-emerald-500" /> Total Presentes
                            </p>
                            <p className="text-6xl lg:text-8xl font-black text-emerald-400 tracking-tighter leading-none drop-shadow-lg">
                                {totalPresencas}
                            </p>
                        </div>
                        <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center animate-pulse">
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)]" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 bg-[#09090b]/80 backdrop-blur-3xl border border-white/10 p-8 lg:p-12 rounded-[3rem] shadow-2xl flex flex-col h-full min-h-[400px]">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-6 mb-6">
                            <Trophy className="text-amber-400 shrink-0" size={32} />
                            <h4 className="font-black text-xl lg:text-2xl uppercase tracking-[0.2em] text-white">Ranking em Tempo Real</h4>
                        </div>
                        
                        <div className="flex-1 overflow-hidden flex flex-col gap-6">
                            {ranking.slice(0, 6).map((stat, idx) => {
                                const maxPresencas = ranking[0]?.presencas || 1;
                                const pct = Math.round((stat.presencas / maxPresencas) * 100);
                                return (
                                    <div key={stat.cong} className="space-y-3 animate-in slide-in-from-right-8 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                        <div className="flex justify-between items-end">
                                            <span className="text-white font-black text-lg lg:text-xl uppercase tracking-widest truncate max-w-[70%]">
                                                <span className={`${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-amber-700' : 'text-gray-600'} mr-3`}>#{idx + 1}</span>
                                                {stat.cong}
                                            </span>
                                            <span className="text-emerald-400 font-black text-xl lg:text-3xl leading-none">{stat.presencas}</span>
                                        </div>
                                        <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-1000 ${idx === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                            {ranking.length === 0 && (
                                <div className="flex-1 flex items-center justify-center">
                                    <p className="text-gray-600 text-lg font-black uppercase tracking-widest text-center">
                                        Nenhum check-in registrado ainda.<br/>O telão ganhará vida em breve!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function TelaoPublicoPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#020203] flex items-center justify-center"><Loader2 size={64} className="text-emerald-500 animate-spin" /></div>}>
            <TelaoEngine />
        </Suspense>
    );
}
