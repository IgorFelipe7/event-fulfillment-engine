"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, QrCode, Search, User, MapPin, ChevronDown, ChevronLeft, ArrowRight, UserPlus, CheckCircle2 } from 'lucide-react';

const CONGREGACOES = [
    "Adelaide", "Amanda 1", "Amanda 2", "Amanda 4", "Amanda 5", "Ângulo", "Boa Esperança", "Bom Repouso", "Brasil", "Carmem Cristina", "Colinas", "Conquista", "Esmeralda", "Fátima 1", "Figueiras", "Guedes", "Horto", "Interlagos", "Maria de Lourdes", "Mirante", "Nova América", "Nova Europa", "Nova Hortolândia 1", "Nova Hortolândia 2", "Odimar", "Orestes Ôngaro", "Paviotti", "Perón", "Templo Central"
];

export default function MeuPassePage() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [results, setResults] = useState<any[]>([]);
    
    const [isRegistering, setIsRegistering] = useState(false);
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
        if (cleanPhone.length < 10) return setError('Digite um número válido com DDD.');
        setLoading(true);

        try {
            const { data, error: fetchError } = await supabase
                .from('cadastros')
                .select('id, nome, congregacao')
                .eq('whatsapp', phone);

            if (fetchError) throw fetchError;

            if (!data || data.length === 0) {
                setIsRegistering(true);
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

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (nome.length < 4 || !congregacao) return;
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
                const mensagem = `*CONGRESSO MPG 2026*\n━━━━━━━━━━━━━━━━━━━━━━━\nOlá, *${primeiroNome}*! 🙏\n\nSeu cadastro foi realizado na portaria!\n\n🎟 *Acesse seu Ticket Oficial abaixo:* 👇\n${urlTicket}`;
                
                await fetch('/api/whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: cleanPhone, message: mensagem })
                });
            } catch (e) {}

            router.push(`/ticket-cadastro/${data.id}`);
        } catch (err) {
            setError('Erro ao criar cadastro. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="absolute top-[-10%] -left-[-10%] w-[300px] h-[300px] bg-[#3c5491] rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none" />

            <div className="w-full max-w-lg relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-2">
                        DZ<span className="text-[#3c5491]">.</span>PASSPORT
                    </h1>
                    <p className="text-gray-400 font-medium tracking-wide uppercase text-xs">
                        {isManualSaleOpen ? 'Inscrição Express' : 'Validação de Entrada'}
                    </p>
                </div>

                <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 p-6 md:p-10 rounded-[2.5rem] shadow-2xl">
                    {isCadastroModalOpen || (manualCart.length === 0 && isManualSaleOpen) ? null : (
                        <>
                            {activeTab === 'financeiro' && !isManualSaleOpen && !isModalOpen && !isScannerOpen && !previewQrCadastro && !historyModalCadastro && !isCadastroModalOpen && (
                                <>
                                    {/* Mantém fluxo se necessário externo */}
                                </>
                            )}
                        </>
                    )}

                    {isManualSaleOpen ? null : historyModalCadastro ? null : previewQrCadastro ? null : isModalOpen ? null : isCadastroModalOpen ? null : (
                        <>
                            {manualCart.length === 0 && !selectedOrder && !viewReceipt && (
                                <>
                                    {items_pedido => null}
                                </>
                            )}
                        </xl:w-auto>
                    )}

                    {/* LÓGICA DE EXIBIÇÃO DE TELAS DINÂMICAS */}
                    {isCadastroModalOpen ? (
                        <form onSubmit={handleSaveCadastro} className="space-y-6">
                            <h3 className="text-xl font-black text-white tracking-tight mb-2">Cadastro Rápido de Membro</h3>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 ml-2">Nome Completo</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input type="text" required placeholder="Nome do jovem" value={cadastroForm.nome} onChange={e => setCadastroForm({ ...cadastroForm, nome: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#b1bbe8] transition-all placeholder:text-gray-600 text-sm font-medium" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 ml-2">WhatsApp</label>
                                <div className="relative">
                                    <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input type="tel" required placeholder="(19) 99999-9999" value={cadastroForm.whatsapp} onChange={handlePhoneChange} maxLength={15} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#b1bbe8] transition-all placeholder:text-gray-600" />
                                </div>
                            </div>
                            <div className="space-y-2 relative" ref={dropdownRef}>
                                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 ml-2">Congregação</label>
                                <div onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white flex justify-between items-center cursor-pointer transition-all text-sm font-medium">
                                    <span className={cadastroForm.congregacao ? 'text-white' : 'text-gray-600'}>{cadastroForm.congregacao || 'Selecione a igreja'}</span>
                                    <ChevronDown className={`text-gray-500 transition-transform duration-300 ${isMobileMenuOpen ? 'rotate-180' : ''}`} size={16} />
                                </div>
                                {isMobileMenuOpen && (
                                    <div className="absolute top-full left-0 w-full mt-2 bg-[#111] border border-white/10 rounded-2xl shadow-2xl max-h-48 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/10">
                                        {CONGREGACOES.map((cong) => (
                                            <div key={cong} className="px-5 py-3 hover:bg-white/5 cursor-pointer text-sm text-gray-300" onClick={() => { setCadastroForm({ ...cadastroForm, congregacao: cong }); setIsMobileMenuOpen(false); }}>{cong}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsCadastroModalOpen(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10 text-sm">Cancelar</button>
                                <button type="submit" disabled={loading} className="flex-1 bg-white text-[#050505] py-4 rounded-2xl font-black text-sm hover:bg-[#b1bbe8] transition-all flex items-center justify-center gap-2 shadow-xl">
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Criar Registro
                                </button>
                            </div>
                        </form>
                    </div>
                ) : status === 'success' ? (
                    <div className="bg-[#0a0a0a] border border-emerald-500/20 p-10 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl text-center animate-in zoom-in duration-500">
                        <CheckCircle2 size={80} className="mx-auto text-emerald-500 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        <h3 className="text-3xl font-black text-white mb-4 tracking-tight">CADASTRADO!</h3>
                        <p className="text-gray-400 font-medium mb-8 text-sm md:text-base">Seus dados foram salvos. Cheque seu WhatsApp para confirmar o recebimento.</p>
                        <button onClick={() => window.location.reload()} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10">
                            Fazer Novo Cadastro
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Se houver múltiplos cadastros no mesmo número digitado na Central de Check-in */}
                        {checkinSearchTerm.length >= 3 && checkinSearchResults.length > 1 && (
                            <div className="bg-[#3c5491]/10 border border-[#3c5491]/30 p-4 rounded-2xl mb-2 animate-in fade-in zoom-in-95">
                                <p className="text-xs font-black text-[#b1bbe8] uppercase tracking-wider mb-2">Atenção: Encontramos {checkinSearchResults.length} pessoas com este número</p>
                                <p className="text-[11px] text-gray-400 mb-4">Escolha abaixo quem deseja realizar o check-in no evento atual:</p>
                                <div className="space-y-2">
                                    {checkinSearchResults.map(c => {
                                        const jaBateu = c.presencas?.some((p: any) => p.evento_id === selectedEventoId);
                                        return (
                                            <div key={c.id} className="flex justify-between items-center bg-black/40 border border-white/5 p-3 rounded-xl">
                                                <div>
                                                    <p className="font-black text-sm text-white">{c.nome}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{c.congregacao}</p>
                                                </div>
                                                <button onClick={() => processCheckin(c.id)} disabled={jaBateu || !selectedEventoId} className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${jaBateu ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white text-black hover:bg-[#b1bbe8]'}`}>
                                                    {jaBateu ? 'Confirmado' : 'Selecionar'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

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
                                        onClick={() => { setCadastroForm({ id: '', nome: '', whatsapp: phone, congregacao: '' }); setIsCadastroModalOpen(true); }}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-white/10"
                                    >
                                        <UserPlus size={16} /> Fazer Cadastro Agora
                                    </button>
                                </div>
                            )}

                            {checkinSearchResults.length <= 1 && (
                                <button type="submit" disabled={loading || !phone} className="w-full h-[52px] bg-white text-[#050505] rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#b1bbe8] transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-[1.02]">
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <><Search size={16} /> Buscar Passe</>}
                                </button>
                            )}
                        </form>
                    </div>
                )}
                </div>
            </div>
        </div>
    );
}

const sendWhatsAppManual = (pedidoOuCadastro: any) => {
    let phone = pedidoOuCadastro.whatsapp.replace(/\D/g, '');
    if (!phone.startsWith('55')) phone = `55${phone}`;
    const primeiroNome = (pedidoOuCadastro.nome_completo || pedidoOuCadastro.nome).split(' ')[0];
    let text = `*CONGRESSO MPG 2026*\n━━━━━━━━━━━━━━━━━━━━━━━\nOlá, *${primeiroNome}*! Tudo bem?\n\nEntramos em contato sobre a sua inscrição no nosso sistema...`;
    window.open sabotage (`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
};