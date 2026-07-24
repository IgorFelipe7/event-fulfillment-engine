"use client";

import { useState, useEffect } from 'react';
import { Lock, Calendar, Image as ImageIcon, ChevronDown, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const FOTOS_ANTERIORES = [
  "/galeria-1.jpg", 
  "/galeria-2.jpg", 
  "/galeria-3.jpg", 
  "/galeria-4.jpg"
];

export default function DistanciaZeroPro() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [camisetas, setCamisetas] = useState<any[]>([]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    fetchCamisetas();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchCamisetas = async () => {
    try {
      const { data } = await supabase.from('produtos').select('*').order('nome');
      if (data) setCamisetas(data);
    } catch (error) {
      console.error("Erro ao buscar catálogo", error);
    }
  };

  const scrollToColecao = () => {
    document.getElementById('colecao')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans overflow-x-hidden selection:bg-[#3c5491] selection:text-white">
      {/* NAVBAR */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-[#030303]/80 backdrop-blur-2xl border-b border-white/5 py-3 shadow-2xl' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-8 flex justify-between items-center">
          <span className="text-2xl md:text-3xl font-black tracking-tighter drop-shadow-lg">
            DZ<span className="text-[#3c5491]">.</span>
          </span>
          <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-md">
            <Lock size={14} className="text-red-400" />
            <span className="text-[10px] md:text-xs font-bold text-red-400 uppercase tracking-widest">
              Vendas Encerradas
            </span>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[#030303]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
        
        {/* Glowing Orbs */}
        <div className="absolute top-[10%] -left-[10%] w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-[#3c5491] rounded-full mix-blend-screen filter blur-[150px] md:blur-[200px] opacity-20 animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[0%] -right-[10%] w-[250px] md:w-[600px] h-[250px] md:h-[600px] bg-[#b1bbe8] rounded-full mix-blend-screen filter blur-[150px] md:blur-[250px] opacity-10 animate-[pulse_10s_ease-in-out_infinite_reverse]" />

        <div className="relative z-10 text-center px-4 mt-20 flex flex-col items-center w-full max-w-5xl">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-12 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <Calendar size={14} className="text-[#b1bbe8]" />
            <span className="text-[10px] font-black text-[#b1bbe8] tracking-[0.3em] uppercase">24 e 25 de Julho • Congresso MPG</span>
          </div>

          <h1 className="text-6xl sm:text-8xl md:text-[11rem] lg:text-[13rem] font-black tracking-tighter leading-[0.8] mb-10 w-full drop-shadow-2xl flex flex-col items-center">
            <span className="block text-white">DISTÂNCIA</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-[#b1bbe8] to-[#3c5491] drop-shadow-[0_0_40px_rgba(177,187,232,0.2)] mt-2">
              ZERO
            </span>
            <img
              src="/logo.png"
              alt="Logo Oficial"
              className="w-[0.4em] h-[0.4em] mt-8 object-contain drop-shadow-[0_0_30px_rgba(177,187,232,0.4)] hover:scale-105 transition-transform duration-700"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </h1>

          <p className="text-lg md:text-2xl font-light text-[#ddcbcb]/80 max-w-2xl mb-14 tracking-wide px-4 leading-relaxed">
            <strong className="text-white font-bold">MARCADOS PELA GRAÇA.</strong> <br className="hidden md:block" /> 
            Perto de Deus, vivendo o sobrenatural em nossa geração.
          </p>

          <button onClick={scrollToColecao} className="group relative flex items-center gap-4 bg-white/10 border border-white/20 text-white px-10 py-5 rounded-full font-black text-sm md:text-base transition-all hover:bg-white hover:text-black overflow-hidden w-[90%] md:w-auto justify-center backdrop-blur-md">
            <span className="relative z-10 flex items-center gap-3 uppercase tracking-widest">
              <Sparkles size={18} /> Ver Coleção Oficial
            </span>
          </button>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-40 animate-bounce cursor-pointer z-10 hover:opacity-100 transition-opacity" onClick={scrollToColecao}>
          <span className="text-[9px] uppercase tracking-[0.4em] font-bold">Deslize</span>
          <ChevronDown size={20} />
        </div>
      </header>

      {/* GALLERY SECTION */}
      <section className="py-24 md:py-32 relative z-20 bg-[#030303]">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">A ATMOSFERA</h2>
              <p className="text-white/50 text-base md:text-lg max-w-xl font-light">Reviva os momentos que marcaram nossa geração. Este ano será ainda mais intenso e transformador.</p>
            </div>
            <div className="flex items-center gap-3 text-white bg-white/5 px-6 py-3 rounded-full backdrop-blur-sm border border-white/10 w-full md:w-auto justify-center">
              <ImageIcon size={16} />
              <span className="font-bold tracking-[0.2em] uppercase text-[10px]">Galeria Oficial</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {FOTOS_ANTERIORES.map((foto, idx) => (
              <div key={idx} className={`relative group overflow-hidden rounded-2xl md:rounded-[2rem] bg-white/5 border border-white/5 ${idx === 0 || idx === 3 ? 'col-span-2 row-span-2 h-[300px] md:h-[500px]' : 'h-[145px] md:h-[240px] relative flex items-center justify-center'}`}>
                <img src={foto} alt={`Momento ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110 opacity-60 group-hover:opacity-100 grayscale group-hover:grayscale-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-90" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LOOKBOOK / COLLECTION SECTION (SALES CLOSED) */}
      <section id="colecao" className="py-24 md:py-32 bg-[#080808] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
          
          <div className="text-center mb-16 md:mb-24">
            <div className="inline-flex items-center justify-center gap-2 mb-6 bg-red-500/10 text-red-400 border border-red-500/20 px-6 py-2 rounded-full backdrop-blur-sm">
              <Lock size={16} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Lotes Encerrados</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight uppercase">Coleção <span className="text-[#3c5491]">Oficial</span></h2>
            <p className="text-white/50 text-base md:text-lg max-w-2xl mx-auto font-light">
              As vendas do vestuário oficial para o Congresso MPG 2026 foram oficialmente encerradas. Agradecemos a todos que garantiram sua peça.
            </p>
          </div>

          {camisetas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {camisetas.map((item) => (
                <div key={item.id} className="group relative bg-[#0d0d0d] rounded-[2rem] border border-white/5 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:border-white/15 hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)]">
                  
                  {/* Badge de Esgotado */}
                  <div className="absolute top-5 right-5 z-20 bg-[#030303]/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-xl">
                    <Lock size={12} className="text-gray-400" />
                    <span className="text-[10px] font-black text-gray-400 tracking-[0.2em] uppercase">Esgotado</span>
                  </div>

                  {/* Imagem do Produto */}
                  <div className="aspect-[4/5] bg-[#111] relative overflow-hidden">
                    <img 
                      src={item.img_url} 
                      alt={item.nome}
                      className="w-full h-full object-cover relative z-10 transition-transform duration-700 group-hover:scale-105 opacity-80" 
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                    />
                    <div className="absolute inset-0 mix-blend-multiply opacity-20 z-20" style={{ backgroundColor: item.cor_hex }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-transparent opacity-80 z-20" />
                  </div>

                  {/* Informações do Produto */}
                  <div className="p-8 relative z-30 -mt-10">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="font-black text-2xl text-white tracking-tight mb-2">{item.nome}</h3>
                        <p className="text-white/40 text-sm font-medium tracking-wide">Congresso MPG 2026</p>
                      </div>
                      <p className="text-[#516ebf] font-black text-xl">R$ {item.preco_base || 50}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-white/5 rounded-[2rem] bg-white/5 backdrop-blur-sm">
              <ImageIcon size={40} className="mx-auto text-white/20 mb-4" />
              <p className="text-white/40 font-medium">Carregando coleção oficial...</p>
            </div>
          )}

        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-16 bg-[#030303] text-center border-t border-white/5">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 opacity-20 grayscale" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <p className="text-[9px] uppercase tracking-[0.4em] text-white/20 font-bold mt-4">
            System Architecture & Code
          </p>
          <a href="https://github.com/IgorFelipe7" target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-1">
            <span className="text-[11px] font-black text-white/40 tracking-[0.3em] group-hover:text-white transition-colors duration-500">
              IGOR FELIPE
            </span>
            <div className="h-[1px] w-0 bg-[#3c5491] group-hover:w-full transition-all duration-500"></div>
          </a>
        </div>
      </footer>
    </div>
  );
}
