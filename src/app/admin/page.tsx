"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Package, Users, DollarSign, Activity, Edit2, Plus, RefreshCw, Lock, LogOut, Trash2, CheckCircle, XCircle, Clock, Eye, EyeOff, ShoppingCart, Search, ArrowUpDown, Menu, MessageCircle, ScanLine, Truck, CheckCircle2, ChevronLeft, ChevronDown, User, MapPin, Loader2, Save, Minus, QrCode, Link, Send, Calendar, CalendarPlus, Camera, Keyboard, BarChart2, ExternalLink, MonitorUp, Trophy, LineChart, Copy } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-qr-code';

const ESTOQUE_INICIAL = {
    Masc_PP: 0, Masc_P: 0, Masc_M: 0, Masc_G: 0, Masc_GG: 0, Masc_G1: 0, Masc_G2: 0, Masc_G3: 0, Masc_G4: 0, Masc_G5: 0,
    Fem_PP: 0, Fem_P: 0, Fem_M: 0, Fem_G: 0, Fem_GG: 0, Fem_G1: 0
};

const ENCOMENDA_INICIAL = {
    Masc_PP: false, Masc_P: false, Masc_M: false, Masc_G: false, Masc_GG: false, Masc_G1: false, Masc_G2: true, Masc_G3: true, Masc_G4: true, Masc_G5: true,
    Fem_PP: false, Fem_P: false, Fem_M: false, Fem_G: false, Fem_GG: false, Fem_G1: false
};

const MASC_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'G1', 'G2', 'G3', 'G4', 'G5'];
const FEM_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'G1'];

const CONGREGACOES = [
    "Adelaide", "Amanda 1", "Amanda 2", "Amanda 4", "Amanda 5", "Ângulo", "Boa Esperança", "Bom Repouso", "Brasil", "Carmem Cristina", "Colinas", "Conquista", "Esmeralda", "Fátima 1", "Figueiras", "Guedes", "Horto", "Interlagos", "Maria de Lourdes", "Mirante", "Nova América", "Nova Europa", "Nova Hortolândia 1", "Nova Hortolândia 2", "Odimar", "Orestes Ôngaro", "Paviotti", "Perón", "Poloni", "Pq. Hortolândia", "Remanso Campineiro", "Rita de Cassia", "Rosolém", "Santana", "São Bento", "São Jorge", "São Sebastião 1", "São Sebastião 2", "Santa Clara", "Templo Central", "Terras de Santa Maria",
];

export default function AdminDashboard() {
    const [session, setSession] = useState<any>(null);
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showStats, setShowStats] = useState(false);

    const [activeTab, setActiveTab] = useState('financeiro');
    const [camisetas, setCamisetas] = useState<any[]>([]);
    const [pedidos, setPedidos] = useState<any[]>([]);
    const [cadastros, setCadastros] = useState<any[]>([]);
    const [eventos, setEventos] = useState<any[]>([]);
    const [selectedEventoId, setSelectedEventoId] = useState<string>('');
    const [novoEventoNome, setNovoEventoNome] = useState('');

    const [estatisticas, setEstatisticas] = useState({ caixa: 0, vendidas: 0, pendentes: 0, paraEntregar: 0 });
    const [loading, setLoading] = useState(true);
    const [whatsappLoadingId, setWhatsappLoadingId] = useState<string | null>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [isCadastroModalOpen, setIsCadastroModalOpen] = useState(false);
    const [cadastroForm, setCadastroForm] = useState({ id: '', nome: '', whatsapp: '', congregacao: '' });

    const [viewReceipt, setViewReceipt] = useState<string | null>(null);
    const [previewQrCadastro, setPreviewQrCadastro] = useState<any>(null);
    const [historyModalCadastro, setHistoryModalCadastro] = useState<any>(null);
    const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
    const [isTelaoShareOpen, setIsTelaoShareOpen] = useState(false);

    const [isManualSaleOpen, setIsManualSaleOpen] = useState(false);
    const [manualCustomer, setManualCustomer] = useState({ nome: '', congregacao: '' });
    const [manualCart, setManualCart] = useState<any[]>([]);
    const [manualItem, setManualItem] = useState({ produto_id: '', tamanho: '', quantidade: 1 });
    const [manualGender, setManualGender] = useState<'Masc' | 'Fem'>('Masc');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCongregacao, setFilterCongregacao] = useState('all');
    const [sortBy, setSortBy] = useState('data');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [freqSearchTerm, setFreqSearchTerm] = useState('');
    const [congSearchTerm, setCongSearchTerm] = useState('');

    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [checkinMethod, setCheckinMethod] = useState<'scanner' | 'busca'>('scanner');
    const [checkinSearchTerm, setCheckinSearchTerm] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [scanFeedback, setScanFeedback] = useState<{ message: string, type: 'success' | 'error' | null }>({ message: '', type: null });

    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        setBaseUrl(window.location.origin);
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); if (session) fetchData(); });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); if (session) fetchData(); });
        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const channel = supabase.channel('custom-all-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => { fetchData(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cadastros' }, () => { fetchData(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'presencas' }, () => { fetchData(); })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos' }, () => { fetchData(); })
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
        try {
            const [resProdutos, resPedidos, resCadastros, resEventos] = await Promise.all([
                supabase.from('produtos').select('*').order('nome'),
                supabase.from('pedidos').select('*, itens_pedido(*)').order('criado_em', { ascending: false }),
                supabase.from('cadastros').select('*, presencas(*)').order('criado_em', { ascending: false }),
                supabase.from('eventos').select('*').order('data_evento', { ascending: false })
            ]);

            if (resProdutos.data) setCamisetas(resProdutos.data);
            if (resCadastros.data) setCadastros(resCadastros.data);
            if (resEventos.data) {
                setEventos(resEventos.data);
                if (resEventos.data.length > 0 && !selectedEventoId) {
                    setSelectedEventoId(resEventos.data[0].id);
                }
            }

            if (resPedidos.data) {
                setPedidos(resPedidos.data);
                const aprovados = resPedidos.data.filter(p => p.status === 'aprovado' || p.status === 'entregue');
                
                const caixa = aprovados.reduce((acc, curr) => {
                    if (curr.tipo_pedido === 'lider' && curr.status === 'aprovado') return acc;
                    return acc + Number(curr.valor_total);
                }, 0);

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
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const congregacoesUnicas = useMemo(() => Array.from(new Set(pedidos.map(p => p.congregacao))).filter(Boolean), [pedidos]);

    const displayOrders = useMemo(() => {
        return pedidos.filter(p => {
            const isTabMatch = activeTab === 'financeiro' ? (p.status === 'pendente' || p.status === 'cancelado') : (p.status === 'aprovado' || p.status === 'entregue');
            const orderNum = p.id.split('-')[0].toUpperCase();
            const matchesSearch = p.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) || p.whatsapp.includes(searchTerm) || orderNum.includes(searchTerm.toUpperCase());
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

    const displayCadastros = useMemo(() => {
        return cadastros.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || c.whatsapp.includes(searchTerm));
    }, [cadastros, searchTerm]);

    const checkinSearchResults = useMemo(() => {
        if (checkinSearchTerm.length < 3) return [];
        return cadastros.filter(c => c.nome.toLowerCase().includes(checkinSearchTerm.toLowerCase()) || c.whatsapp.includes(checkinSearchTerm));
    }, [cadastros, checkinSearchTerm]);

    const totalPresencasGerais = useMemo(() => {
        return cadastros.reduce((acc, curr) => {
            const bonus = new Date(curr.criado_em).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) === '21/06/2026' ? 1 : 0;
            return acc + (curr.presencas?.length || 0) + bonus;
        }, 0);
    }, [cadastros]);

    const rankingFrequenciaIndividual = useMemo(() => {
        return cadastros.map(cad => {
            const bonus = new Date(cad.criado_em).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) === '21/06/2026' ? 1 : 0;
            const total = (cad.presencas?.length || 0) + bonus;
            const sortedPresencas = cad.presencas ? [...cad.presencas].sort((a: any, b: any) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()) : [];
            const ultimaPresenca = sortedPresencas.length > 0 ? new Date(sortedPresencas[0].criado_em).toLocaleDateString('pt-BR') : (bonus ? '21/06/2026 (Bônus)' : 'Nunca');
            return { ...cad, totalPresencas: total, ultimaPresenca };
        })
            .filter(c => c.nome.toLowerCase().includes(freqSearchTerm.toLowerCase()) || c.congregacao.toLowerCase().includes(freqSearchTerm.toLowerCase()))
            .sort((a, b) => b.totalPresencas - a.totalPresencas || a.nome.localeCompare(b.nome));
    }, [cadastros, freqSearchTerm]);

    const congregacaoRankingGlobal = useMemo(() => {
        return CONGREGACOES.map(cong => {
            const cads = cadastros.filter(c => c.congregacao === cong);
            let totalPresencasCong = 0;
            cads.forEach(cad => {
                const bonus = new Date(cad.criado_em).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) === '21/06/2026' ? 1 : 0;
                totalPresencasCong += (cad.presencas?.length || 0) + bonus;
            });
            return { cong, total: cads.length, presencas: totalPresencasCong };
        })
            .filter(s => s.total > 0)
            .filter(s => s.cong.toLowerCase().includes(congSearchTerm.toLowerCase()))
            .sort((a, b) => b.presencas - a.presencas || b.total - a.total);
    }, [cadastros, congSearchTerm]);

    const totalPresencasEventoAtual = useMemo(() => {
        return cadastros.filter(c => c.presencas?.some((p: any) => p.evento_id === selectedEventoId)).length;
    }, [cadastros, selectedEventoId]);

    const congregacaoStats = useMemo(() => {
        return CONGREGACOES.map(cong => {
            const cads = cadastros.filter(c => c.congregacao === cong);
            const presencas = cads.filter(c => c.presencas?.some((p: any) => p.evento_id === selectedEventoId)).length;
            return { cong, total: cads.length, presencas };
        }).filter(s => s.total > 0).sort((a, b) => b.presencas - a.presencas || b.total - a.total);
    }, [cadastros, selectedEventoId]);

    const currentEventoObject = useMemo(() => {
        return eventos.find(e => e.id === selectedEventoId);
    }, [eventos, selectedEventoId]);

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

    const handleCreateEvento = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!novoEventoNome) return;
        setLoading(true);
        await supabase.from('eventos').insert([{ nome: novoEventoNome }]);
        setNovoEventoNome('');
        fetchData();
    };

    const handleCheckInManual = async (cadastroId: string) => {
        if (!selectedEventoId) return alert("Selecione ou crie um evento antes!");
        await processCheckin(cadastroId);
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEditing) {
                await supabase.from('produtos').update({
                    nome: formData.nome, cor_hex: formData.cor_hex, img_url: formData.img_url, estoque: formData.estoque, tamanhos_encomenda: formData.tamanhos_encomenda, preco_base: formData.preco_base
                }).eq('id', formData.id);
            } else {
                await supabase.from('produtos').insert([formData]);
            }
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
        } finally {
            fetchData();
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (window.confirm("Excluir produto?")) { setLoading(true); await supabase.from('produtos').delete().eq('id', id); fetchData(); }
    };

    const openModal = (produto: any = null) => {
        if (produto) {
            setFormData({
                ...produto,
                estoque: { ...ESTOQUE_INICIAL, ...(produto.estoque || {}) },
                tamanhos_encomenda: { ...ENCOMENDA_INICIAL, ...(produto.tamanhos_encomenda || {}) }
            });
            setIsEditing(true);
        } else {
            setFormData({ id: '', nome: '', cor_hex: '#000000', img_url: '', preco_base: 50, estoque: { ...ESTOQUE_INICIAL }, tamanhos_encomenda: { ...ENCOMENDA_INICIAL } });
            setIsEditing(false);
        }
        setIsModalOpen(true);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        let formatted = v;
        if (v.length > 2) formatted = `(${v.slice(0, 2)}) ${v.slice(2)}`;
        if (v.length > 7) formatted = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
        setCadastroForm({ ...cadastroForm, whatsapp: formatted });
    };

    const handleSaveCadastroLocal = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (cadastroForm.id) {
                await supabase.from('cadastros').update({
                    nome: cadastroForm.nome, whatsapp: cadastroForm.whatsapp, congregacao: cadastroForm.congregacao
                }).eq('id', cadastroForm.id);
            } else {
                await supabase.from('cadastros').insert([{
                    nome: cadastroForm.nome, whatsapp: cadastroForm.whatsapp, congregacao: cadastroForm.congregacao
                }]);
            }
            setIsCadastroModalOpen(false);
        } catch (error) { }
        fetchData();
    };

    const handleDeleteCadastro = async (id: string) => {
        if (window.confirm("Apagar este cadastro permanentemente?")) {
            setLoading(true);
            await supabase.from('cadastros').delete().eq('id', id);
            fetchData();
        }
    };

    const openCadastroEdit = (cadastro: any) => {
        setCadastroForm({ id: cadastro.id, nome: cadastro.nome, whatsapp: cadastro.whatsapp, congregacao: cadastro.congregacao });
        setIsCadastroModalOpen(true);
    };

    const processCheckin = async (cadastroId: string) => {
        const foundCadastro = cadastros.find(c => c.id === cadastroId);
        if (!foundCadastro) {
            setScanFeedback({ message: 'CADASTRO NÃO ENCONTRADO.', type: 'error' });
            setTimeout(() => setScanFeedback({ message: '', type: null }), 3000);
            return;
        }
        if (!selectedEventoId) {
            setScanFeedback({ message: 'ERRO: SELECIONE UM EVENTO ATIVO NO PAINEL!', type: 'error' });
            setTimeout(() => setScanFeedback({ message: '', type: null }), 4000);
            return;
        }
        const jaBateuNesseEvento = foundCadastro.presencas?.some((p: any) => p.evento_id === selectedEventoId);
        if (jaBateuNesseEvento) {
            setScanFeedback({ message: `ALERTA: ${foundCadastro.nome} JÁ REALIZOU CHECK-IN!`, type: 'error' });
        } else {
            setLoading(true);
            await supabase.from('presencas').insert([{ cadastro_id: foundCadastro.id, evento_id: selectedEventoId }]);
            setScanFeedback({ message: `CHECK-IN CONFIRMADO: ${foundCadastro.nome}`, type: 'success' });
            setCheckinSearchTerm('');
            fetchData();
        }
        setTimeout(() => setScanFeedback({ message: '', type: null }), 3000);
    };

    const handleRemovePresenca = async (presencaId: string) => {
        if (!window.confirm("Remover esta presença do histórico do jovem?")) return;
        setLoading(true);
        await supabase.from('presencas').delete().eq('id', presencaId);
        if (historyModalCadastro) {
            const { data } = await supabase.from('cadastros').select('*, presencas(*)').eq('id', historyModalCadastro.id).single();
            if (data) setHistoryModalCadastro(data);
        }
        fetchData();
    };

    const sendWhatsAppManual = (pedidoOuCadastro: any) => {
        let phone = pedidoOuCadastro.whatsapp.replace(/\D/g, '');
        if (!phone.startsWith('55')) phone = `55${phone}`;
        const primeiroNome = (pedidoOuCadastro.nome_completo || pedidoOuCadastro.nome).split(' ')[0];
        let text = '';
        if (pedidoOuCadastro.status) {
            const numeroPedido = pedidoOuCadastro.id.split('-')[0].toUpperCase();
            text = `*CONGRESSO MPG 2026 | SUPORTE*\n━━━━━━━━━━━━━━━━━━━━━━━\nOlá, *${primeiroNome}*! Tudo bem?\n\nAqui é da organização do congresso, entramos em contato sobre o seu pedido \`\`\`#${numeroPedido}\`\`\`...`;
        } else {
            text = `*CONGRESSO MPG 2026*\n━━━━━━━━━━━━━━━━━━━━━━━\nOlá, *${primeiroNome}*! Tudo bem?\n\nEntramos em contato sobre a sua inscrição no nosso sistema...`;
        }
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleSendTicketWhatsApp = async (cad: any) => {
        if (!selectedEventoId) return alert("Crie ou selecione um evento na aba 'Cadastros' para vincular ao passe!");
        setWhatsappLoadingId(cad.id);
        try {
            const primeiroNome = cad.nome.split(' ')[0];
            const cleanPhone = cad.whatsapp.replace(/\D/g, '');
            const urlTicket = `${baseUrl}/ticket-cadastro/${cad.id}?evento=${selectedEventoId}`;
            const mensagem = `*CONGRESSO MPG 2026 | PASSE DE ACESSO*\n━━━━━━━━━━━━━━━━━━━━━━━\nOlá, *${primeiroNome}*!\n\nAqui está o seu Passe Oficial dinâmico para o evento *${currentEventoObject?.nome || 'Configurado'}*:\n\n🎟️ *Acesse seu ticket no link abaixo:* 👇\n${urlTicket}\n\nApresente o QR Code na portaria da igreja ao entrar. Bom evento! 🔥🚀`;
            await fetch('/api/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: cleanPhone, message: mensagem }) });
            alert(`Ticket dinâmico enviado com sucesso para ${primeiroNome}!`);
        } catch (e) { alert("Erro ao disparar mensagem automática."); }
        setWhatsappLoadingId(null);
    };

    const updatePedidoStatus = async (pedido: any, novoStatus: string) => {
        setLoading(true);
        try {
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
                const urlTicket = `${baseUrl}/ticket/${pedido.id}`;
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
                    await fetch('/api/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: pedido.whatsapp, message: mensagem }) });
                }
            } catch (e) { }
        } catch (error) { }
        fetchData();
    };

    const manualCartTotal = manualCart.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0);

    const addToManualCart = () => {
        if (!manualItem.produto_id || !manualItem.tamanho) return;
        const prod = camisetas.find(c => c.id === manualItem.produto_id);
        if (!prod) return;
        const dbSizeKey = `${manualGender}_${manualItem.tamanho}`;
        const newItem = {
            id: Math.random().toString(36).substr(2, 9),
            produto_id: prod.id,
            nome: prod.nome,
            cor_hex: prod.cor_hex,
            tamanho: dbSizeKey,
            tamanho_display: `${manualGender === 'Masc' ? 'Masc' : 'Baby Look'} - ${manualItem.tamanho}`,
            quantidade: manualItem.quantidade,
            preco_unitario: prod.preco_base || 50
        };
        setManualCart([...manualCart, newItem]);
        setManualItem({ produto_id: '', tamanho: '', quantidade: 1 });
    };

    const removeFromManualCart = (id: string) => {
        setManualCart(manualCart.filter(i => i.id !== id));
    };

    const handleManualSale = async () => {
        if (manualCart.length === 0) return alert("Adicione pelo menos um item ao pedido!");
        setLoading(true);
        try {
            const { data: order } = await supabase.from('pedidos').insert([{
                nome_completo: manualCustomer.nome || 'Venda Presencial',
                whatsapp: 'Presencial',
                congregacao: manualCustomer.congregacao || 'Balcão / Evento',
                tipo_pedido: 'presencial',
                valor_total: manualCartTotal,
                status: 'entregue'
            }]).select().single();

            if (order) {
                const itemsToInsert = manualCart.map(item => ({
                    pedido_id: order.id, produto_id: item.produto_id, tamanho: item.tamanho, quantidade: item.quantidade, preco_unitario: item.preco_unitario
                }));
                await supabase.from('itens_pedido').insert(itemsToInsert);

                for (const item of manualCart) {
                    for (let i = 0; i < item.quantidade; i++) {
                        await supabase.rpc('decrementar_estoque', { p_id: item.produto_id, p_tamanho: item.tamanho });
                    }
                }
            }
            setManualCart([]);
            setManualCustomer({ nome: '', congregacao: '' });
            setIsManualSaleOpen(false);
        } catch (error) { }
        fetchData();
    };

    const handleScan = async (result: any) => {
        if (result && result.length > 0) {
            const scannedId = result[0].rawValue;
            const foundOrder = pedidos.find(p => p.id === scannedId);
            if (foundOrder) {
                setSelectedOrder(foundOrder);
                setIsScannerOpen(false);
                return;
            }
            await processCheckin(scannedId);
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
                        <button type="submit" disabled={authLoading} className="w-full bg-white text-[#030303] py-4 rounded-2xl font-black text-lg hover:bg-[#b1bbe8] transition-all mt-4 disabled:opacity-50 flex items-center justify-center gap-2">
                            {authLoading ? <Loader2 size={20} className="animate-spin" /> : 'Entrar'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const receiptSrc = viewReceipt?.startsWith('http') ? viewReceipt : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/receipts/${viewReceipt}`;

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
                    <button onClick={() => { setActiveTab('cadastros'); setSelectedOrder(null); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-4 py-4 rounded-xl font-bold transition-all ${activeTab === 'cadastros' && !selectedOrder ? 'bg-[#3c5491] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <div className="flex items-center gap-3"><Users size={18} /> Cadastros</div>
                        <span className="bg-white/10 text-white text-[10px] px-2 py-1 rounded-full">{cadastros.length}</span>
                    </button>
                    <button onClick={() => { setActiveTab('frequencia'); setSelectedOrder(null); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl font-bold transition-all ${activeTab === 'frequencia' && !selectedOrder ? 'bg-[#3c5491] text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                        <LineChart size={18} /> Frequência Geral
                    </button>
                </nav>
                <div className="p-4 border-t border-white/5 space-y-2 pb-8 md:pb-4">
                    <button onClick={() => { setIsScannerOpen(true); setIsMobileMenuOpen(false) }} className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl font-black text-[#050505] bg-[#b1bbe8] hover:bg-white transition-all uppercase tracking-widest text-xs shadow-lg">
                        <ScanLine size={16} /> Check-in & Scanner
                    </button>
                    <button onClick={() => { setIsManualSaleOpen(true); setIsMobileMenuOpen(false) }} className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl font-black text-white bg-emerald-600 hover:bg-emerald-500 transition-all uppercase tracking-widest text-xs shadow-lg shadow-emerald-900/20">
                        <ShoppingCart size={16} /> PDV / Venda
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
                                        {selectedOrder.tipo_pedido === 'presencial' && <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-3 py-1 rounded uppercase tracking-widest font-black">Caixa/PDV</span>}
                                    </div>
                                    <p className="text-[#b1bbe8] font-black text-lg uppercase tracking-widest">#{selectedOrder.id.split('-')[0].toUpperCase()}</p>
                                </div>
                                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                                    {selectedOrder.status === 'pendente' && (
                                        <span className="text-orange-400 font-bold text-xs bg-orange-400/10 px-4 py-2 rounded-full flex items-center gap-2 border border-orange-400/20">
                                            <Clock size={14} /> {selectedOrder.tipo_pedido === 'lider' ? 'Aguardando Aprovação' : 'Aguardando Pagamento'}
                                        </span>
                                    )}
                                    {selectedOrder.status === 'aprovado' && <span className="text-emerald-400 font-bold text-xs bg-emerald-400/10 px-4 py-2 rounded-full flex items-center gap-2 border border-emerald-400/20"><CheckCircle size={14} /> Pronto para Entrega</span>}
                                    {selectedOrder.status === 'entregue' && <span className="text-gray-400 font-bold text-xs bg-white/5 px-4 py-2 rounded-full flex items-center gap-2 border border-white/10"><CheckCircle2 size={14} /> Finalizado</span>}
                                    {selectedOrder.status === 'cancelado' && <span className="text-red-400 font-bold text-xs bg-red-400/10 px-4 py-2 rounded-full flex items-center gap-2 border border-red-400/20"><XCircle size={14} /> Cancelado</span>}
                                    <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{new Date(selectedOrder.criado_em).toLocaleString('pt-BR')}</p>
                                </div>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-8">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 flex items-center gap-2"><User size={14} /> Cliente</p>
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
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 flex items-center gap-2"><MapPin size={14} /> Localização</p>
                                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                            <p className="font-black text-lg text-[#b1bbe8]">{selectedOrder.congregacao}</p>
                                            <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">Congregação / Origem</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 flex items-center gap-2"><Package size={14} /> Itens Reservados</p>
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
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4 flex items-center gap-2"><DollarSign size={14} /> Financeiro</p>
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
                                        <button onClick={() => updatePedidoStatus(selectedOrder, 'aprovado')} disabled={loading} className="flex-1 bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm md:text-lg hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                                            {loading ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />} {selectedOrder.tipo_pedido === 'lider' ? 'APROVAR PEDIDO' : 'APROVAR PAGAMENTO'}
                                        </button>
                                        <button onClick={() => updatePedidoStatus(selectedOrder, 'cancelado')} disabled={loading} className="bg-red-500/10 text-red-500 border border-red-500/20 px-8 rounded-2xl font-black text-sm hover:bg-red-50 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                            {loading ? <Loader2 size={16} className="animate-spin" /> : null} Cancelar
                                        </button>
                                    </div>
                                )}
                                {selectedOrder.status === 'aprovado' && (
                                    <button onClick={() => updatePedidoStatus(selectedOrder, 'entregue')} disabled={loading} className="w-full bg-[#3c5491] text-white py-6 rounded-2xl font-black text-lg md:text-2xl hover:bg-[#b1bbe8] hover:text-[#050505] transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(60,84,145,0.4)] disabled:opacity-50 disabled:cursor-not-allowed">
                                        {loading ? <Loader2 size={28} className="animate-spin" /> : <Truck size={28} />} MARCAR COMO ENTREGUE
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
                            <div className="flex w-full md:w-auto items-center gap-2">
                                <button onClick={() => setShowStats(!showStats)} className="flex items-center justify-center p-3 md:px-5 md:py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold transition-all">
                                    {showStats ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                <button onClick={fetchData} disabled={loading} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Atualizar
                                </button>
                            </div>
                        </header>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                            <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-[#0a0a0a] to-[#050505] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><DollarSign size={80} /></div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mb-2 md:mb-3">Caixa (Pagos)</p>
                                <p className="text-3xl md:text-5xl font-black text-emerald-400">{showStats ? `R$ ${estatisticas.caixa.toLocaleString('pt-BR')}` : 'R$ ••••••'}</p>
                            </div>
                            <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-[#0a0a0a] to-[#050505] p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                                <div className="absolute -top-4 -right-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Package size={80} /></div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mb-2 md:mb-3">Peças Vendidas</p>
                                <p className="text-3xl md:text-5xl font-black text-white">{showStats ? estatisticas.vendidas : '••••'}</p>
                            </div>
                            <div className="col-span-1 md:col-span-1 bg-gradient-to-br from-[#0a0a0a] to-[#050505] p-6 rounded-2xl border border-[#3c5491]/30 relative overflow-hidden group shadow-[inset_0_0_50px_rgba(60,84,145,0.1)]">
                                <div className="absolute -top-4 -right-4 p-8 opacity-10 text-[#3c5491] group-hover:opacity-20 transition-opacity"><Activity size={80} /></div>
                                <p className="text-[10px] text-[#b1bbe8] uppercase tracking-[0.2em] font-bold mb-2 md:mb-3">Pedidos Pendentes</p>
                                <p className="text-3xl md:text-5xl font-black text-white">{showStats ? estatisticas.pendentes : '••••'}</p>
                            </div>
                            <div className="col-span-1 md:col-span-1 bg-gradient-to-br from-emerald-900/20 to-[#050505] p-6 rounded-2xl border border-emerald-500/30 relative overflow-hidden group">
                                <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mb-2">Total Presenças</p>
                                <p className="text-3xl md:text-5xl font-black text-white">{showStats ? totalPresencasGerais : '••••'}</p>
                            </div>
                        </div>

                        {activeTab === 'cadastros' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-[#0a0a0a] p-6 rounded-2xl border border-white/5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 flex items-center gap-1.5"><Calendar size={12} /> 1. Selecione o Evento Ativo</label>
                                        <select value={selectedEventoId} onChange={e => setSelectedEventoId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-[#3c5491] appearance-none text-sm font-bold">
                                            {eventos.map(e => <option key={e.id} value={e.id} className="text-black">{e.nome} ({new Date(e.data_evento).toLocaleDateString('pt-BR')})</option>)}
                                            {eventos.length === 0 && <option value="" className="text-black">Nenhum evento criado</option>}
                                        </select>
                                    </div>
                                    <form onSubmit={handleCreateEvento} className="lg:col-span-2 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-500 flex items-center gap-1.5"><CalendarPlus size={12} /> Criar Novo Evento / Ensaio</label>
                                            <button type="button" onClick={() => { if (!selectedEventoId) return alert('Selecione um evento primeiro!'); setIsTelaoShareOpen(true); }} className="text-[10px] uppercase tracking-[0.2em] font-black text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-lg">
                                                <MonitorUp size={12} /> Link Telão
                                            </button>
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="text" placeholder="Ex: Ensaio de Sábado Geral" value={novoEventoNome} onChange={e => setNovoEventoNome(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#3c5491] text-sm font-medium" />
                                            <button type="submit" className="bg-white text-black px-6 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#b1bbe8] transition-all">Criar</button>
                                        </div>
                                    </form>
                                </div>

                                <div className="bg-[#0a0a0a] rounded-2xl md:rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
                                    <div className="p-4 md:p-6 border-b border-white/5 bg-[#050505]">
                                        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                                            <div>
                                                <h3 className="text-xl md:text-2xl font-black flex items-center gap-3 mb-1">
                                                    Lista de Inscrições <span className="bg-white/10 text-xs px-3 py-1 rounded-full">{cadastros.length}</span>
                                                </h3>
                                                <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                                    <CheckCircle2 size={12} /> Evento Selecionado: {totalPresencasEventoAtual} Check-ins realizados
                                                </p>
                                            </div>
                                            <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                                                <div className="relative w-full md:w-80">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                                    <input type="text" placeholder="Buscar cadastro..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs md:text-sm text-white focus:outline-none focus:border-[#3c5491] transition-all" />
                                                </div>
                                                <button onClick={() => setIsStatsModalOpen(true)} className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#3c5491]/10 border border-[#3c5491]/30 text-[#b1bbe8] px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#3c5491] hover:text-white transition-all shadow-xl">
                                                    <BarChart2 size={16} /> Raio-X
                                                </button>
                                                <button onClick={() => { setCadastroForm({ id: '', nome: '', whatsapp: '', congregacao: '' }); setIsCadastroModalOpen(true); }} className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-[#050505] px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#b1bbe8] transition-all shadow-xl">
                                                    <Plus size={16} /> Novo Cadastro Local
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[950px]">
                                            <thead>
                                                <tr className="bg-white/5">
                                                    <th className="p-4 md:p-6 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black border-b border-white/5">Nome / Registro</th>
                                                    <th className="p-4 md:p-6 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black border-b border-white/5">Contato</th>
                                                    <th className="p-4 md:p-6 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black border-b border-white/5">Congregação</th>
                                                    <th className="p-4 md:p-6 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black border-b border-white/5 text-center">Frequência</th>
                                                    <th className="p-4 md:p-6 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black border-b border-white/5 text-right">Ações / Disparos</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {displayCadastros.map((cad) => {
                                                    const jaBateuNesse = cad.presencas?.some((p: any) => p.evento_id === selectedEventoId);
                                                    const bns = new Date(cad.criado_em).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) === '21/06/2026' ? 1 : 0;
                                                    const totalPresStr = (cad.presencas?.length || 0) + bns;
                                                    return (
                                                        <tr key={cad.id} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                                            <td className="p-4 md:p-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${jaBateuNesse ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-gray-700'}`} />
                                                                    <div>
                                                                        <p className="font-black text-white text-base mb-1 truncate max-w-[180px] md:max-w-none">{cad.nome}</p>
                                                                        <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">{new Date(cad.criado_em).toLocaleString('pt-BR')}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 md:p-6">
                                                                <div className="flex items-center gap-2">
                                                                    <button onClick={() => sendWhatsAppManual(cad)} className="text-emerald-400 hover:text-emerald-300 transition-colors p-2 bg-emerald-500/10 rounded-lg">
                                                                        <MessageCircle size={16} />
                                                                    </button>
                                                                    <span className="font-medium text-sm text-gray-300">{cad.whatsapp}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 md:p-6">
                                                                <span className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-[#b1bbe8]">{cad.congregacao}</span>
                                                            </td>
                                                            <td className="p-4 md:p-6 text-center">
                                                                <button onClick={() => setHistoryModalCadastro(cad)} className={`font-black text-xs px-3 py-1.5 rounded-full border transition-all ${totalPresStr > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-white/5 text-gray-500 border-transparent hover:bg-white/10'}`}>
                                                                    {totalPresStr} Presenças
                                                                </button>
                                                            </td>
                                                            <td className="p-4 md:p-6">
                                                                <div className="flex justify-end items-center gap-2">
                                                                    <button onClick={() => handleCheckInManual(cad.id)} disabled={jaBateuNesse || loading} className={`font-black text-[9px] uppercase tracking-widest px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 ${jaBateuNesse ? 'bg-zinc-800 text-gray-500 cursor-not-allowed border border-transparent' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'}`}>
                                                                        {jaBateuNesse ? 'Check-in OK' : '+ Presença'}
                                                                    </button>
                                                                    <button onClick={() => handleSendTicketWhatsApp(cad)} disabled={whatsappLoadingId === cad.id} className="bg-white text-black hover:bg-[#b1bbe8] font-black text-[9px] uppercase tracking-widest px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-lg">
                                                                        {whatsappLoadingId === cad.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Enviar Ticket
                                                                    </button>
                                                                    <button onClick={() => { navigator.clipboard.writeText(`${baseUrl}/ticket-cadastro/${cad.id}?evento=${selectedEventoId}`); alert('Passe dinâmico copiado!'); }} className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all" title="Copiar Passe Dinâmico">
                                                                        <Link size={14} />
                                                                    </button>
                                                                    <button onClick={() => setPreviewQrCadastro(cad)} className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-all" title="Ver QR Code">
                                                                        <QrCode size={14} />
                                                                    </button>
                                                                    <div className="w-[1px] h-6 bg-white/10 mx-0.5"></div>
                                                                    <button onClick={() => openCadastroEdit(cad)} disabled={loading} className="p-2 bg-white/5 hover:bg-[#3c5491] text-white rounded-lg transition-colors"><Edit2 size={14} /></button>
                                                                    <button onClick={() => handleDeleteCadastro(cad.id)} disabled={loading} className="p-2 bg-white/5 hover:bg-red-500 text-white rounded-lg transition-colors"><Trash2 size={14} /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {displayCadastros.length === 0 && (
                                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500 font-bold">Nenhum cadastro encontrado.</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'frequencia' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                                        <div className="absolute -top-4 -right-4 p-8 opacity-5"><Calendar size={80} /></div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold mb-2">Eventos Realizados</p>
                                        <p className="text-4xl font-black text-white">{eventos.length}</p>
                                    </div>
                                    <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-emerald-500/30 relative overflow-hidden bg-gradient-to-br from-emerald-900/20 to-transparent">
                                        <div className="absolute -top-4 -right-4 p-8 opacity-5 text-emerald-500"><Users size={80} /></div>
                                        <p className="text-[10px] text-emerald-400 uppercase tracking-[0.2em] font-bold mb-2">Presenças Mapeadas</p>
                                        <p className="text-4xl font-black text-white">{totalPresencasGerais}</p>
                                    </div>
                                    <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-[#3c5491]/30 relative overflow-hidden bg-gradient-to-br from-[#3c5491]/20 to-transparent">
                                        <div className="absolute -top-4 -right-4 p-8 opacity-5 text-[#3c5491]"><Trophy size={80} /></div>
                                        <p className="text-[10px] text-[#b1bbe8] uppercase tracking-[0.2em] font-bold mb-2">Congregação Top #1</p>
                                        <p className="text-2xl font-black text-white truncate">{congregacaoRankingGlobal.length > 0 ? congregacaoRankingGlobal[0].cong : 'Nenhuma'}</p>
                                        <p className="text-xs text-gray-400 font-bold mt-1">{congregacaoRankingGlobal.length > 0 ? congregacaoRankingGlobal[0].presencas : 0} check-ins totais</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-[#0a0a0a] rounded-2xl md:rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl flex flex-col h-[600px]">
                                        <div className="p-4 md:p-6 border-b border-white/5 bg-[#050505] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div>
                                                <h3 className="text-xl md:text-2xl font-black flex items-center gap-3">
                                                    Controle de Membros
                                                </h3>
                                                <p className="text-gray-500 text-xs font-bold mt-1">Classificação por número de presenças totais</p>
                                            </div>
                                            <div className="relative w-full sm:w-60">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                                <input type="text" placeholder="Buscar membro..." value={freqSearchTerm} onChange={e => setFreqSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs md:text-sm text-white focus:outline-none focus:border-[#3c5491] transition-all" />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto">
                                            <table className="w-full text-left border-collapse min-w-[500px]">
                                                <thead className="sticky top-0 bg-[#050505] z-10 shadow-sm border-b border-white/5">
                                                    <tr>
                                                        <th className="p-4 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">Pos</th>
                                                        <th className="p-4 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">Membro</th>
                                                        <th className="p-4 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black text-center">Freq Total</th>
                                                        <th className="p-4 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black text-right">Última Vez</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rankingFrequenciaIndividual.map((cad, index) => {
                                                        const pctAssiduidade = eventos.length > 0 ? Math.round((cad.totalPresencas / eventos.length) * 100) : 0;
                                                        return (
                                                            <tr key={cad.id} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                                                <td className="p-4">
                                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-amber-700 text-white' : 'bg-white/5 text-gray-500'}`}>
                                                                        #{index + 1}
                                                                    </div>
                                                                </td>
                                                                <td className="p-4">
                                                                    <p className="font-black text-white text-sm truncate max-w-[150px]">{cad.nome}</p>
                                                                    <p className="text-[10px] text-gray-500 font-bold tracking-widest mt-0.5 truncate">{cad.congregacao}</p>
                                                                </td>
                                                                <td className="p-4 text-center">
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <span className="text-xl font-black text-emerald-400">{cad.totalPresencas}</span>
                                                                        <div className="w-16 bg-white/5 h-1 rounded-full overflow-hidden">
                                                                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, pctAssiduidade)}%` }} />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="p-4 text-right">
                                                                    <p className="font-bold text-xs text-gray-300">{cad.ultimaPresenca}</p>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {rankingFrequenciaIndividual.length === 0 && (
                                                        <tr><td colSpan={4} className="p-8 text-center text-gray-500 font-bold">Nenhum membro encontrado.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="bg-[#0a0a0a] rounded-2xl md:rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl flex flex-col h-[600px]">
                                        <div className="p-4 md:p-6 border-b border-white/5 bg-[#050505] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div>
                                                <h3 className="text-xl md:text-2xl font-black flex items-center gap-3">
                                                    Balanço de Congregações
                                                </h3>
                                                <p className="text-gray-500 text-xs font-bold mt-1">Acumulado global de presenças e inscrições</p>
                                            </div>
                                            <div className="relative w-full sm:w-60">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                                <input type="text" placeholder="Buscar congregação..." value={congSearchTerm} onChange={e => setCongSearchTerm(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs md:text-sm text-white focus:outline-none focus:border-[#3c5491] transition-all" />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto">
                                            <table className="w-full text-left border-collapse min-w-[500px]">
                                                <thead className="sticky top-0 bg-[#050505] z-10 shadow-sm border-b border-white/5">
                                                    <tr>
                                                        <th className="p-4 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">Pos</th>
                                                        <th className="p-4 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">Congregação</th>
                                                        <th className="p-4 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black text-center">Inscritos</th>
                                                        <th className="p-4 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black text-right">Check-ins Totais</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {congregacaoRankingGlobal.map((stat, index) => (
                                                        <tr key={stat.cong} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                                                            <td className="p-4">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${index === 0 ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.4)]' : index === 1 ? 'bg-gray-300 text-black' : index === 2 ? 'bg-amber-700 text-white' : 'bg-white/5 text-gray-500'}`}>
                                                                    #{index + 1}
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <p className="font-black text-white text-sm">{stat.cong}</p>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className="bg-white/5 px-3 py-1 rounded-lg text-xs font-bold text-gray-400">{stat.total}</span>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <span className="text-xl font-black text-emerald-400">{stat.presencas}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {congregacaoRankingGlobal.length === 0 && (
                                                        <tr><td colSpan={4} className="p-8 text-center text-gray-500 font-bold">Nenhuma congregação encontrada.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

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
                                                                {pedido.tipo_pedido === 'presencial' && <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded uppercase tracking-widest font-black">PDV</span>}
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
                                                            {pedido.status === 'pendente' && <span className="flex items-center gap-1 md:gap-2 text-orange-400 font-bold text-[10px] md:text-xs bg-orange-400/10 px-2 md:px-3 py-1 md:py-2 rounded-full w-max"><Clock size={12} /> {pedido.tipo_pedido === 'lider' ? 'Aguardando Aprovação' : 'Avaliando'}</span>}
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

            {isTelaoShareOpen && currentEventoObject && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in" onClick={() => setIsTelaoShareOpen(false)}>
                    <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-[2rem] w-full max-w-lg shadow-2xl relative text-center" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setIsTelaoShareOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><XCircle size={24} /></button>

                        <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <MonitorUp size={32} className="text-emerald-400" />
                        </div>

                        <h3 className="text-2xl font-black mb-2">Transmissão do Telão</h3>
                        <p className="text-sm text-gray-400 mb-8">Envie este link para o computador da projeção. O telão atualiza sozinho em tempo real!</p>

                        <div className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-center gap-3 mb-8">
                            <input type="text" readOnly value={`${baseUrl}/telao?evento=${selectedEventoId}`} className="w-full bg-transparent text-white outline-none text-sm text-center font-mono selection:bg-emerald-500/30" />
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => { navigator.clipboard.writeText(`${baseUrl}/telao?evento=${selectedEventoId}`); alert('Link copiado!'); }} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                                <Copy size={16} /> Copiar Link
                            </button>
                            <button onClick={() => window.open(`/telao?evento=${selectedEventoId}`, '_blank')} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500 py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                <ExternalLink size={16} /> Abrir Telão Agora
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isScannerOpen && (
                <div className="fixed inset-0 bg-black z-[70] flex flex-col items-center justify-center p-4">
                    <div className="w-full max-w-md p-6 md:p-8 relative flex flex-col items-center bg-[#0a0a0a] rounded-[2.5rem] border border-white/10 shadow-2xl max-h-[90vh]">
                        <button onClick={() => setIsScannerOpen(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white bg-white/5 p-2 rounded-full transition-all"><XCircle size={24} /></button>
                        <h2 className="text-2xl font-black text-white mb-2 tracking-tighter">CENTRAL DE ACESSO</h2>

                        <div className="w-full bg-white/5 p-3 rounded-xl border border-white/10 mb-6 text-center">
                            <span className="text-[10px] uppercase font-bold text-[#b1bbe8] tracking-widest block">Evento de Validação Ativo:</span>
                            <span className="text-sm font-black text-white block mt-1 truncate">{currentEventoObject ? currentEventoObject.nome : 'NENHUM EVENTO SELECIONADO!'}</span>
                        </div>

                        {scanFeedback.type && (
                            <div className={`mb-6 px-4 py-3 rounded-xl text-center w-full font-black tracking-widest text-[10px] uppercase animate-in zoom-in ${scanFeedback.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-red-500/20 text-red-400 border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.3)]'}`}>
                                {scanFeedback.type === 'success' ? <CheckCircle2 className="mx-auto mb-1.5" size={24} /> : <XCircle className="mx-auto mb-1.5" size={24} />}
                                {scanFeedback.message}
                            </div>
                        )}

                        <div className="flex bg-[#111] p-1 rounded-xl w-full mb-6 border border-white/5">
                            <button onClick={() => setCheckinMethod('scanner')} className={`flex-1 py-3 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 ${checkinMethod === 'scanner' ? 'bg-[#3c5491] text-white shadow-lg' : 'text-gray-500'}`}><Camera size={14} /> Câmera (QR)</button>
                            <button onClick={() => setCheckinMethod('busca')} className={`flex-1 py-3 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 ${checkinMethod === 'busca' ? 'bg-[#3c5491] text-white shadow-lg' : 'text-gray-500'}`}><Keyboard size={14} /> Busca Manual</button>
                        </div>

                        {checkinMethod === 'scanner' ? (
                            <div className={`w-full aspect-square max-w-[280px] rounded-[2rem] overflow-hidden border-4 shadow-[0_0_50px_rgba(60,84,145,0.4)] relative bg-zinc-900 transition-colors duration-300 ${scanFeedback.type === 'success' ? 'border-emerald-500' : scanFeedback.type === 'error' ? 'border-red-500' : 'border-[#3c5491]'}`}>
                                <Scanner onScan={handleScan} components={{ finder: true }} />
                            </div>
                        ) : (
                            <div className="w-full flex-1 overflow-y-auto min-h-[280px] max-h-[50vh] pr-2 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                                <div className="relative mb-4">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                    <input type="text" placeholder="Digite WhatsApp ou Nome..." value={checkinSearchTerm} onChange={e => setCheckinSearchTerm(e.target.value)} className="w-full bg-[#111] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:bg-white/5 focus:border-[#b1bbe8] transition-all outline-none text-sm font-medium" />
                                </div>

                                {checkinSearchResults.map(cad => {
                                    const jaBateuNesse = cad.presencas?.some((p: any) => p.evento_id === selectedEventoId);
                                    return (
                                        <div key={cad.id} className={`flex flex-col md:flex-row justify-between items-start md:items-center bg-white/5 border ${jaBateuNesse ? 'border-emerald-500/30' : 'border-white/10'} p-4 rounded-2xl gap-4 hover:bg-white/10 transition-all`}>
                                            <div className="flex items-center gap-4 w-full md:w-auto overflow-hidden">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${jaBateuNesse ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#3c5491]/20 text-[#b1bbe8]'}`}>
                                                    <User size={20} />
                                                </div>
                                                <div className="overflow-hidden flex-1">
                                                    <p className="font-black text-sm md:text-base text-white truncate">{cad.nome}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold tracking-widest mt-0.5 truncate">{cad.whatsapp} • {cad.congregacao}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => processCheckin(cad.id)} disabled={jaBateuNesse || loading || !selectedEventoId} className={`shrink-0 w-full md:w-auto px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${jaBateuNesse ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-not-allowed' : 'bg-white text-black hover:bg-[#b1bbe8] hover:scale-105'}`}>
                                                {jaBateuNesse ? 'Presença Confirmada' : 'Dar Check-in'}
                                            </button>
                                        </div>
                                    )
                                })}

                                {checkinSearchTerm.length > 2 && checkinSearchResults.length === 0 && (
                                    <p className="text-center text-gray-500 text-xs font-bold py-4">Nenhum cadastro encontrado.</p>
                                )}
                                {checkinSearchTerm.length <= 2 && (
                                    <p className="text-center text-gray-600 text-[10px] uppercase font-bold py-4">Digite pelo menos 3 letras ou números.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isManualSaleOpen && (
                <div className="fixed inset-0 z-[100] flex justify-end">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsManualSaleOpen(false)} />
                    <div className="relative w-full md:w-[500px] bg-[#0a0a0a] border-l border-white/10 h-full flex flex-col animate-in slide-in-from-right duration-300 shadow-2xl">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#050505]">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-emerald-400 flex items-center gap-2"><ShoppingCart size={24} /> PDV Fast</h3>
                                <p className="text-gray-400 text-xs mt-1">Lançamento de balcão e baixa de estoque</p>
                            </div>
                            <button onClick={() => setIsManualSaleOpen(false)} className="text-gray-500 hover:text-white bg-white/5 p-2 rounded-full transition-all"><XCircle size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 md:p-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                            <form id="manual-sale-form" onSubmit={handleManualSale} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 ml-1">Cliente / Origem</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <input type="text" placeholder="Nome do jovem (Opcional)" value={manualCustomer.nome} onChange={e => setManualCustomer({ ...manualCustomer, nome: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:bg-white/5 focus:border-[#3c5491] transition-all outline-none font-medium text-sm" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                        <select value={manualCustomer.congregacao} onChange={e => setManualCustomer({ ...manualCustomer, congregacao: e.target.value })} className="w-full bg-[#111] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:bg-white/5 focus:border-[#3c5491] transition-all outline-none appearance-none font-medium text-sm">
                                            <option value="" className="text-gray-500">Direto no Caixa (Balcão)</option>
                                            {CONGREGACOES.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
                                    </div>
                                </div>
                                <div className="space-y-6 pt-4 border-t border-white/5">
                                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b1bbe8]">1. Escolha o Produto</p>
                                    <div className="flex gap-3 overflow-x-auto pb-2">
                                        {camisetas.map(c => (
                                            <button type="button" key={c.id} onClick={() => setManualItem({ ...manualItem, produto_id: c.id, tamanho: '' })} className={`min-w-[120px] p-3 rounded-2xl border text-left transition-all ${manualItem.produto_id === c.id ? 'bg-[#3c5491]/20 border-[#b1bbe8] scale-105' : 'bg-[#111] border-white/5 hover:border-white/20'}`}>
                                                <div className="w-6 h-6 rounded-full mb-2 border border-white/20 opacity-80" style={{ backgroundColor: c.cor_hex }} />
                                                <p className="font-black text-xs text-white truncate">{c.nome}</p>
                                                <p className="text-[10px] text-gray-400 font-bold mt-1">R$ {c.preco_base}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {manualItem.produto_id && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#b1bbe8] mb-3">2. Selecione o Tamanho</p>
                                        <div className="flex bg-[#111] p-1 rounded-xl w-full mb-4 border border-white/5">
                                            <button type="button" onClick={() => { setManualGender('Masc'); setManualItem({ ...manualItem, tamanho: '' }) }} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${manualGender === 'Masc' ? 'bg-white text-black' : 'text-gray-500'}`}>Masc (Tradicional)</button>
                                            <button type="button" onClick={() => { setManualGender('Fem'); setManualItem({ ...manualItem, tamanho: '' }) }} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all ${manualGender === 'Fem' ? 'bg-white text-black' : 'text-gray-500'}`}>Fem (Baby Look)</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(manualGender === 'Masc' ? MASC_SIZES : FEM_SIZES).map(size => (
                                                <button type="button" key={size} onClick={() => setManualItem({ ...manualItem, tamanho: size })} className={`h-10 min-w-[3rem] px-3 rounded-lg font-black text-xs transition-all border ${manualItem.tamanho === size ? 'bg-[#3c5491] text-white border-[#3c5491]' : 'bg-[#111] border-white/5 text-gray-400 hover:border-white/20'}`}>{size}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {manualItem.tamanho && (
                                    <div className="flex items-end gap-3 animate-in fade-in slide-in-from-top-2 pt-2">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500">Qtd</label>
                                            <div className="flex items-center gap-1 bg-[#111] border border-white/5 p-1 rounded-xl">
                                                <button type="button" onClick={() => setManualItem({ ...manualItem, quantidade: Math.max(1, manualItem.quantidade - 1) })} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-300"><Minus size={14} /></button>
                                                <span className="w-8 text-center font-black text-sm">{manualItem.quantidade}</span>
                                                <button type="button" onClick={() => setManualItem({ ...manualItem, quantidade: manualItem.quantidade + 1 })} className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><Plus size={14} /></button>
                                            </div>
                                        </div>
                                        <button type="button" onClick={addToManualCart} className="flex-1 h-[44px] bg-white text-[#050505] rounded-xl font-black text-xs hover:bg-[#b1bbe8] transition-all flex items-center justify-center gap-2"><Plus size={16} /> Lançar no Pedido</button>
                                    </div>
                                )}
                            </form>
                            {manualCart.length > 0 && (
                                <div className="px-6 pb-6 mt-6 space-y-3 border-t border-white/5 pt-6">
                                    <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 border-b border-white/5 pb-2 mb-4">Itens no Pedido Atual</h4>
                                    {manualCart.map(item => (
                                        <div key={item.id} className="flex justify-between items-center bg-[#111] border border-white/5 p-3 rounded-xl">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-lg border border-white/10 shrink-0 opacity-80" style={{ backgroundColor: item.cor_hex }} />
                                                <div className="truncate">
                                                    <p className="font-black text-white text-xs truncate">{item.quantidade}x {item.nome}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{item.tamanho_display}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 ml-2">
                                                <span className="font-black text-emerald-400 text-xs">R$ {item.preco_unitario * item.quantidade}</span>
                                                <button onClick={() => removeFromManualCart(item.id)} className="text-red-500/50 hover:text-red-400 transition-colors p-1"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-6 md:p-8 bg-[#050505] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] z-10">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-gray-400 uppercase tracking-widest text-[10px] font-bold">Total a Cobrar</span>
                                <span className="text-4xl font-black text-white tracking-tighter">R$ {manualCartTotal.toLocaleString('pt-BR')}</span>
                            </div>
                            <button onClick={handleManualSale} disabled={loading || manualCart.length === 0} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-base hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.3)] disabled:opacity-30 disabled:cursor-not-allowed">Fecho Venda</button>
                        </div>
                    </div>
                </div>
            )}

            {viewReceipt && (
                <div className="fixed inset-0 bg-black/95 z-[80] flex items-center justify-center p-4 md:p-6" onClick={() => setViewReceipt(null)}>
                    <div className="max-w-4xl w-full h-[80vh] md:h-[90vh] relative flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                        <div className="absolute -top-14 md:-top-16 right-0 flex items-center gap-3">
                            <a href={receiptSrc} target="_blank" rel="noreferrer" className="bg-[#3c5491] text-white flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl hover:bg-[#b1bbe8] hover:text-[#050505] transition-all text-sm shadow-xl">
                                <ExternalLink size={16} /> Abrir Original
                            </a>
                            <button onClick={() => setViewReceipt(null)} className="text-white flex items-center gap-2 font-bold bg-white/10 px-4 py-2.5 rounded-xl hover:bg-red-500 transition-all text-sm shadow-xl">
                                <XCircle size={16} /> Fechar
                            </button>
                        </div>
                        {viewReceipt.toLowerCase().includes('.pdf') ? (
                            <iframe src={receiptSrc} className="w-full h-full rounded-2xl md:rounded-[2rem] bg-white border border-white/10" />
                        ) : (
                            <img src={receiptSrc} className="max-w-full max-h-full object-contain rounded-2xl md:rounded-[2rem]" />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
