"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, QrCode, Search } from 'lucide-react';

export default function MeuPassePage() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
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
                .select('id')
                .eq('whatsapp', phone)
                .maybeSingle();

            if (fetchError || !data) {
                setError('Inscrição não localizada. Verifique o número ou faça seu cadastro primeiro.');
            } else {
                router.push(`/ticket-cadastro/${data.id}`);
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

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-[#3c5491]/10 border border-[#3c5491]/30 rounded-2xl flex items-center justify-center mb-4 mx-auto text-[#b1bbe8]">
                        <QrCode size={24} />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter mb-2">Resgatar Meu Passe</h1>
                    <p className="text-gray-400 text-xs font-medium tracking-wide">Insira o WhatsApp informado no cadastro para acessar seu QR Code de entrada.</p>
                </div>

                <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl">
                    <form onSubmit={handleSearch} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 ml-1">Número do WhatsApp</label>
                            <input type="tel" required placeholder="(19) 99999-9999" value={phone} onChange={handlePhoneChange} className="w-full bg-[#111] border border-white/5 rounded-xl py-4 px-4 text-white focus:bg-white/5 focus:border-[#3c5491] transition-all outline-none font-medium text-sm" />
                        </div>

                        {error && (
                            <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl animate-in fade-in zoom-in-95">
                                {error}
                            </p>
                        )}

                        <button type="submit" disabled={loading || !phone} className="w-full h-[52px] bg-white text-[#050505] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#b1bbe8] transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <><Search size={16} /> Buscar Passe</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}