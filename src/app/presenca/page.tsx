"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, QrCode, Search, UserPlus, ChevronLeft, User, ArrowRight } from 'lucide-react';

export default function MeuPassePage() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const router = useRouter();

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
        if (cleanPhone.length < 10) return setError('Digite um número válido com DDD.');
        setLoading(true);

        try {
            const { data, error: fetchError } = await supabase
                .from('cadastros')
                .select('id, nome, congregacao')
                .eq('whatsapp', phone);

            if (fetchError) throw fetchError;

            if (!data || data.length === 0) {
                setError('Inscrição não localizada. Verifique o número ou faça seu cadastro.');
            } else if (data.length === 1) {
                router.push(`/ticket-cadastro/${data[0].id}`);
            } else {
                setResults(data);
            }
        } catch (err) {
            setError('Erro ao buscar o passe. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="absolute top-[-10%] -left-[-10%] w-[300px] h-[300px] bg-[#3c5491] rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none" />

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-[#3c5491]/10 border border-[#3c5491]/30 rounded-2xl flex items-center justify-center mb-4 mx-auto text-[#b1bbe8]">
                        <QrCode size={24} />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Resgatar Meu Passe</h1>
                    <p className="text-gray-400 text-xs font-medium tracking-wide">
                        {results.length > 0 ? 'Múltiplos cadastros encontrados. Selecione qual passe deseja visualizar:' : 'Insira o WhatsApp informado no cadastro para acessar seu QR Code de entrada.'}
                    </p>
                </div>

                <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl transition-all duration-500">
                    {results.length > 0 ? (
                        <div className="space-y-4">
                            {results.map((cad) => (
                                <button
                                    key={cad.id}
                                    onClick={() => router.push(`/ticket-cadastro/${cad.id}`)}
                                    className="w-full flex items-center justify-between bg-[#111] hover:bg-white/5 border border-white/5 hover:border-[#b1bbe8] p-4 rounded-2xl transition-all group text-left"
                                >
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className="w-10 h-10 rounded-full bg-[#3c5491]/20 flex items-center justify-center text-[#b1bbe8] shrink-0">
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
                            <button
                                onClick={() => setResults([])}
                                className="w-full flex items-center justify-center gap-2 py-4 text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors mt-2"
                            >
                                <ChevronLeft size={16} /> Voltar e buscar outro
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSearch} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 ml-1">Número do WhatsApp</label>
                                <input type="tel" required placeholder="(19) 99999-9999" value={phone} onChange={handlePhoneChange} className="w-full bg-[#111] border border-white/5 rounded-xl py-4 px-4 text-white focus:bg-white/5 focus:border-[#3c5491] transition-all outline-none font-medium text-sm" />
                            </div>

                            {error && (
                                <div className="space-y-3 animate-in fade-in zoom-in-95">
                                    <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">
                                        {error}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => router.push('/form')}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-white/10"
                                    >
                                        <UserPlus size={16} /> Fazer Cadastro Agora
                                    </button>
                                </div>
                            )}

                            <button type="submit" disabled={loading || !phone} className="w-full h-[52px] bg-white text-[#050505] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#b1bbe8] transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.02]">
                                {loading ? <Loader2 size={16} className="animate-spin" /> : <><Search size={16} /> Buscar Passe</>}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}