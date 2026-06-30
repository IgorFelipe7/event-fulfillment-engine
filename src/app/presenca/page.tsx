"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, QrCode, Search, User, MapPin, ChevronDown, ChevronLeft, ArrowRight, UserPlus, Send } from 'lucide-react';

const CONGREGACOES = [
  "Adelaide", "Amanda 1", "Amanda 2", "Amanda 4", "Amanda 5", "Ângulo", "Boa Esperança", "Bom Repouso", "Brasil", "Carmem Cristina", "Colinas", "Conquista", "Esmeralda", "Fátima 1", "Figueiras", "Guedes", "Horto", "Interlagos", "Maria de Lourdes", "Mirante", "Nova América", "Nova Europa", "Nova Hortolândia 1", "Nova Hortolândia 2", "Odimar", "Orestes Ôngaro", "Paviotti", "Perón", "Poloni", "Pq. Hortolândia", "Remanso Campineiro", "Rita de Cassia", "Rosolém", "Santana", "São Bento", "São Jorge", "São Sebastião 1", "São Sebastião 2", "Santa Clara", "Templo Central", "Terras de Santa Maria",
];

export default function PresencaPage() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState<'search' | 'list' | 'register'>('search');
    const [results, setResults] = useState<any[]>([]);

    const [nome, setNome] = useState('');
    const [congregacao, setCongregacao] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

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
        if (cleanPhone.length < 10) {
            setError('Digite um número de WhatsApp válido.');
            return;
        }
        setLoading(true);

        try {
            const { data, error: fetchError } = await supabase
                .from('cadastros')
                .select('id, nome, congregacao')
                .eq('whatsapp', phone);

            if (fetchError) throw fetchError;

            if (!data || data.length === 0) {
                setStep('register');
            } else {
                setResults(data);
                setStep('list');
            }
        } catch (err) {
            setError('Falha na comunicação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (nome.length < 4 || !congregacao) {
            setError('Preencha seu nome e selecione sua congregação.');
            return;
        }
        setLoading(true);

        try {
            const { data, error: insertError } = await supabase
                .from('cadastros')
                .insert([{ nome, whatsapp: phone, congregacao }])
                .select()
                .single();

            if (insertError) throw insertError;

            try {
                const primeiroNome = nome.split(' ')[0];
                const cleanPhone = phone.replace(/\D/g, '');
                const urlTicket = `${window.location.origin}/ticket-cadastro/${data.id}`;
                const mensagem = `*CONGRESSO MPG 2026*\n━━━━━━━━━━━━━━━━━━━━━━━\nOlá, *${primeiroNome}*! 🙏\n\nSeu cadastro e passe foram gerados com sucesso.\n\n🎟 *Acesse seu Ticket de Entrada Oficial abaixo:* 👇\n${urlTicket}`;

                await fetch('/api/whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: cleanPhone, message: mensagem })
                });
            } catch (e) {}

            router.push(`/ticket-cadastro/${data.id}`);
        } catch (err) {
            setError('Falha ao registrar os dados. Tente novamente.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="absolute top-[-10%] -left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[#3c5491] rounded-full mix-blend-screen filter blur-[150px] opacity-20 pointer-events-none animate-pulse" />

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-[#3c5491]/10 border border-[#3c5491]/30 rounded-2xl flex items-center justify-center mb-5 mx-auto text-[#b1bbe8] shadow-[0_0_30px_rgba(60,84,145,0.2)]">
                        {step === 'register' ? <UserPlus size={28} /> : <QrCode size={28} />}
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-2">
                        {step === 'register' ? 'Novo Passe' : 'Acesso MPG 2026'}
                    </h1>
                    <p className="text-gray-400 text-xs font-medium tracking-wide">
                        {step === 'search' && 'Insira seu WhatsApp para buscar ou criar seu passe de entrada.'}
                        {step === 'list' && 'Selecione o passe ou adicione uma nova pessoa neste número:'}
                        {step === 'register' && 'Preencha rapidamente os dados para gerar o passe.'}
                    </p>
                </div>

                <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl transition-all duration-500">
                    {step === 'search' && (
                        <form onSubmit={handleSearch} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 ml-1">Número do WhatsApp</label>
                                <input type="tel" required placeholder="(19) 99999-9999" value={phone} onChange={handlePhoneChange} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:bg-white/10 focus:border-[#3c5491] transition-all outline-none font-medium text-sm" />
                            </div>

                            {error && (
                                <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl animate-in fade-in">
                                    {error}
                                </p>
                            )}

                            <button type="submit" disabled={loading || !phone} className="w-full h-[54px] bg-white text-[#050505] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#b1bbe8] transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.02]">
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <><Search size={18} /> Buscar / Cadastrar</>}
                            </button>
                        </form>
                    )}

                    {step === 'list' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4">
                            {results.map((cad) => (
                                <button key={cad.id} onClick={() => router.push(`/ticket-cadastro/${cad.id}`)} className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#b1bbe8] p-4 rounded-2xl transition-all group text-left">
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="w-10 h-10 rounded-full bg-[#3c5491]/20 flex items-center justify-center text-[#b1bbe8] shrink-0 border border-[#3c5491]/30">
                                            <User size={18} />
                                        </div>
                                        <div className="truncate">
                                            <p className="font-black text-white text-sm truncate">{cad.nome}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold truncate mt-0.5">{cad.congregacao}</p>
                                        </div>
                                    </div>
                                    <ArrowRight size={18} className="text-gray-600 group-hover:text-[#b1bbe8] transform group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                                </button>
                            ))}
                            
                            <div className="pt-4 border-t border-white/5 space-y-3">
                                <button onClick={() => { setNome(''); setCongregacao(''); setStep('register'); }} className="w-full flex items-center justify-center gap-2 py-4 bg-[#3c5491]/10 hover:bg-[#3c5491]/20 border border-[#3c5491]/30 text-[#b1bbe8] rounded-xl font-black text-xs uppercase tracking-widest transition-all">
                                    <UserPlus size={16} /> Adicionar Novo Passe
                                </button>
                                <button onClick={() => setStep('search')} className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors">
                                    <ChevronLeft size={16} /> Digitar outro número
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'register' && (
                        <form onSubmit={handleRegister} className="space-y-5 animate-in slide-in-from-right-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 ml-1">Número do WhatsApp</label>
                                <input type="text" readOnly value={phone} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-5 text-gray-500 outline-none font-medium text-sm cursor-not-allowed" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 ml-1">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input type="text" required placeholder="Seu nome" value={nome} onChange={e => setNome(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-white focus:bg-white/10 focus:border-[#3c5491] transition-all outline-none font-medium text-sm placeholder:text-gray-600" />
                                </div>
                            </div>

                            <div className="space-y-2 relative" ref={dropdownRef}>
                                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 ml-1">Sua Congregação</label>
                                <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`w-full bg-white/5 border ${isDropdownOpen ? 'border-[#b1bbe8] bg-white/10' : 'border-white/10'} rounded-2xl py-4 pl-12 pr-5 text-white flex justify-between items-center cursor-pointer transition-all text-sm font-medium`}>
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <span className={congregacao ? 'text-white' : 'text-gray-600'}>{congregacao || 'Selecione a igreja'}</span>
                                    <ChevronDown className={`text-gray-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} size={18} />
                                </div>
                                {isDropdownOpen && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-[#111] border border-white/10 rounded-2xl shadow-2xl max-h-48 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                                        {CONGREGACOES.map((cong) => (
                                            <div key={cong} className={`px-5 py-3 hover:bg-white/5 cursor-pointer text-sm transition-colors ${congregacao === cong ? 'bg-[#3c5491]/20 text-[#b1bbe8] font-bold' : 'text-gray-300'}`} onClick={() => { setCongregacao(cong); setIsDropdownOpen(false); }}>
                                                {cong}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {error && (
                                <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl animate-in fade-in">
                                    {error}
                                </p>
                            )}

                            <div className="pt-2 space-y-3">
                                <button type="submit" disabled={loading || nome.length < 4 || !congregacao} className="w-full h-[54px] bg-white text-[#050505] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#b1bbe8] transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.02]">
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Gerar Meu Passe</>}
                                </button>
                                <button type="button" onClick={() => { setStep(results.length > 0 ? 'list' : 'search'); setError(''); }} disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-30">
                                    <ChevronLeft size={16} /> Voltar
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}