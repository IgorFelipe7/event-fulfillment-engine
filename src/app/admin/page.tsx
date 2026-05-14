"use client";

import { useState, useEffect, useMemo } from 'react';
import { Package, Users, DollarSign, Activity, Edit2, Plus, RefreshCw, Lock, Mail, Key, LogOut, Trash2, CheckCircle, XCircle, Clock, Eye, ShoppingCart, Search, ArrowUpDown, Menu, MessageCircle, ScanLine, Truck, CheckCircle2, ChevronLeft, User, MapPin } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { supabase } from '@/lib/supabase';

const ESTOQUE_INICIAL = {
    Masc_PP: 0, Masc_P: 0, Masc_M: 0, Masc_G: 0, Masc_GG: 0, Masc_G1: 0, Masc_G2: 0, Masc_G3: 0, Masc_G4: 0, Masc_G5: 0,
    Fem_PP: 0, Fem_P: 0, Fem_M: 0, Fem_G: 0, Fem_GG: 0, Fem_G1: 0
};

const ENCOMENDA_INICIAL = {
    Masc_PP: false, Masc_P: false, Masc_M: false, Masc_G: false, Masc_GG: false, Masc_G1: false, Masc_G2: true, Masc_G3: true, Masc_G4: true, Masc_G5: true,
    Fem_PP: false, Fem_P: false, Fem_M: false, Fem_G: false, Fem_GG: false, Fem_G1: false
};

export default function AdminDashboard() {
    const [session, setSession] = useState<any>(null);
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [activeTab, setActiveTab] = useState('financeiro');
    const [camisetas, setCamisetas] = useState<any[]>([]);
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [estatisticas, setEstatisticas] = useState({ caixa: 0, vendidas: 0, pendentes: 0, paraEntregar: 0 });
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [viewReceipt, setViewReceipt] = useState<string | null>(null);
    const [isManualSaleOpen, setIsManualSaleOpen] = useState(false);
    const [manualSaleForm, setManualSaleForm] = useState({ produto_id: '', tamanho: '', quantidade: 1, nome: 'Venda Direta', preco_base: 50 });

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCongregacao, setFilterCongregacao] = useState('all');
    const [sortBy, setSortBy] = useState('data');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session) fetchData(); });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); if (session) fetchData(); });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const channel = supabase.channel('custom-all-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => { fetchData(); })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [selectedOrder]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthLoading(true);
        await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        setAuthLoading(false);
    };

    const handleLogout = async () => await supabase.auth.signOut();

    const fetchData = async () => {
        setLoading(true);
        const [resProdutos, resPedidos] = await Promise.all([
            supabase.from('produtos').select('*').order('nome'),
            supabase.from('pedidos').select('*, itens_pedido(*)').order('criado_em', { ascending: false })
        ]);

        if (resProdutos.data) setCamisetas(resProdutos.data);

        if (resPedidos.data) {
            setPedidos(resPedidos.data);
            const aprovados = resPedidos.data.filter(p => p.status === 'aprovado' || p.status === 'entregue');
            const caixa = aprovados.reduce((acc, curr) => acc + Number(curr.valor_total), 0);
            let totalPecas = 0;
            aprovados.forEach(p => { p.itens_pedido?.forEach((item: any) => totalPecas += item.quantidade); });
            const pendentes = resPedidos.data.filter(p => p.status === 'pendente').length;
            const paraEntregar = resPedidos.data.filter(p => p.status === 'aprovado').length;
            setEstatisticas({ caixa, vendidas: totalPecas, pendentes, paraEntregar });

            if (selectedOrder) {
                const atualizado = resPedidos.data.find(p => p.id === selectedOrder.id);
                if (atualizado) setSelectedOrder(atualizado);
            }
        }
        setLoading(false);
    };

    const congregacoesUnicas = useMemo(() => Array.from(new Set(pedidos.map(p => p.congregacao))).filter(Boolean), [pedidos]);

    const displayOrders = useMemo(() => {
        return pedidos.filter(p => {
            const isTabMatch = activeTab === 'financeiro' ? (p.status === 'pendente' || p.status === 'cancelado') : (p.status === 'aprovado' || p.status === 'entregue');
            const orderNum = p.id.split('-')[0].toUpperCase();
            const matchesSearch =
                p.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.whatsapp.includes(searchTerm) ||
                orderNum.includes(searchTerm.toUpperCase());

            const matchesCong = filterCongregacao === 'all' || p.congregacao === filterCongregacao;
            return isTabMatch && matchesSearch && matchesCong;
        }).sort((a, b) => {
            let valA: any = a.criado_em; let valB: any = b.criado_em;
            if (sortBy === 'data') { valA = new Date(a.criado_em).getTime(); valB = new Date(b.criado_em).getTime(); }
            if (sortBy === 'nome') { valA = a.nome_completo.toLowerCase(); valB = b.nome_completo.toLowerCase(); }
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [pedidos, searchTerm, filterCongregacao, sortBy, sortOrder, activeTab]);

    const getStockInfo = (produtoId: string) => {
        const prod = camisetas.find(c => c.id === produtoId);
        if (!prod) return { livre: 0, reservado: 0, fisico: 0 };
        
        let livre = 0; let reservado = 0;
        Object.values(prod.estoque).forEach((v: any) => livre += Number(v));

        pedidos.filter(p => p.status === 'pendente' || p.status === 'aprovado').forEach(p => {
            p.itens_pedido?.filter((i: any) => i.produto_id === produtoId).forEach((i: any) => reservado += i.quantidade);
        });

        return { livre, reservado, fisico: livre + reservado };
    };

    const openModal = (produto: any = null) => {
        if (produto) {
            setFormData({ ...produto });
            setIsEditing(true);
        } else {
            setFormData({ id: '', nome: '', cor_hex: '#000000', img_url: '', preco_base: 50, estoque: { ...ESTOQUE_INICIAL }, tamanhos_encomenda: { ...ENCOMENDA_INICIAL } });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (isEditing) {
            await supabase.from('produtos').update({
                nome: formData.nome, cor_hex: formData.cor_hex, img_url: formData.img_url, estoque: formData.estoque, tamanhos_encomenda: formData.tamanhos_encomenda, preco_base: formData.preco_base
            }).eq('id', formData.id);
        } else {
            await supabase.from('produtos').insert([formData]);
        }
        setIsModalOpen(false);
        fetchData();
    };

    const handleDeleteProduct = async (id: string) => {
        if (window.confirm("Excluir produto?")) { setLoading(true); await supabase.from('produtos').delete().eq('id', id); fetchData(); }
    };

    const updatePedidoStatus = async (pedido: any, novoStatus: string) => {
        setLoading(true);
        await supabase.from('pedidos').update({ status: novoStatus }).eq('id', pedido.id);

        if (novoStatus === 'cancelado' && pedido.status !== 'cancelado') {
            for (const item of pedido.itens_pedido) {
                const prod = camisetas.find(c => c.id === item.produto_id);
                if (prod) {
                    const novoEstoque = { ...prod.estoque };
                    novoEstoque[item.tamanho] = (novoEstoque[item.tamanho] || 0) + item.quantidade;
                    await supabase.from('produtos').update({ estoque: novoEstoque }).eq('id', prod.id);
                }
            }
        }

        try {
            const primeiroNome = pedido.nome_completo.split(' ')[0];
            const numeroPedido = pedido.id.split('-')[0].toUpperCase();
            const urlTicket = `${window.location.origin}/ticket/${pedido.id}`;

            const listaItens = pedido.itens_pedido.map((item: any) => {
                const prod = camisetas.find(c => c.id === item.produto_id);
                return `▪ ${item.quantidade}x ${prod?.nome || 'Item'} (*${item.tamanho.replace('_', ' ')}*)`;
            }).join('\n');

            let mensagem = '';

            if (novoStatus === 'aprovado') {
                if (pedido.tipo_pedido === 'lider') {
                    mensagem = `*CONGRESSO MPG 2026 | LIDERANÇA*\n━━━━━━━━━━━━━━━━━━━━━━━\nOlá, *${primeiroNome}*! Tudo bem?\n\nO seu status de líder e lote \`\`\`#${numeroPedido}\`\`\` foram *CONFIRMADOS* pela coordenação! 🔥🚀\n\n*Itens do Lote:*\n${listaItens}\n\n*Acesse seu Ticket de Retirada Oficial abaixo:* 👇\n${urlTicket}`;
                } else {
                    mensagem = `*CONGRESSO MPG 2026 | DISTÂNCIA ZERO*\n━━━━━━━━━━━━━━━━━━━━━━━\nOlá, *${primeiroNome}*! Tudo bem?\n\nO pagamento do seu pedido \`\`\`#${numeroPedido}\`\`\` foi *APROVADO* com sucesso! 🔥🚀\n\n*Itens garantidos:*\n${listaItens}\n\n*Acesse seu Ticket Oficial com QR Code abaixo:* 👇\n${urlTicket}`;
                }
            } else if (novoStatus === 'entregue') {
                mensagem = `*CONGRESSO MPG 2026 | DISTÂNCIA ZERO*\n━━━━━━━━━━━━━━━━━━━━━━━\nOlá, *${primeiroNome}*.\n\nConsta no sistema que o seu pedido \`\`\`#${numeroPedido}\`\`\` acabou de ser *ENTREGUE* com sucesso. ✅\n\nAproveite muito o congresso e vista a camisa! Se houve algum engano, responda esta mensagem.`;
            } else if (novoStatus === 'cancelado') {
                mensagem = `*CONGRESSO MPG 2026 | DISTÂNCIA ZERO*\n━━━━━━━━━━━━━━━━━━━━━━━\nOlá, *${primeiroNome}*.\n\n⚠️ *ATUALIZAÇÃO DO PEDIDO* \`\`\`#${numeroPedido}\`\`\`\n\nInformamos que o seu pedido foi *cancelado* e o estoque devolvido ao sistema.\n\n_Se isso foi um engano, responda a esta mensagem._`;
            }

            if (mensagem !== '') {
                await fetch('/api/whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: pedido.whatsapp, message: mensagem })
                });
            }
        } catch (e) { }

        fetchData();
    };

    const handleManualSale = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { data: order } = await supabase.from('pedidos').insert([{
            nome_completo: manualSaleForm.nome, whatsapp: 'Presencial', congregacao: 'Caixa', tipo_pedido: 'presencial', valor_total: manualSaleForm.preco_base * manualSaleForm.quantidade, status: 'entregue'
        }]).select().single();

        if (order) {
            await supabase.from('itens_pedido').insert([{ pedido_id: order.id, produto_id: manualSaleForm.produto_id, tamanho: manualSaleForm.tamanho, quantidade: manualSaleForm.quantidade, preco_unitario: manualSaleForm.preco_base }]);
            for (let i = 0; i < manualSaleForm.quantidade; i++) { await supabase.rpc('decrementar_estoque', { p_id: manualSaleForm.produto_id, p_tamanho: manualSaleForm.tamanho }); }
        }
        setIsManualSaleOpen(false);
        fetchData();
    };

    const sendWhatsAppManual = (pedido: any) => {
        let phone = pedido.whatsapp.replace(/\D/g, '');
        if (!phone.startsWith('55')) phone = `55${phone}`;
        const primeiroNome = pedido.nome_completo.split(' ')[0];
        const numeroPedido = pedido.id.split('-')[0].toUpperCase();

        const text = `*CONGRESSO MPG 2026 | SUPORTE*
━━━━━━━━━━━━━━━━━━━━━━━
Olá, *${primeiroNome}*! Tudo bem? 

Aqui é da organização do congresso, entramos em contato sobre o seu pedido \`\`\`#${numeroPedido}\`\`\`...`;

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleScan = (result: any) => {
        if (result && result.length > 0) {
            const scannedId = result[0].rawValue;
            const foundOrder = pedidos.find(p => p.id === scannedId);
            if (foundOrder) {
                setSelectedOrder(foundOrder);
                setIsScannerOpen(false);
            } else {
                alert("QR Code inválido ou pedido não encontrado no sistema!");
            }
        }
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#3c5491] opacity-20 blur-[150px] animate-pulse" />
                <div className="w-full max-w-md bg-[#0a0a0a]/80 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 shadow-2xl relative z-10">
                    <div className="w-16 h-16 bg-[#3c5491]/20 rounded-full flex items-center justify-center mb-8 mx-auto border border-[#3c5491]/50"><Lock size={28} className="text-[#b1bbe8]" /></div>
                    <h1 className="text-2xl font-black text-center text-white mb-2 tracking-tight">Acesso Restrito</h1>
                    <form onSubmit={handleLogin} className="space-y-5 mt-8">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 ml-2">E-mail</label>
                            <input type="email" required value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-[#3c5491] transition-all" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 ml-2">Senha</label>
                            <input type="password" required value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-[#3c5491] transition-all" />
                        </div>
                        <button type="submit" disabled={authLoading} className="w-full bg-white text-[#030303] py-4 rounded-2xl font-black text-lg hover:bg-[#b1bbe8] transition-all mt-4">
                            {authLoading ? 'Autenticando...' : 'Entrar'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col md:flex-row overflow-hidden">
            <div className="md:hidden bg-[#0a0a0a] border-b border-white/5 p-4 flex justify-between items-center z-30 relative">
                <h1 className="text-xl font-black tracking-tighter">DZ<span className="text-[#3c5491]">.</span> ADMIN</h1>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 bg-white/5 rounded-lg"><Menu size={24} /></button>
            </div>

            <aside className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-72 bg-[#0a0a0a] border-b md:border-r border-white/5 z-20 md:h-screen absolute md:relative top-[73px] md:top-0 left-0`}>
                <div className="hidden md:block p-8 border-b border-white/5">
                    <h1 className="text-2xl font-black tracking-tighter">DZ<span className="text-[#3c5491]">.</span> ADMIN</h1>
                    <p className="text-xs text-[#b1bbe8] uppercase tracking-widest mt-2 font-bold">Liderança</p>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <button onClick={() => { setActiveTab('financeiro'); setSelectedOrder(null); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-4 py-4 rounded-xl font-bold transition-all ${activeTab === 'financeiro' && !selectedOrder ? 'bg-[#3c5491] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <div className="flex items-center gap-3"><DollarSign size={18} /> Financeiro</div>
                        {estatisticas.pendentes > 0 && <span className="bg-orange-500 text-white text-[10px] px-2 py-1 rounded-full">{estatisticas.pendentes}</span>}
                    </button>
                    <button onClick={() => { setActiveTab('entregas'); setSelectedOrder(null); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-4 py-4 rounded-xl font-bold transition-all ${activeTab === 'entregas' && !selectedOrder ? 'bg-[#3c5491] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <div className="flex items-center gap-3"><Truck size={18} /> Entregas</div>
                        {estatisticas.paraEntregar > 0 && <span className="bg-emerald-500 text-white text-[10px] px-2 py-1 rounded-full">{estatisticas.paraEntregar}</span>}
                    </button>
                    <button onClick={() => { setActiveTab('estoque'); setSelectedOrder(null); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold transition-all ${activeTab === 'estoque' && !selectedOrder ? 'bg-[#3c5491] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <Package size={18} /> Catálogo & Estoque
                    </button>
                </nav>
                <div className="p-4 border-t border-white/5 space-y-2 pb-8 md:pb-4">
                    <button onClick={() => { setIsScannerOpen(true); setIsMobileMenuOpen(false) }} className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl font-black text-[#050505] bg-[#b1bbe8] hover:bg-white transition-all uppercase tracking-widest text-xs shadow-lg">
                        <ScanLine size={16} /> Ler QR Code
                    </button>
                    <button onClick={() => { setIsManualSaleOpen(true); setIsMobileMenuOpen(false) }} className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-500 transition-all uppercase tracking-widest text-xs">
                        <ShoppingCart size={16} /> Venda Rápida
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-all">
                        <LogOut size={18} /> Sair
                    </button>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto relative z-10 p-4 md:p-10 h-[calc(100vh-73px)] md:h-screen">
                {selectedOrder ? (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                        <button onClick={() => setSelectedOrder(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors font-bold text-sm uppercase tracking-widest">
                            <ChevronLeft size={18} /> Voltar para Dashboard
                        </button>

                        <div className="bg-[#0a0a0a] rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                            <div className="bg-[#050505] p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-3xl font-black">Detalhes do Pedido</h2>
                                        {selectedOrder.tipo_pedido === 'lider' && <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] px-3 py-1 rounded uppercase tracking-widest font-black">Líder</span>}
                                    </div>
                                    <p className="text-[#b1bbe8] font-black text-lg uppercase tracking-widest">#{selectedOrder.id.split('-')[0].toUpperCase()}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                                    {selectedOrder.status === 'pendente' && <span className="text-orange-400 font-bold text-xs bg-orange-400/10 px-4 py-2 rounded-full flex items-center gap-2 border border-orange-400/20"><Clock size={14} /> Aguardando Pagamento</span>}
                                    {selectedOrder.status === 'aprovado' && <span className="text-emerald-400 font-bold text-xs bg-emerald-400/10 px-4 py-2 rounded-full flex items-center gap-2 border border-emerald-400/20"><CheckCircle size={14} /> Pronto para Entrega</span>}
                                    {selectedOrder.status === 'entregue' && <span className="text-gray-400 font-bold text-xs bg-white/5 px-4 py-2 rounded-full flex items-center gap-2 border border-white/10"><CheckCircle2 size={14} /> Finalizado</span>}
                                    {selectedOrder.status === 'cancelado' && <span className="text-red-400 font-bold text-xs bg-red-400/10 px-4 py-2 rounded-full flex items-center gap-2 border border-red-400/20"><XCircle size={14} /> Cancelado</span>}
                                    <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{new Date(selectedOrder.criado_em).toLocaleString('pt-BR')}</p>
                                </div>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 flex items-center gap-2"><User size={14}/> Cliente</p>
                                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                            <p className="font-black text-xl mb-1">{selectedOrder.nome_completo}</p>
                                            <p className="text-gray-400 text-sm mb-4">{selectedOrder.whatsapp}</p>
                                            <div className="flex gap-2">
                                                <button onClick={() => sendWhatsAppManual(selectedOrder)} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all">
                                                    <MessageCircle size={14} /> Contatar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 flex items-center gap-2"><MapPin size={14}/> Localização</p>
                                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                            <p className="font-black text-lg text-[#b1bbe8]">{selectedOrder.congregacao}</p>
                                            <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">Congregação</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 flex items-center gap-2"><Package size={14}/> Itens Reservados</p>
                                        <div className="space-y-3">
                                            {selectedOrder.itens_pedido?.map((item: any, i: number) => {
                                                const prod = camisetas.find(c => c.id === item.produto_id);
                                                return (
                                                    <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                                                        <span className="font-black text-white text-lg">{item.quantidade}x <span className="font-medium text-gray-300 text-sm ml-2">{prod?.nome || 'Item'}</span></span>
                                                        <span className="text-xs font-black bg-[#3c5491] px-3 py-1.5 rounded text-white uppercase">{item.tamanho.replace('_', ' ')}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 flex items-center gap-2"><DollarSign size={14}/> Financeiro</p>
                                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex justify-between items-center">
                                            <div>
                                                <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Valor Total</p>
                                                <p className="font-black text-2xl text-emerald-400">R$ {selectedOrder.valor_total}</p>
                                            </div>
                                            {selectedOrder.comprovante_url && (
                                                <button onClick={() => setViewReceipt(selectedOrder.comprovante_url)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all">
                                                    <Eye size={14} /> Comprovante
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-white/5 bg-[#050505]">
                                {selectedOrder.status === 'pendente' && (
                                    <div className="flex gap-4">
                                        <button onClick={() => updatePedidoStatus(selectedOrder, 'aprovado')} className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm md:text-lg hover:bg-emerald-500 transition-all flex items-center justify-center gap-3">
                                            <CheckCircle size={20} /> APROVAR PAGAMENTO
                                        </button>
                                        <button onClick={() => updatePedidoStatus(selectedOrder, 'cancelado')} className="bg-red-500/10 text-red-500 border border-red-500/20 px-8 rounded-2xl font-black text-sm hover:bg-red-500 hover:text-white transition-all">
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                                {selectedOrder.status === 'aprovado' && (
                                    <button onClick={() => updatePedidoStatus(selectedOrder, 'entregue')} className="w-full bg-[#3c5491] text-white py-6 rounded-2xl font-black text-lg md:text-2xl hover:bg-[#b1bbe8] hover:text-[#050505] transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(60,84,145,0.4)]">
                                        <Truck size={28} /> MARCAR COMO ENTREGUE
                                    </button>
                                )}
                                {selectedOrder.status === 'entregue' && (
                                    <div className="w-full bg-white/5 text-gray-400 py-5 rounded-2xl font-black text-center uppercase tracking-widest flex justify-center items-center gap-3 border border-white/10">
                                        <CheckCircle2 size={24} /> Pedido Finalizado e Entregue
                                    </div>
                                )}
                                {selectedOrder.status === 'cancelado' && (
                                    <div className="w-full bg-red-500/10 text-red-400 py-5 rounded-2xl font-black text-center uppercase tracking-widest flex justify-center items-center gap-3 border border-red-500/20">
                                        <XCircle size={24} /> Pedido Cancelado
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-12">
                            <div><h2 className="text-3xl md:text-4xl font-black">Dashboard</h2><p className="text-xs md:text-sm text-gray-400 mt-1">Gestão centralizada MPG 2026.</p></div>
                            <button onClick={fetchData} className="w-full md:w-auto flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all">
                                <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Atualizar
                            </button>
                        </header>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                            <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-[#0a0a0a] to-[#050505] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign size={80} /></div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mb-2 md:mb-3">Caixa (Pagos)</p>
                                <p className="text-3xl md:text-5xl font-black text-emerald-400">R$ {estatisticas.caixa.toLocaleString('pt-BR')}</p>
                            </div>
                            <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-[#0a0a0a] to-[#050505] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Package size={80} /></div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mb-2 md:mb-3">Peças Vendidas</p>
                                <p className="text-3xl md:text-5xl font-black text-white">{estatisticas.vendidas}</p>
                            </div>
                            <div className="col-span-1 md:col-span-1 bg-gradient-to-br from-[#0a0a0a] to-[#050505] p-6 rounded-2xl border border-[#3c5491]/30 relative overflow-hidden group shadow-[inset_0_0_50px_rgba(60,84,145,0.1)]">
                                <div className="absolute -top-4 -right-4 p-8 opacity-10 text-[#3c5491] group-hover:opacity-20 transition-opacity"><Activity size={80} /></div>
                                <p className="text-[10px] text-[#b1bbe8] uppercase tracking-[0.2em] font-bold mb-2 md:mb-3">Aguardando PIX</p>
                                <p className="text-3xl md:text-5xl font-black text-white">{estatisticas.pendentes}</p>
                            </div>
                            <div className="col-span-1 md:col-span-1 bg-gradient-to-br from-emerald-900/20 to-[#050505] p-6 rounded-2xl border border-emerald-500/30 relative overflow-hidden group">
                                <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mb-2">P/ Entregar</p>
                                <p className="text-3xl md:text-5xl font-black text-white">{estatisticas.paraEntregar}</p>
                            </div>
                        </div>

                        {activeTab === 'estoque' && (
                            <div className="bg-[#0a0a0a] rounded-2xl md:rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl animate-in fade-in">
                                <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#050505]">
                                    <h3 className="text-xl md:text-2xl font-black">Inventário Físico e Site</h3>
                                    <button onClick={() => openModal()} className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-[#050505] px-6 py-3 rounded-xl font-black text-sm hover:bg-[#ddcbcb] transition-all hover:scale-105 shadow-xl">
                                        <Plus size={18} /> Adicionar Modelo
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead>
                                            <tr className="bg-white/5">
                                                <th className="p-4 md:p-6 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black border-b border-white/5">Produto</th>
                                                <th className="p-4 md:p-6 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black border-b border-white/5 text-center">Valor Base</th>
                                                <th className="p-4 md:p-6 text-[10px] uppercase tracking-[0.2em] text-[#3c5491] font-black border-b border-white/5 text-center">Livre (Site)</th>
                                                <th className="p-4 md:p-6 text-[10px] uppercase tracking-[0.2em] text-orange-400 font-black border-b border-white/5 text-center">Reservado</th>
                                                <th className="p-4 md:p-6 text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-black border-b border-white/5 text-center">Estoque Físico</th>
                                                <th className="p-4 md:p-6 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black border-b border-white/5 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {camisetas.map((item) => {
                                                const stockInfo = getStockInfo(item.id);
                                                return (
                                                    <tr key={item.id} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                                        <td className="p-4 md:p-6 font-black flex items-center gap-3 md:gap-4 text-xs md:text-sm">
                                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shrink-0">
                                                                <div className="w-full h-full opacity-50 mix-blend-screen" style={{ backgroundColor: item.cor_hex }} />
                                                            </div>
                                                            <span className="truncate">{item.nome}</span>
                                                        </td>
                                                        <td className="p-4 md:p-6 text-center font-bold text-gray-400">R$ {item.preco_base || 50}</td>
                                                        <td className="p-4 md:p-6 text-center font-black text-xl text-[#b1bbe8]">{stockInfo.livre}</td>
                                                        <td className="p-4 md:p-6 text-center font-black text-xl text-orange-400">{stockInfo.reservado}</td>
                                                        <td className="p-4 md:p-6 text-center font-black text-2xl text-emerald-400">{stockInfo.fisico}</td>
                                                        <td className="p-4 md:p-6">
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => openModal(item)} className="p-2 md:p-3 bg-white/5 hover:bg-[#3c5491] text-white rounded-lg md:rounded-xl transition-colors"><Edit2 size={14} /></button>
                                                                <button onClick={() => handleDeleteProduct(item.id)} className="p-2 md:p-3 bg-white/5 hover:bg-red-500 text-white rounded-lg md:rounded-xl transition-colors"><Trash2 size={14} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {(activeTab === 'financeiro' || activeTab === 'entregas') && (
                            <div className="bg-[#0a0a0a] rounded-2xl md:rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl animate-in fade-in">
                                <div className="p-4 md:p-6 border-b border-white/5 bg-[#050505]">
                                    <h3 className="text-xl md:text-2xl font-black mb-4 md:mb-6">{activeTab === 'financeiro' ? 'Aprovação de Pagamentos' : 'Fila de Entregas'}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 md:gap-3">
                                        <div className="sm:col-span-2 relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                            <input type="text" placeholder="Buscar por Nome, WhatsApp ou #Pedido" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs md:text-sm text-white focus:outline-none focus:border-[#3c5491] transition-all" />
                                        </div>
                                        <select value={filterCongregacao} onChange={e => setFilterCongregacao(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-white focus:outline-none focus:border-[#3c5491] appearance-none sm:col-span-2 lg:col-span-2">
                                            <option value="all" className="text-black">Congregações</option>
                                            {congregacoesUnicas.map(c => <option key={c as string} value={c as string} className="text-black">{c as string}</option>)}
                                        </select>
                                        <div className="flex gap-2 sm:col-span-2 lg:col-span-2">
                                            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs md:text-sm text-white focus:outline-none focus:border-[#3c5491] appearance-none">
                                                <option value="data" className="text-black">Por Data</option>
                                                <option value="nome" className="text-black">Por Nome</option>
                                            </select>
                                            <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors shrink-0">
                                                <ArrowUpDown size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead>
                                            <tr className="bg-white/5">
                                                <th className="p-4 md:p-6 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black border-b border-white/5">Identificação</th>
                                                <th className="p-4 md:p-6 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black border-b border-white/5">Itens Reservados</th>
                                                <th className="p-4 md:p-6 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black border-b border-white/5">Detalhes</th>
                                                <th className="p-4 md:p-6 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black border-b border-white/5">Status</th>
                                                <th className="p-4 md:p-6 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black border-b border-white/5 text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayOrders.map((pedido) => {
                                                const orderIdVisual = pedido.id.split('-')[0].toUpperCase();
                                                return (
                                                    <tr key={pedido.id} onClick={() => setSelectedOrder(pedido)} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 cursor-pointer">
                                                        <td className="p-4 md:p-6">
                                                            <div className="flex items-center gap-2 mb-1.5">
                                                                <span className="bg-[#3c5491]/20 text-[#b1bbe8] text-[9px] px-2 py-0.5 rounded font-black tracking-widest border border-[#3c5491]/30">#{orderIdVisual}</span>
                                                                {pedido.tipo_pedido === 'lider' && <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] px-2 py-0.5 rounded uppercase tracking-widest font-bold">Líder</span>}
                                                            </div>
                                                            <p className="font-black text-white text-sm md:text-lg flex flex-wrap items-center gap-2">
                                                                {pedido.nome_completo}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <button onClick={(e) => { e.stopPropagation(); sendWhatsAppManual(pedido); }} className="text-emerald-400 hover:text-emerald-300 transition-colors p-1 bg-emerald-500/10 rounded-md" title="Mandar WhatsApp Manual">
                                                                    <MessageCircle size={14} />
                                                                </button>
                                                                <p className="text-[10px] md:text-xs text-gray-400">{pedido.whatsapp} • {pedido.congregacao}</p>
                                                            </div>
                                                            <p className="text-[9px] text-gray-600 mt-1 uppercase tracking-tighter font-bold">{new Date(pedido.criado_em).toLocaleString('pt-BR')}</p>
                                                        </td>
                                                        <td className="p-4 md:p-6">
                                                            <div className="space-y-1 md:space-y-2">
                                                                {pedido.itens_pedido?.map((item: any, i: number) => {
                                                                    const prod = camisetas.find(c => c.id === item.produto_id);
                                                                    return (
                                                                        <div key={i} className="flex items-center gap-1 md:gap-2">
                                                                            <span className="font-black text-white bg-white/10 px-1.5 md:px-2 py-0.5 md:py-1 rounded text-[10px] md:text-xs">{item.quantidade}x</span>
                                                                            <span className="text-xs md:text-sm font-medium truncate max-w-[100px] md:max-w-none">{prod?.nome || 'Deletado'}</span>
                                                                            <span className="text-[8px] md:text-[10px] text-[#b1bbe8] font-bold ml-1 uppercase">({item.tamanho.replace('_', ' ')})</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 md:p-6">
                                                            <p className="font-black text-emerald-400 text-base leading-none mb-1 md:mb-2">R$ {pedido.valor_total}</p>
                                                            {pedido.comprovante_url && (
                                                                <button onClick={(e) => { e.stopPropagation(); setViewReceipt(pedido.comprovante_url); }} className="text-[8px] md:text-[10px] font-black text-white uppercase flex items-center gap-1 hover:text-[#b1bbe8] transition-colors bg-white/10 px-2 py-1 rounded">
                                                                    <Eye size={12} /> Comprovante
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="p-4 md:p-6">
                                                            {pedido.status === 'pendente' && <span className="flex items-center gap-1 md:gap-2 text-orange-400 font-bold text-[10px] md:text-xs bg-orange-400/10 px-2 md:px-3 py-1 md:py-2 rounded-full w-max"><Clock size={12} /> Avaliando</span>}
                                                            {pedido.status === 'aprovado' && <span className="flex items-center gap-1 md:gap-2 text-emerald-400 font-bold text-[10px] md:text-xs bg-emerald-400/10 px-2 md:px-3 py-1 md:py-2 rounded-full w-max"><CheckCircle size={12} /> P/ Entregar</span>}
                                                            {pedido.status === 'entregue' && <span className="flex items-center gap-1 md:gap-2 text-gray-400 font-bold text-[10px] md:text-xs bg-white/5 border border-white/10 px-2 md:px-3 py-1 md:py-2 rounded-full w-max">Entregue</span>}
                                                            {pedido.status === 'cancelado' && <span className="flex items-center gap-1 md:gap-2 text-red-400 font-bold text-[10px] md:text-xs bg-red-400/10 px-2 md:px-3 py-1 md:py-2 rounded-full w-max"><XCircle size={12} /> Cancelado</span>}
                                                        </td>
                                                        <td className="p-4 md:p-6 text-right">
                                                            <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(pedido); }} className="p-2 md:p-3 bg-[#b1bbe8] text-[#050505] hover:bg-white rounded-lg md:rounded-xl transition-all font-black text-[10px] md:text-xs uppercase tracking-widest px-4">
                                                                Acessar Tela
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            {displayOrders.length === 0 && (
                                                <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-bold">Nenhum pedido encontrado.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {isScannerOpen && (
                <div className="fixed inset-0 bg-black z-[70] flex flex-col items-center justify-center">
                    <div className="w-full max-w-md p-6 relative flex flex-col items-center h-full justify-center">
                        <button onClick={() => setIsScannerOpen(false)} className="absolute top-10 right-6 text-white bg-white/10 p-3 rounded-full z-10 hover:bg-red-500 transition-colors"><XCircle size={28} /></button>
                        <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">LEITOR OFICIAL</h2>
                        <p className="text-gray-400 text-sm mb-10">Aponte a câmera para o Ticket do jovem.</p>

                        <div className="w-full aspect-square rounded-[3rem] overflow-hidden border-4 border-[#3c5491] shadow-[0_0_100px_rgba(60,84,145,0.4)] relative bg-zinc-900">
                            <Scanner onScan={handleScan} components={{ finder: true }} />
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 animate-in fade-in overflow-y-auto">
                    <div className="bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-2xl md:rounded-[3rem] w-full max-w-4xl shadow-2xl relative my-auto">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><XCircle size={24} /></button>
                        <h3 className="text-xl md:text-3xl font-black mb-6 md:mb-8">{isEditing ? 'Editar Modelo' : 'Novo Modelo'}</h3>
                        <form onSubmit={handleSaveProduct}>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8 border-b border-white/10 pb-8">
                                {!isEditing && (
                                    <div className="space-y-2 col-span-1 md:col-span-2">
                                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">ID Único</label>
                                        <input type="text" required value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value.toLowerCase() })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#3c5491] outline-none text-sm" />
                                    </div>
                                )}
                                <div className={`space-y-2 ${isEditing ? 'md:col-span-2' : 'md:col-span-2'}`}>
                                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">Nome da Peça</label>
                                    <input type="text" required value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#3c5491] outline-none text-sm" />
                                </div>
                                <div className="space-y-2 col-span-1 md:col-span-1">
                                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">Preço Base (R$)</label>
                                    <input type="number" required value={formData.preco_base || 50} onChange={e => setFormData({ ...formData, preco_base: parseInt(e.target.value) })} className="w-full bg-white/5 border border-emerald-500/50 rounded-xl px-4 py-3 text-emerald-400 font-black focus:border-emerald-400 outline-none text-sm" />
                                </div>
                                <div className="space-y-2 col-span-1 md:col-span-1">
                                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">Cor Hex</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={formData.cor_hex} onChange={e => setFormData({ ...formData, cor_hex: e.target.value })} className="h-[46px] w-[46px] rounded-xl bg-white/5 border border-white/10 cursor-pointer shrink-0" />
                                        <input type="text" value={formData.cor_hex} onChange={e => setFormData({ ...formData, cor_hex: e.target.value })} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white focus:border-[#3c5491] outline-none text-sm" />
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-1 md:col-span-4">
                                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">URL Imagem</label>
                                    <input type="text" value={formData.img_url} onChange={e => setFormData({ ...formData, img_url: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#3c5491] outline-none text-sm" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h4 className="font-black text-sm text-[#b1bbe8] mb-4 uppercase tracking-widest">Estoque Físico Masculino</h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                        {['Masc_PP', 'Masc_P', 'Masc_M', 'Masc_G', 'Masc_GG', 'Masc_G1', 'Masc_G2', 'Masc_G3', 'Masc_G4', 'Masc_G5'].map(tam => (
                                            <div key={tam} className="bg-white/5 p-2 rounded-xl border border-white/10 flex flex-col items-center">
                                                <label className="text-[10px] font-black text-gray-300 mb-1">{tam.split('_')[1]}</label>
                                                <input type="number" min="0" required value={formData.estoque[tam]} onChange={e => setFormData({ ...formData, estoque: { ...formData.estoque, [tam]: parseInt(e.target.value) } })} className="w-full bg-black/20 border border-[#3c5491]/30 rounded-lg px-1 py-1.5 text-center text-white font-bold focus:border-[#3c5491] outline-none text-xs" />
                                                <div className="flex items-center gap-1.5 mt-2">
                                                    <div onClick={() => setFormData({ ...formData, tamanhos_encomenda: { ...formData.tamanhos_encomenda, [tam]: !formData.tamanhos_encomenda[tam] } })} className={`w-7 h-4 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${formData.tamanhos_encomenda[tam] ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                                                        <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform ${formData.tamanhos_encomenda[tam] ? 'translate-x-3' : 'translate-x-0'}`} />
                                                    </div>
                                                    <span className={`text-[8px] font-bold uppercase ${formData.tamanhos_encomenda[tam] ? 'text-emerald-400' : 'text-gray-500'}`}>Enc.</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-black text-sm text-pink-300 mb-4 uppercase tracking-widest">Estoque Físico Feminino</h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                                        {['Fem_PP', 'Fem_P', 'Fem_M', 'Fem_G', 'Fem_GG', 'Fem_G1'].map(tam => (
                                            <div key={tam} className="bg-white/5 p-2 rounded-xl border border-white/10 flex flex-col items-center">
                                                <label className="text-[10px] font-black text-gray-300 mb-1">{tam.split('_')[1]}</label>
                                                <input type="number" min="0" required value={formData.estoque[tam]} onChange={e => setFormData({ ...formData, estoque: { ...formData.estoque, [tam]: parseInt(e.target.value) } })} className="w-full bg-black/20 border border-pink-500/30 rounded-lg px-1 py-1.5 text-center text-white font-bold focus:border-pink-500 outline-none text-xs" />
                                                <div className="flex items-center gap-1.5 mt-2">
                                                    <div onClick={() => setFormData({ ...formData, tamanhos_encomenda: { ...formData.tamanhos_encomenda, [tam]: !formData.tamanhos_encomenda[tam] } })} className={`w-7 h-4 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${formData.tamanhos_encomenda[tam] ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                                                        <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform ${formData.tamanhos_encomenda[tam] ? 'translate-x-3' : 'translate-x-0'}`} />
                                                    </div>
                                                    <span className={`text-[8px] font-bold uppercase ${formData.tamanhos_encomenda[tam] ? 'text-emerald-400' : 'text-gray-500'}`}>Enc.</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-white text-[#050505] py-4 rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:bg-[#b1bbe8] transition-all flex items-center justify-center gap-2">
                                <CheckCircle size={20} /> Salvar Peça e Estoque
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {isManualSaleOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 animate-in fade-in">
                    <div className="bg-[#0a0a0a] border border-emerald-500/30 p-6 md:p-8 rounded-2xl md:rounded-[3rem] w-full max-w-xl shadow-2xl relative">
                        <button onClick={() => setIsManualSaleOpen(false)} className="absolute top-6 md:top-8 right-6 md:right-8 text-gray-500 hover:text-white"><XCircle size={24} /></button>
                        <h3 className="text-2xl md:text-3xl font-black mb-2 text-emerald-400">Venda Rápida</h3>
                        <p className="text-gray-400 text-xs md:text-sm mb-6 md:mb-8 font-medium">Lançamento direto no caixa. Estoque será subtraído.</p>

                        <form onSubmit={handleManualSale} className="space-y-4 md:space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">Nome / Observação</label>
                                <input type="text" required value={manualSaleForm.nome} onChange={e => setManualSaleForm({ ...manualSaleForm, nome: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 md:py-4 text-white outline-none focus:border-emerald-500 text-sm" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">Produto</label>
                                    <select required value={manualSaleForm.produto_id} onChange={e => {
                                        const prod = camisetas.find(c => c.id === e.target.value);
                                        setManualSaleForm({ ...manualSaleForm, produto_id: e.target.value, preco_base: prod?.preco_base || 50 });
                                    }} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 md:py-4 text-white outline-none focus:border-emerald-500 appearance-none text-sm">
                                        <option value="" className="text-black">Selecione...</option>
                                        {camisetas.map(c => <option key={c.id} value={c.id} className="text-black">{c.nome}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">Tamanho (BD)</label>
                                    <select required value={manualSaleForm.tamanho} onChange={e => setManualSaleForm({ ...manualSaleForm, tamanho: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 md:py-4 text-white outline-none focus:border-emerald-500 appearance-none text-sm">
                                        <option value="" className="text-black">Selecione...</option>
                                        {Object.keys(ESTOQUE_INICIAL).map(s => <option key={s} value={s} className="text-black">{s.replace('_', ' ')}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 md:pt-6 mt-2">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">Quantidade</label>
                                    <input type="number" min="1" required value={manualSaleForm.quantidade} onChange={e => setManualSaleForm({ ...manualSaleForm, quantidade: parseInt(e.target.value) })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 md:py-4 text-white outline-none focus:border-emerald-500 text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">Valor Un. (R$)</label>
                                    <input type="number" value={manualSaleForm.preco_base} onChange={e => setManualSaleForm({ ...manualSaleForm, preco_base: parseInt(e.target.value) })} className="w-full bg-white/5 border border-emerald-500/50 rounded-xl px-4 py-3 md:py-4 text-emerald-400 font-black outline-none focus:border-emerald-400 text-sm" />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 mt-2 md:mt-4 shadow-xl">
                                <CheckCircle size={20} /> Lançar Venda
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {viewReceipt && (
                <div className="fixed inset-0 bg-black/95 z-[80] flex items-center justify-center p-4 md:p-6" onClick={() => setViewReceipt(null)}>
                    <div className="max-w-4xl w-full h-[80vh] md:h-[90vh] relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewReceipt(null)} className="absolute -top-10 md:-top-12 right-0 text-white flex items-center gap-2 font-bold bg-white/10 px-4 py-2 rounded-lg hover:bg-red-500 transition-colors"><XCircle size={20} /> Fechar</button>
                        {viewReceipt.toLowerCase().endsWith('.pdf') ? (
                            <iframe src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/receipts/${viewReceipt}`} className="w-full h-full rounded-2xl md:rounded-[2rem] bg-white border border-white/10" />
                        ) : (
                            <img src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/receipts/${viewReceipt}`} className="w-full h-full object-contain rounded-2xl md:rounded-[2rem]" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}