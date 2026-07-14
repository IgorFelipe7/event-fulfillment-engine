"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Smartphone, User, MapPin, ChevronDown, CheckCircle2, UserPlus, ArrowRight, XCircle } from 'lucide-react';

const CONGREGACOES = [
    "Adelaide", "Amanda 1", "Amanda 2", "Amanda 4", "Amanda 5", "Ângulo", "Boa Esperança", "Bom Repouso", "Brasil", "Carmem Cristina", "Colinas", "Conquista", "Esmeralda", "Fátima 1", "Figueiras", "Guedes", "Horto", "Interlagos", "Maria de Lourdes", "Mirante", "Nova América", "Nova Europa", "Nova Hortolândia 1", "Nova Hortolândia 2", "Odimar", "Orestes Ôngaro", "Paviotti", "Perón", "Poloni", "Pq. Hortolândia", "Remanso Campineiro", "Rita de Cassia", "Rosolém", "Santana", "São Bento", "São Jorge", "São Sebastião 1", "São Sebastião 2", "Santa Clara", "Templo Central", "Terras de Santa Maria",
];

function CheckinEngine() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const eventoId = searchParams.get('evento');

    const [evento, setEvento] = useState<any>(null);
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'search' | 'list' | 'register' | 'success'>('search');
    const [results, setResults] = useState<any[]>([]);
    const [successMsg, setSuccessMsg] = useState('');

    const [nome, setNome] = useState('');
    const [congregacao, setCongregacao] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!eventoId) return;
        async function fetchEvento() {
            const { data } = await supabase.from('eventos').select('*').eq('id', eventoId).single();
            if (data) setEvento(data);
        }
        fetchEvento();
    }, [eventoId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        let formatted = v;
        if (v.length > 2) formatted = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        if (v.length > 7) formatted = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
        setPhone(formatted);
        setError('');
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) return setError('Digite seu WhatsApp corretamente.');
        setLoading(true);

        try {
            const { data, error: fetchError } = await supabase
                .from('cadastros')
                .select('id, nome, congregacao, presencas(*)')
                .eq('whatsapp', phone);

            if (fetchError) throw fetchError;

            if (!data || data.length === 0) {
                setStep('register');
            } else if (data.length === 1) {
                await processCheckin(data[0].id, data[0].nome, data[0].presencas);
            } else {
                setResults(data);
                setStep('list');
            }
        } catch (err) {
            setError('Erro na conexão. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const processCheckin = async (cadastroId: string, nomeUsuario: string, presencasViasBusca?: any[]) => {
        setLoading(true);
        try {
            let jaBateu = false;
            
            if (presencasViasBusca) {
                jaBateu = presencasViasBusca.some(p => p.evento_id === eventoId);
            } else {
                const { data } = await supabase.from('presencas').select('id').eq('cadastro_id', cadastroId).eq('evento_id', eventoId).single();
                if (data) jaBateu = true;
            }

            if (jaBateu) {
                setSuccessMsg(`${nomeUsuario.split(' ')[0]}, sua presença já estava confirmada!`);
                setStep('success');
                return;
            }

            await supabase.from('presencas').insert([{ cadastro_id: cadastroId, evento_id: eventoId }]);
            setSuccessMsg(`Check-in confirmado, ${nomeUsuario.split(' ')[0]}! 🔥`);
            setStep('success');
        } catch (e) {
            setError('Falha ao registrar presença.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (nome.length < 4 || !congregacao) return setError('Preencha os dados.');
        setLoading(true);

        try {
            const { data, error: insertError } = await supabase
                .from('cadastros')
                .insert([{ nome, whatsapp: phone, congregacao }])
                .select()
                .single();

            if (insertError) throw insertError;

            await supabase.from('presencas').insert([{ cadastro_id: data.id, evento_id: eventoId }]);
            
            try {
                const primeiroNome = nome.split(' ')[0];
                const cleanPhone = phone.replace(/\D/g, '');
                const urlTicket = `${window.location.origin}/ticket-cadastro/${data.id}`;
                const mensagem = `*CONGRESSO MPG 2026*\n━━━━━━━━━━━━━━━━━━━━━━━\nOlá, *${primeiroNome}*! 🙏\n\nSua presença no evento de hoje foi confirmada com sucesso.\n\n🎟 *Acesse seu Ticket de Entrada e Histórico aqui:* 👇\n${urlTicket}`;

                await fetch('/api/whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: cleanPhone, message: mensagem })
                });
            } catch (e) {}

            setSuccessMsg(`Cadastro e Check-in concluídos, ${nome.split(' ')[0]}! 🔥`);
            setStep('success');
        } catch (err) {
            setError('Falha ao registrar.');
            setLoading(false);
        }
    };

    if (!eventoId) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
                <div className="bg-red-500/10 border border-red-500/30 p-8 rounded-3xl text-center max-w-sm w-full">
                    <XCircle size={48} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-white font-black text-xl mb-2">Acesso Inválido</h2>
                    <p className="text-gray-400 text-sm">Este QR Code não possui um evento vinculado.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="absolute top-[0%] right-[-10%] w-[400px] h-[400px] bg-emerald-500 rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none animate-pulse" />

            <div className="w-full max-w-sm relative z-10 animate-in fade-in zoom-in-95 duration-500">
                
                {step !== 'success' && (
                    <div className="text-center mb-8 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem]">
                        <div className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest uppercase mb-3">
                            Check-in Liberado
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-1">
                            {evento ? evento.nome : 'Carregando...'}
                        </h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">
                            {evento ? new Date(evento.data_evento).toLocaleDateString('pt-BR') : ''}
                        </p>
                    </div>
                )}

                <div className={`${step === 'success' ? '' : 'bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl'}`}>
                    {step === 'search' && (
                        <form onSubmit={handleSearch} className="space-y-6">
                            <div className="text-center mb-6">
                                <h2 className="text-white font-black text-lg mb-1">Confirme sua Presença</h2>
                                <p className="text-gray-400 text-xs font-medium">Digite seu WhatsApp para marcar presença.</p>
                            </div>

                            <div className="space-y-2">
                                <div className="relative">
                                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                    <input type="tel" required placeholder="(19) 99999-9999" value={phone} onChange={handlePhoneChange} className="w-full bg-[#111] border border-white/5 rounded-2xl py-4 pl-12 pr-5 text-white focus:bg-white/10 focus:border-emerald-500/50 transition-all outline-none font-medium text-base shadow-inner" />
                                </div>
                            </div>

                            {error && <p className="text-xs font-bold text-red-400 text-center">{error}</p>}

                            <button type="submit" disabled={loading || !phone} className="w-full h-[56px] bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                {loading ? <Loader2 size={20} className="animate-spin" /> : 'Avançar'}
                            </button>
                        </form>
                    )}

                    {step === 'list' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            <p className="text-center text-gray-400 text-xs font-bold mb-4 uppercase tracking-widest">Selecione quem você é:</p>
                            {results.map((cad) => {
                                const jaBateu = cad.presencas?.some((p: any) => p.evento_id === eventoId);
                                return (
                                    <button key={cad.id} onClick={() => processCheckin(cad.id, cad.nome)} disabled={jaBateu} className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group text-left ${jaBateu ? 'bg-emerald-500/10 border border-emerald-500/20 cursor-not-allowed' : 'bg-[#111] hover:bg-white/5 border border-white/5 hover:border-emerald-500/50'}`}>
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${jaBateu ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-gray-400'}`}>
                                                {jaBateu ? <CheckCircle2 size={18} /> : <User size={18} />}
                                            </div>
                                            <div className="truncate">
                                                <p className="font-black text-white text-sm truncate">{cad.nome}</p>
                                                <p className={`text-[10px] uppercase tracking-widest font-bold truncate mt-0.5 ${jaBateu ? 'text-emerald-500' : 'text-gray-500'}`}>{jaBateu ? 'Presença Confirmada' : cad.congregacao}</p>
                                            </div>
                                        </div>
                                        {!jaBateu && <ArrowRight size={18} className="text-gray-600 group-hover:text-emerald-500 transform group-hover:translate-x-1 transition-all shrink-0 ml-2" />}
                                    </button>
                                );
                            })}
                            <div className="pt-4 border-t border-white/5 mt-4">
                                <button onClick={() => { setNome(''); setCongregacao(''); setStep('register'); }} className="w-full flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                                    <UserPlus size={16} /> Cadastrar Outra Pessoa
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-5 animate-in slide-in-from-right-4">
                            <div className="text-center mb-6">
                                <h2 className="text-white font-black text-lg mb-1">Novo Cadastro</h2>
                                <p className="text-gray-400 text-xs font-medium">Preencha para concluir o check-in.</p>
                            </div>

                            <div className="space-y-2">
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input type="text" required placeholder="Nome Completo" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-[#111] border border-white/5 rounded-2xl py-4 pl-12 pr-5 text-white focus:bg-white/10 focus:border-emerald-500/50 transition-all outline-none font-medium text-sm" />
                                </div>
                            </div>

                            <div className="space-y-2 relative" ref={dropdownRef}>
                                <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`w-full bg-[#111] border ${isDropdownOpen ? 'border-emerald-500/50 bg-white/5' : 'border-white/5'} rounded-2xl py-4 pl-12 pr-5 text-white flex justify-between items-center cursor-pointer transition-all text-sm font-medium`}>
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <span className={congregacao ? 'text-white' : 'text-gray-500'}>{congregacao || 'Sua Congregação'}</span>
                                    <ChevronDown className={`text-gray-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} size={18} />
                                </div>
                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-[#111] border border-white/10 rounded-2xl shadow-2xl max-h-48 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                                        {CONGREGACOES.map((cong) => (
                                            <div key={cong} className={`px-5 py-3 hover:bg-white/5 cursor-pointer text-sm transition-colors ${congregacao === cong ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-gray-300'}`} onClick={() => { setCongregacao(cong); setIsDropdownOpen(false); }}>
                                                {cong}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {error && <p className="text-xs font-bold text-red-400 text-center">{error}</p>}

                            <button type="submit" disabled={loading || nome.length < 4 || !congregacao} className="w-full h-[56px] bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Finalizar Check-in'}
                            </button>
                        </form>
                    )}

                    {step === 'success' && (
                        <div className="bg-[#0a0a0a] border border-emerald-500/30 p-10 rounded-[2.5rem] shadow-2xl text-center animate-in zoom-in duration-500 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-emerald-600" />
                            <CheckCircle2 size={80} className="mx-auto text-emerald-500 mb-6 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                            <h3 className="text-2xl font-black text-white mb-3 tracking-tight">{successMsg}</h3>
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-8">Pode entrar e aproveitar o evento!</p>
                            <button onClick={() => { setStep('search'); setPhone(''); setNome(''); setCongregacao(''); }} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-white/10">
                                Próxima Pessoa
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AutoCheckinPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 size={40} className="text-emerald-500 animate-spin" /></div>}>
            <CheckinEngine />
        </Suspense>
    );
}