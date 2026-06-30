"use client";

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-qr-code';
import { Loader2, User, MapPin, Calendar, CheckCircle2, ShieldCheck, QrCode } from 'lucide-react';

export default function TicketCadastroPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const eventoId = searchParams.get('evento');
    
    const [cadastro, setCadastro] = useState<any>(null);
    const [evento, setEvento] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [jaBateu, setJaBateu] = useState(false);

    useEffect(() => {
        async function fetchTicketData() {
            if (!params?.id) return;
            
            const [resCad, resEv] = await Promise.all([
                supabase.from('cadastros').select('*, presencas(*)').eq('id', params.id).single(),
                eventoId ? supabase.from('eventos').select('*').eq('id', eventoId).single() : Promise.resolve({ data: null })
            ]);

            if (resCad.data) {
                setCadastro(resCad.data);
                if (eventoId) {
                    const bateu = resCad.data.presencas?.some((p: any) => p.evento_id === eventoId);
                    setJaBateu(bateu);
                }
            }
            if (resEv.data) setEvento(resEv.data);
            setLoading(false);
        }

        fetchTicketData();

        const channel = supabase.channel('realtime-ticket')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'presencas', filter: `cadastro_id=eq.${params?.id}` }, () => {
                fetchTicketData();
            }).subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [params?.id, eventoId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020203] flex items-center justify-center">
                <Loader2 size={40} className="text-[#3c5491] animate-spin" />
            </div>
        );
    }

    if (!cadastro) {
        return (
            <div className="min-h-screen bg-[#020203] flex items-center justify-center text-white font-black text-xl">
                PASSE INVÁLIDO.
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020203] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none">
            <div className="absolute top-[-20%] left-[-20%] w-[400px] h-[300px] bg-[#3c5491] rounded-full mix-blend-screen filter blur-[120px] opacity-30 pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-10%] w-[350px] h-[350px] bg-[#b1bbe8] rounded-full mix-blend-screen filter blur-[150px] opacity-15 pointer-events-none" />

            <div className="w-full max-w-sm relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl mb-3">
                        <ShieldCheck size={12} className="text-[#b1bbe8]" />
                        <span className="text-[9px] font-black text-[#b1bbe8] tracking-[0.2em] uppercase">Membro Verificado</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter">
                        DZ<span className="text-[#3c5491]">.</span>PRESENÇA
                    </h1>
                </div>

                <div className={`relative rounded-[2.5rem] p-[1px] transition-all duration-700 ${jaBateu ? 'bg-gradient-to-b from-emerald-500/50 via-emerald-500/10 to-transparent shadow-[0_0_60px_rgba(16,185,129,0.25)]' : 'bg-gradient-to-b from-white/10 via-white/5 to-transparent shadow-2xl'}`}>
                    <div className="bg-[#09090b]/90 backdrop-blur-3xl rounded-[2.4rem] p-6 relative overflow-hidden border border-white/5">
                        
                        <div className="flex justify-between items-center mb-6 bg-white/5 p-3 rounded-2xl border border-white/5">
                            <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">Frequência Total</span>
                            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-black px-3 py-1 rounded-xl">
                                {cadastro.presencas?.length || 0} Presenças
                            </span>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className={`p-4 rounded-3xl mb-6 relative transition-all duration-700 bg-white ${jaBateu ? 'scale-95 opacity-25 filter blur-[2px]' : 'shadow-2xl'}`}>
                                <QRCode value={cadastro.id} size={180} bgColor="#ffffff" fgColor="#09090b" level="H" />
                            </div>

                            {jaBateu && (
                                <div className="absolute top-[35%] flex flex-col items-center gap-2 animate-in zoom-in duration-500 z-20">
                                    <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.6)] animate-bounce">
                                        <CheckCircle2 size={32} className="text-white" />
                                    </div>
                                    <span className="font-black text-emerald-400 uppercase tracking-[0.2em] text-xs text-center drop-shadow-md">Entrada Liberada</span>
                                </div>
                            )}

                            <div className="w-full space-y-4 pt-4 border-t border-white/5">
                                <div className="text-center">
                                    <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-bold mb-1">Membro</p>
                                    <p className="font-black text-xl text-white tracking-tight leading-none truncate">{cadastro.nome}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 bg-white/5 p-3 rounded-2xl border border-white/5 text-center">
                                    <div>
                                        <p className="text-[8px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Congregação</p>
                                        <p className="font-bold text-[#b1bbe8] text-xs truncate">{cadastro.congregacao}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] text-gray-500 uppercase tracking-widest font-bold mb-0.5">Evento Atual</p>
                                        <p className="font-bold text-white text-xs truncate">{evento ? evento.nome : 'Geral / Livre'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-[9px] uppercase tracking-[0.2em] font-black flex items-center justify-center gap-1.5">
                        <QrCode size={12} /> ID Único: {cadastro.id.split('-')[0].toUpperCase()}
                    </p>
                </div>
            </div>
        </div>
    );
}