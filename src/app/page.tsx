"use client";

import { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowRight, ShoppingBag, AlertCircle, CheckCircle2, ChevronDown, Calendar, Image as ImageIcon, Loader2, Copy, Check, Trash2, Plus, Upload, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const FOTOS_ANTERIORES = ["/galeria-1.jpg", "/galeria-2.jpg", "/galeria-3.jpg", "/galeria-4.jpg"];
const CONGREGACOES = [
  "Adelaide", "Amanda 1", "Amanda 2", "Amanda 4", "Amanda 5", "Ângulo", "Boa Esperança", "Bom Repouso", "Brasil", "Carmem Cristina", "Colinas", "Conquista", "Esmeralda", "Fátima 1", "Figueiras", "Guedes", "Horto", "Interlagos", "Maria de Lourdes", "Mirante", "Nova América", "Nova Europa", "Nova Hortolândia 1", "Nova Hortolândia 2", "Odimar", "Orestes Ôngaro", "Paviotti", "Perón", "Templo Central"
];

const MASC_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'G1', 'G2', 'G3', 'G4', 'G5'];
const FEM_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'G1'];

export default function DistanciaZeroPro() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [camisetas, setCamisetas] = useState<any[]>([]);
  const [orderType, setOrderType] = useState<'individual' | 'lider'>('individual');
  const [cart, setCart] = useState<any[]>([]);
  
  const [selectedShirt, setSelectedShirt] = useState<string | null>(null);
  const [gender, setGender] = useState<'Masc' | 'Fem'>('Masc');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [formData, setFormData] = useState({ nome: '', whatsapp: '', congregacao: '' });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    fetchCamisetas();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCamisetas = async () => {
    const { data } = await supabase.from('produtos').select('*').order('nome');
    if (data) setCamisetas(data);
  };

  const getStockKey = (g: string, s: string) => `${g}_${s}`;

  const maxStock = useMemo(() => {
    if (!selectedShirt || !selectedSize) return 1;
    const shirt = camisetas.find(c => c.id === selectedShirt);
    if (!shirt) return 1;
    const stockKey = getStockKey(gender, selectedSize);
    const stockInDb = shirt.estoque[stockKey] || 0;
    const isPreOrder = shirt.tamanhos_encomenda?.[stockKey] === true;

    if (stockInDb === 0 && isPreOrder) return 999;

    const alreadyInCart = cart
      .filter(item => item.produto_id === selectedShirt && item.tamanho_db === stockKey)
      .reduce((acc, item) => acc + item.quantidade, 0);

    const available = stockInDb - alreadyInCart;
    return available > 0 ? available : 0;
  }, [selectedShirt, selectedSize, gender, camisetas, cart]);

  useEffect(() => {
    if (quantity > maxStock && maxStock > 0) setQuantity(maxStock);
    if (maxStock === 0) setQuantity(1);
  }, [maxStock, quantity]);

  const addToCart = () => {
    if (!selectedShirt || !selectedSize || maxStock === 0) return;
    const shirt = camisetas.find(c => c.id === selectedShirt);
    const stockKey = getStockKey(gender, selectedSize);
    
    const isEncomenda = shirt.estoque[stockKey] === 0 && shirt.tamanhos_encomenda?.[stockKey] === true;
    const finalQuantity = quantity > maxStock ? maxStock : quantity;

    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      produto_id: selectedShirt,
      nome: shirt.nome,
      cor_hex: shirt.cor_hex,
      tamanho_exibicao: `${gender === 'Masc' ? 'Masc' : 'Baby Look'} - ${selectedSize}`,
      tamanho_db: stockKey,
      quantidade: orderType === 'lider' ? finalQuantity : 1,
      preco: shirt.preco_base || 50,
      is_encomenda: isEncomenda
    };

    if (orderType === 'individual') setCart([newItem]);
    else setCart([...cart, newItem]);
    
    setSelectedSize(null);
    setQuantity(1);
  };

  const removeFromCart = (id: string) => setCart(cart.filter(item => item.id !== id));
  const totalValue = cart.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  const isFormComplete = cart.length > 0 && formData.nome !== '' && formData.whatsapp !== '' && formData.congregacao !== '';

  const handleProcessOrder = async () => {
    if (!isFormComplete) return;
    if (orderType === 'individual' && !receiptFile) return;
    setStatus('loading');

    let fileName = null;
    if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop();
        fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('receipts').upload(fileName, receiptFile);
        if (uploadError) { alert(`Erro no upload: ${uploadError.message}`); setStatus('idle'); return; }
    }

    const { data: order, error: orderError } = await supabase.from('pedidos').insert([{
      nome_completo: formData.nome,
      whatsapp: formData.whatsapp,
      congregacao: formData.congregacao,
      tipo_pedido: orderType,
      valor_total: totalValue,
      comprovante_url: fileName,
      status: 'pendente'
    }]).select().single();

    if (orderError || !order) { alert('Erro crítico ao gravar pedido.'); setStatus('idle'); return; }

    const itemsToInsert = cart.map(item => ({
      pedido_id: order.id, produto_id: item.produto_id, tamanho: item.tamanho_db, quantidade: item.quantidade, preco_unitario: item.preco
    }));

    await supabase.from('itens_pedido').insert(itemsToInsert);
    
    for (const item of cart) {
      for (let i = 0; i < item.quantidade; i++) {
        await supabase.rpc('decrementar_estoque', { p_id: item.produto_id, p_tamanho: item.tamanho_db });
      }
    }

    try {
      const primeiroNome = formData.nome.split(' ')[0];
      const numeroPedido = order.id.split('-')[0].toUpperCase();
      const listaItens = cart.map(item => `▪ ${item.quantidade}x ${item.nome} (*${item.tamanho_exibicao}*)`).join('\n');
      
      let mensagem = '';
      if (orderType === 'lider') {
          mensagem = `*CONGRESSO MPG 2026 | LIDERANÇA*\n━━━━━━━━━━━━━━━━━━━━━━━\nOlá, *${primeiroNome}*!\n\nSeu pedido de lote foi registrado no sistema.\n\n🎫 *CÓDIGO:* \`\`\`#${numeroPedido}\`\`\`\n\n*📋 RESUMO:*\n${listaItens}\n\n*💳 TOTAL:* R$ ${totalValue.toLocaleString('pt-BR')}\n\nSua solicitação está sob análise da Coordenação para validação do status de Líder. Assim que aprovado, enviaremos as instruções financeiras finais.\n\nForte abraço! 🔥`;
      } else {
          mensagem = `*CONGRESSO MPG 2026 | DISTÂNCIA ZERO*\n━━━━━━━━━━━━━━━━━━━━━━━\nOlá, *${primeiroNome}*! Paz! 🙏\n\nSeu pedido foi registrado com sucesso.\n\n🎫 *CÓDIGO:* \`\`\`#${numeroPedido}\`\`\`\n\n*📋 RESUMO:*\n${listaItens}\n\n*💳 TOTAL:* R$ ${totalValue.toLocaleString('pt-BR')}\n\nNossa equipe recebeu o seu comprovante PIX e está realizando a conferência. Você receberá seu Ticket Digital por aqui em breve.\n\nAgradecemos por vestir essa visão! 🚀`;
      }

      await fetch('/api/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: formData.whatsapp, message: mensagem }) });
    } catch (e) {}
    
    setStatus('success');
  };

  const scrollToForm = () => document.getElementById('encomenda')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
      <nav className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 py-3 md:py-4 shadow-2xl' : 'bg-transparent py-4 md:py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <span className="text-xl md:text-2xl font-black tracking-tighter">DZ<span className="text-[#3c5491]">.</span></span>
          <div className="bg-white/5 p-1 rounded-full border border-white/10 flex gap-1 w-full md:w-auto justify-center">
            <button onClick={() => { setOrderType('individual'); setCart([]) }} className={`px-4 md:px-5 py-2 rounded-full text-xs font-black transition-all flex-1 md:flex-none ${orderType === 'individual' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}>Individual</button>
            <button onClick={() => { setOrderType('lider'); setCart([]) }} className={`px-4 md:px-5 py-2 rounded-full text-xs font-black transition-all flex-1 md:flex-none ${orderType === 'lider' ? 'bg-[#3c5491] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>Líder / Lote</button>
          </div>
        </div>
      </nav>

      <header className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#050505]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="absolute top-[10%] -left-[10%] w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-[#3c5491] rounded-full mix-blend-screen filter blur-[150px] md:blur-[200px] opacity-30 animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[0%] -right-[10%] w-[250px] md:w-[600px] h-[250px] md:h-[600px] bg-[#b1bbe8] rounded-full mix-blend-screen filter blur-[150px] md:blur-[250px] opacity-20 animate-[pulse_10s_ease-in-out_infinite_reverse]" />

        <div className="relative z-10 text-center px-4 md:px-6 mt-16 md:mt-20 flex flex-col items-center w-full">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full border border-[#3c5491]/30 bg-[#3c5491]/10 backdrop-blur-xl mb-8 md:mb-12 shadow-[0_0_30px_rgba(60,84,145,0.2)]">
            <Calendar size={14} className="text-[#b1bbe8]" />
            <span className="text-[8px] md:text-[10px] font-black text-[#b1bbe8] tracking-[0.2em] md:tracking-[0.3em] uppercase">24 e 25 de Julho • Congresso MPG</span>
          </div>

          <h1 className="text-6xl sm:text-8xl md:text-[10rem] lg:text-[12rem] font-black tracking-tighter leading-[0.85] mb-6 md:mb-10 w-full drop-shadow-2xl flex flex-col items-center">
            <span className="block text-white">DISTÂNCIA</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffffff] via-[#b1bbe8] to-[#3c5491] drop-shadow-[0_0_40px_rgba(177,187,232,0.3)] mt-2 md:mt-4">
              ZERO
            </span>
            <img 
              src="/logo.png" 
              alt="Logo Oficial" 
              className="w-[0.4em] h-[0.4em] mt-6 md:mt-8 object-contain drop-shadow-[0_0_30px_rgba(177,187,232,0.6)] hover:scale-110 hover:-translate-y-2 transition-all duration-500" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }} 
            />
          </h1>
          
          <p className="text-lg md:text-2xl font-light text-[#ddcbcb]/80 max-w-2xl mb-10 md:mb-12 tracking-wide px-4">
            <strong className="text-white font-bold">MARCADOS PELA GRAÇA.</strong> <br className="hidden md:block" /> Perto de Deus, vivendo o sobrenatural.
          </p>
          
          <button onClick={scrollToForm} className="group relative flex items-center gap-4 bg-white text-[#050505] px-8 py-4 md:px-10 md:py-5 rounded-full font-black text-sm md:text-lg transition-all transform hover:scale-105 overflow-hidden w-[90%] md:w-auto justify-center shadow-[0_0_40px_rgba(255,255,255,0.15)]">
            <div className="absolute inset-0 bg-gradient-to-r from-[#ddcbcb] to-white opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative z-10 flex items-center gap-3">Garantir Camiseta <ArrowRight className="group-hover:translate-x-2 transition-transform" /></span>
          </button>
        </div>
        
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-bounce cursor-pointer z-10" onClick={scrollToForm}>
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Deslize</span>
          <ChevronDown size={20} />
        </div>
      </header>

      <section className="py-20 md:py-32 relative z-20 border-t border-white/5 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-16 gap-6">
            <div>
              <h2 className="text-3xl md:text-6xl font-black text-white mb-2 md:mb-4 tracking-tight">A ATMOSFERA</h2>
              <p className="text-[#b1bbe8] text-sm md:text-lg max-w-xl font-light">Reviva os momentos que marcaram nossa geração. Este ano será ainda mais intenso.</p>
            </div>
            <div className="flex items-center gap-3 text-white bg-white/5 px-4 md:px-6 py-2 md:py-3 rounded-full backdrop-blur-sm border border-white/10 w-full md:w-auto justify-center">
              <ImageIcon size={16} />
              <span className="font-bold tracking-[0.2em] uppercase text-[10px]">Galeria MPG</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            {FOTOS_ANTERIORES.map((foto, idx) => (
              <div key={idx} className={`relative group overflow-hidden rounded-2xl md:rounded-[2rem] bg-white/5 border border-white/10 ${idx === 0 || idx === 3 ? 'col-span-2 row-span-2 h-[250px] md:h-[500px]' : 'h-[120px] md:h-[242px] relative flex items-center justify-center'}`}>
                <img src={foto} alt={`Momento ${idx + 1}`} className="w-full h-full object-cover transition-all duration-[2000ms] group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="encomenda" className="py-20 md:py-32 bg-white text-[#050505] relative rounded-t-[2rem] md:rounded-t-[4rem] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-20 md:h-40 bg-gradient-to-b from-[#050505]/5 to-transparent" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">

            <div className={`lg:col-span-7 space-y-8 md:space-y-12 transition-all duration-500 ${status === 'success' ? 'opacity-50 pointer-events-none blur-sm' : ''}`}>
              <div className="bg-[#fafafa] p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-gray-200 shadow-[inset_0_0_100px_rgba(0,0,0,0.01)]">
                <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-10 flex items-center gap-3 md:gap-4 uppercase tracking-tight">
                  <span className="bg-[#3c5491] text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm shadow-lg">1</span>
                  Catálogo Oficial
                </h3>

                {orderType === 'individual' && cart.length > 0 ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 md:p-10 rounded-[2rem] text-center animate-in zoom-in">
                    <CheckCircle2 size={48} className="mx-auto text-emerald-500 mb-4" />
                    <h4 className="text-xl md:text-2xl font-black text-emerald-700 mb-2 tracking-tight">Camiseta Selecionada!</h4>
                    <p className="text-gray-600 text-sm md:text-base font-medium max-w-sm mx-auto">Preencha seus dados para gerar a chave PIX.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
                      {camisetas.map((item) => {
                        const totalEstoque = Object.values(item.estoque).reduce((a: any, b: any) => a + b, 0) as number;
                        const allowsPreOrder = item.tamanhos_encomenda ? Object.values(item.tamanhos_encomenda).some(v => v === true) : false;
                        const isAvailable = totalEstoque > 0 || allowsPreOrder;

                        return (
                          <div key={item.id} onClick={() => { if (isAvailable) setSelectedShirt(item.id) }} className={`p-3 md:p-4 rounded-2xl md:rounded-3xl cursor-pointer transition-all border-2 ${!isAvailable ? 'opacity-50 grayscale cursor-not-allowed border-transparent bg-gray-100' : selectedShirt === item.id ? 'border-[#3c5491] bg-white shadow-xl scale-105' : 'border-transparent bg-white shadow-md hover:shadow-lg hover:-translate-y-1'}`}>
                            <div className="aspect-[4/5] rounded-xl md:rounded-2xl mb-3 overflow-hidden bg-gray-200 relative">
                              <img src={item.img_url} className="w-full h-full object-cover relative z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              <div className="absolute inset-0 mix-blend-multiply opacity-[0.08] transition-opacity duration-300 z-20" style={{ backgroundColor: item.cor_hex }} />
                            </div>
                            <p className="font-black text-sm md:text-lg tracking-tight leading-tight mb-1 truncate">{item.nome}</p>
                            <p className="text-[#3c5491] font-extrabold text-sm md:text-base">R$ {item.preco_base || 50},00</p>
                          </div>
                        );
                      })}
                    </div>

                    {selectedShirt && (
                      <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 border-t border-gray-200 pt-6 md:pt-10">
                        <div className="flex bg-gray-100 p-1 rounded-2xl w-full">
                          <button onClick={() => { setGender('Masc'); setSelectedSize(null) }} className={`flex-1 py-3 text-xs md:text-sm font-black rounded-xl transition-all ${gender === 'Masc' ? 'bg-white shadow-md text-[#3c5491]' : 'text-gray-500'}`}>Masc (Tradicional)</button>
                          <button onClick={() => { setGender('Fem'); setSelectedSize(null) }} className={`flex-1 py-3 text-xs md:text-sm font-black rounded-xl transition-all ${gender === 'Fem' ? 'bg-white shadow-md text-[#3c5491]' : 'text-gray-500'}`}>Fem (Baby Look)</button>
                        </div>

                        <div>
                          <h4 className="font-black text-lg md:text-xl mb-4 tracking-tight">Tamanho Disponível</h4>
                          <div className="flex flex-wrap gap-2 md:gap-3">
                            {(gender === 'Masc' ? MASC_SIZES : FEM_SIZES).map(size => {
                              const shirtData = camisetas.find(c => c.id === selectedShirt);
                              const stockKey = getStockKey(gender, size);
                              const stockInDb = shirtData?.estoque[stockKey] || 0;
                              const isPreOrder = stockInDb === 0 && shirtData?.tamanhos_encomenda?.[stockKey] === true;
                              
                              const alreadyInCart = cart
                                .filter(item => item.produto_id === selectedShirt && item.tamanho_db === stockKey)
                                .reduce((acc, item) => acc + item.quantidade, 0);

                              const availableStock = stockInDb - alreadyInCart;
                              const isAvailable = availableStock > 0 || isPreOrder;

                              return (
                                <button key={size} disabled={!isAvailable} onClick={() => setSelectedSize(size)} className={`h-12 md:h-14 min-w-[3.5rem] md:min-w-[4rem] px-3 md:px-4 rounded-xl md:rounded-2xl font-black transition-all overflow-hidden relative text-sm md:text-base ${!isAvailable ? 'bg-gray-100 text-gray-300 border-2 border-gray-100' : selectedSize === size ? 'bg-[#3c5491] text-white border-2 border-[#3c5491] scale-110 shadow-lg' : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-[#3c5491] hover:text-[#3c5491]'}`}>
                                  {size}
                                  {!isAvailable && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[2px] bg-gray-300 rotate-45" />}
                                </button>
                              );
                            })}
                          </div>
                          {selectedSize && maxStock === 999 && (
                            <div className="mt-4 flex items-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-xl border border-orange-200 animate-in fade-in">
                              <Clock size={16} /> <span className="text-xs font-bold uppercase tracking-widest">Sob Encomenda (Prazo: 40 dias)</span>
                            </div>
                          )}
                        </div>

                        {orderType === 'lider' && (
                          <div className="flex items-center justify-between gap-4 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-gray-200 shadow-sm w-full">
                            <label className="font-black text-gray-500 uppercase tracking-widest text-[10px] md:text-xs">Quantidade:</label>
                            <div className="flex flex-col items-end">
                              <input 
                                type="number" 
                                min="1" 
                                max={maxStock === 999 ? undefined : maxStock}
                                value={quantity} 
                                onChange={(e) => {
                                  let val = parseInt(e.target.value);
                                  if (isNaN(val) || val < 1) val = 1;
                                  if (val > maxStock) val = maxStock;
                                  setQuantity(val);
                                }} 
                                className="w-20 md:w-24 p-2 md:p-3 rounded-lg md:rounded-xl bg-gray-50 border border-gray-200 font-black text-lg md:text-xl text-center outline-none focus:border-[#3c5491]" 
                              />
                              <span className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">
                                {maxStock === 999 ? 'Estoque Livre' : `Máx: ${maxStock} unid.`}
                              </span>
                            </div>
                          </div>
                        )}

                        <button onClick={addToCart} disabled={!selectedSize || maxStock === 0} className="w-full py-4 md:py-5 bg-[#050505] text-white rounded-xl md:rounded-2xl font-black text-base md:text-lg flex items-center justify-center gap-2 md:gap-3 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#3c5491] transition-colors shadow-xl">
                          <Plus size={20} /> Adicionar ao Pedido
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {cart.length > 0 && (
                <div className="bg-white p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] border-2 border-[#3c5491] shadow-2xl animate-in fade-in slide-in-from-bottom-8">
                  <h3 className="text-xl md:text-2xl font-black mb-6 md:mb-8 uppercase tracking-tight">Itens no Pedido</h3>
                  <div className="space-y-3 md:space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-4 md:p-6 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100">
                        <div className="flex items-center gap-3 md:gap-4 w-full overflow-hidden">
                          <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-lg md:rounded-xl flex items-center justify-center border border-gray-200 bg-white shadow-sm">
                            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full opacity-50 mix-blend-screen" style={{ backgroundColor: item.cor_hex }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-black text-sm md:text-lg leading-none mb-1 truncate">{item.quantidade}x {item.nome}</p>
                            <p className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest truncate">
                              {item.tamanho_exibicao} {item.is_encomenda && <span className="text-orange-500">(Encomenda)</span>}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="p-2 md:p-3 text-red-500 hover:bg-red-50 rounded-lg md:rounded-xl transition-colors flex-shrink-0"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 relative">
              <div className="sticky top-24 md:top-32">
                {status === 'success' ? (
                  <div className="bg-[#4a5d23] text-white p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-white/20 text-center animate-in zoom-in duration-500">
                    <CheckCircle2 size={64} className="mx-auto text-white mb-6 md:mb-8" />
                    <h3 className="text-3xl md:text-4xl font-black mb-3 md:mb-4 tracking-tight">TUDO CERTO!</h3>
                    <p className="text-white/90 font-medium mb-8 md:mb-10 text-sm md:text-lg">Pedido gerado. Aguarde a confirmação via WhatsApp.</p>
                    <button onClick={() => window.location.reload()} className="w-full py-4 md:py-5 bg-white text-[#4a5d23] rounded-xl md:rounded-2xl font-black text-base md:text-lg hover:scale-105 transition-all shadow-xl">Fazer Novo Pedido</button>
                  </div>
                ) : (
                  <div className={`bg-[#050505] text-white p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl border border-white/10 transition-all duration-500`}>
                    <h3 className="text-xl md:text-2xl font-black mb-8 md:mb-10 flex items-center gap-3 md:gap-4 uppercase tracking-tight text-white">
                      <span className="bg-white text-[#050505] w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm shadow-lg">2</span>
                      Dados da Reserva
                    </h3>

                    <div className="space-y-4 md:space-y-6 mb-8 md:mb-10">
                      <input type="text" placeholder="Nome Completo" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-5 py-4 md:px-6 md:py-5 text-sm md:text-base font-medium outline-none focus:border-[#b1bbe8] transition-all placeholder:text-gray-500" />
                      <input type="tel" placeholder="WhatsApp" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-5 py-4 md:px-6 md:py-5 text-sm md:text-base font-medium outline-none focus:border-[#b1bbe8] transition-all placeholder:text-gray-500" />

                      <div className="relative" ref={dropdownRef}>
                        <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`w-full bg-white/5 border ${isDropdownOpen ? 'border-[#b1bbe8]' : 'border-white/10'} rounded-xl md:rounded-2xl px-5 py-4 md:px-6 md:py-5 text-sm md:text-base font-medium flex justify-between items-center cursor-pointer transition-all`}>
                          <span className={formData.congregacao ? 'text-white' : 'text-gray-500 truncate mr-2'}>{formData.congregacao || 'Onde você congrega?'}</span>
                          <ChevronDown className={`text-gray-500 transition-transform duration-300 flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`} size={20} />
                        </div>
                        {isDropdownOpen && (
                          <div className="absolute top-full left-0 w-full mt-2 bg-[#111] border border-white/10 rounded-xl md:rounded-2xl shadow-2xl max-h-64 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200 [&::-webkit-scrollbar]:w-1 md:[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                            <div className="px-5 py-3 md:px-6 md:py-4 hover:bg-white/5 cursor-pointer text-gray-500 text-xs md:text-sm font-medium transition-colors border-b border-white/5" onClick={() => { setFormData({ ...formData, congregacao: '' }); setIsDropdownOpen(false); }}>Limpar seleção</div>
                            {CONGREGACOES.map((cong) => (
                              <div key={cong} className={`px-5 py-3 md:px-6 md:py-4 hover:bg-white/5 cursor-pointer transition-colors text-xs md:text-sm ${formData.congregacao === cong ? 'bg-[#3c5491]/20 text-[#b1bbe8] font-black' : 'text-gray-300 font-medium'}`} onClick={() => { setFormData({ ...formData, congregacao: cong }); setIsDropdownOpen(false); }}>{cong}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {orderType === 'individual' ? (
                      <>
                        <div className="bg-[#0a0a0a] rounded-2xl md:rounded-[2rem] p-6 md:p-8 border border-white/5 text-center mb-8 md:mb-10 shadow-[inset_0_0_50px_rgba(255,255,255,0.02)]">
                          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-4 md:mb-6">Escaneie o QR Code</p>
                          <div className="w-32 h-32 md:w-48 md:h-48 bg-white mx-auto mb-6 md:mb-8 rounded-xl md:rounded-3xl flex items-center justify-center overflow-hidden p-2">
                            <img src="/qr-pix.png" alt="QR Code PIX" className="w-full h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                          </div>
                          <p className="text-3xl md:text-5xl font-black mb-3 md:mb-4 tracking-tighter">R$ {totalValue.toLocaleString('pt-BR')}</p>
                          <button onClick={() => { navigator.clipboard.writeText("22.624.668/0001-42"); setCopied(true); setTimeout(() => setCopied(false), 2000) }} className="bg-white/10 hover:bg-white/20 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-bold text-[10px] md:text-sm uppercase tracking-widest flex items-center justify-center gap-2 md:gap-3 mx-auto transition-all w-max">
                            {copied ? 'Chave Copiada!' : 'Copiar CNPJ'} <span className="w-4 h-4 flex items-center justify-center">{copied ? <Check size={16} /> : <Copy size={16} />}</span>
                          </button>
                        </div>
                        <div className="space-y-3 md:space-y-4 mb-8 md:mb-10">
                          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Comprovante</p>
                          <button onClick={() => fileInputRef.current?.click()} className={`w-full py-6 md:py-8 border-2 border-dashed rounded-2xl md:rounded-[2rem] flex flex-col items-center justify-center gap-2 md:gap-3 transition-all ${receiptFile ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/20 hover:bg-white/5'}`}>
                            {receiptFile ? <CheckCircle2 size={24} className="text-emerald-400" /> : <Upload size={24} className="text-gray-500" />}
                            <span className={`text-[10px] md:text-xs font-bold uppercase tracking-widest text-center px-4 truncate w-full ${receiptFile ? 'text-emerald-400' : 'text-gray-400'}`}>{receiptFile ? receiptFile.name : "Anexar Arquivo (PDF ou Foto)"}</span>
                          </button>
                          <input type="file" ref={fileInputRef} onChange={e => setReceiptFile(e.target.files?.[0] || null)} className="hidden" accept="image/*,application/pdf" />
                        </div>
                      </>
                    ) : (
                      <div className="bg-[#3c5491]/10 border border-[#3c5491]/30 p-6 md:p-8 rounded-2xl md:rounded-[2rem] text-center mb-8 md:mb-10">
                        <AlertCircle size={40} className="mx-auto text-[#b1bbe8] mb-4" />
                        <h4 className="text-lg md:text-xl font-black text-[#b1bbe8] mb-2 tracking-tight">Pedido de Liderança</h4>
                        <p className="text-gray-400 text-xs md:text-sm font-medium">Você não precisa anexar comprovante agora. O pagamento do lote será alinhado diretamente com a coordenação financeira.</p>
                      </div>
                    )}

                    <button onClick={handleProcessOrder} disabled={!isFormComplete || (orderType === 'individual' && !receiptFile) || status === 'loading'} className="w-full py-5 md:py-6 bg-white hover:bg-[#b1bbe8] text-[#050505] rounded-xl md:rounded-2xl font-black text-base md:text-xl flex items-center justify-center gap-2 md:gap-3 transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-[0_0_50px_rgba(255,255,255,0.15)] disabled:shadow-none hover:scale-[1.02]">
                      {status === 'loading' ? <><Loader2 size={20} className="animate-spin" /> Gravando</> : <><ShoppingBag size={20} /> Solicitar Reserva</>}
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}