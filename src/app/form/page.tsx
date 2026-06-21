"use client";

import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, ChevronDown, Loader2, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const CONGREGACOES = [
  "Adelaide", "Amanda 1", "Amanda 2", "Amanda 4", "Amanda 5", "Ângulo", "Boa Esperança", "Bom Repouso", "Brasil", "Carmem Cristina", "Colinas", "Conquista", "Esmeralda", "Fátima 1", "Figueiras", "Guedes", "Horto", "Interlagos", "Maria de Lourdes", "Mirante", "Nova América", "Nova Europa", "Nova Hortolândia 1", "Nova Hortolândia 2", "Odimar", "Orestes Ôngaro", "Paviotti", "Perón", "Templo Central"
];

export default function FormularioPage() {
  const [formData, setFormData] = useState({ nome: '', whatsapp: '', congregacao: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsDropdownOpen(false);
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
    
    setFormData({ ...formData, whatsapp: formatted });
  };

  const isFormComplete = formData.nome.length > 3 && formData.whatsapp.replace(/\D/g, '').length >= 10 && formData.congregacao !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormComplete) return;
    setStatus('loading');

    try {
      const { error } = await supabase.from('cadastros').insert([{
        nome: formData.nome,
        whatsapp: formData.whatsapp,
        congregacao: formData.congregacao
      }]);

      if (error) throw error;

      const primeiroNome = formData.nome.split(' ')[0];
      const cleanPhone = formData.whatsapp.replace(/\D/g, '');
      
      const mensagem = `*CONGRESSO MPG 2026*\n━━━━━━━━━━━━━━━━━━━━━━━\nOlá, *${primeiroNome}*! 🙏\n\nRecebemos os seus dados com sucesso.\n\nSua congregação: *${formData.congregacao}*\n\nEm breve enviaremos mais novidades sobre o nosso Congresso. Fique ligado! 🔥🚀`;

      await fetch('/api/whatsapp', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ phone: cleanPhone, message: mensagem }) 
      });

      setStatus('success');
    } catch (err) {
      alert("Ocorreu um erro ao salvar seu cadastro. Tente novamente.");
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 py-16 md:py-4 relative overflow-x-hidden font-sans">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-[-10%] -left-[-10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-[#3c5491] rounded-full mix-blend-screen filter blur-[150px] md:blur-[200px] opacity-30 animate-pulse pointer-events-none" />

      <div className="w-full max-w-lg relative z-10 my-auto pb-20 md:pb-0">
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-2">
            MPG <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b1bbe8] to-[#3c5491]">2026</span>
          </h1>
          <p className="text-gray-400 font-medium tracking-wide uppercase text-xs md:text-sm">Cadastro Oficial</p>
        </div>

        {status === 'success' ? (
          <div className="bg-[#0a0a0a] border border-emerald-500/20 p-10 md:p-12 rounded-[2rem] md:rounded-[3rem] shadow-2xl text-center animate-in zoom-in duration-500">
            <CheckCircle2 size={80} className="mx-auto text-emerald-500 mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            <h3 className="text-3xl font-black text-white mb-4 tracking-tight">CADASTRADO!</h3>
            <p className="text-gray-400 font-medium mb-8 text-sm md:text-base">Seus dados foram salvos. Cheque seu WhatsApp para confirmar o recebimento.</p>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/10">
              Fazer Novo Cadastro
            </button>
          </div>
        ) : (
          <div className="bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 ml-2">Nome Completo</label>
                <input type="text" required placeholder="Digite seu nome" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 md:py-5 text-white focus:outline-none focus:border-[#b1bbe8] transition-all placeholder:text-gray-600" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 ml-2">WhatsApp</label>
                <input type="tel" required placeholder="(19) 99999-9999" value={formData.whatsapp} onChange={handlePhoneChange} maxLength={15} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 md:py-5 text-white focus:outline-none focus:border-[#b1bbe8] transition-all placeholder:text-gray-600" />
              </div>

              <div className="space-y-2 relative" ref={dropdownRef}>
                <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 ml-2">Sua Congregação</label>
                <div onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`w-full bg-white/5 border ${isDropdownOpen ? 'border-[#b1bbe8]' : 'border-white/10'} rounded-2xl px-5 py-4 md:py-5 text-white flex justify-between items-center cursor-pointer transition-all`}>
                  <span className={formData.congregacao ? 'text-white' : 'text-gray-600'}>{formData.congregacao || 'Selecione uma opção'}</span>
                  <ChevronDown className={`text-gray-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} size={20} />
                </div>
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-[#111] border border-white/10 rounded-2xl shadow-2xl max-h-[45vh] md:max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-200 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
                    <div className="px-5 py-4 hover:bg-white/5 cursor-pointer text-gray-500 text-sm font-medium transition-colors border-b border-white/5" onClick={() => { setFormData({ ...formData, congregacao: '' }); setIsDropdownOpen(false); }}>Limpar seleção</div>
                    {CONGREGACOES.map((cong) => (
                      <div key={cong} className={`px-5 py-4 hover:bg-white/5 cursor-pointer transition-colors text-sm md:text-base ${formData.congregacao === cong ? 'bg-[#3c5491]/20 text-[#b1bbe8] font-black' : 'text-gray-300 font-medium'}`} onClick={() => { setFormData({ ...formData, congregacao: cong }); setIsDropdownOpen(false); }}>{cong}</div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={!isFormComplete || status === 'loading'} className="w-full bg-white text-[#050505] py-5 rounded-2xl font-black text-lg hover:bg-[#b1bbe8] transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed mt-4 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-[1.02]">
                {status === 'loading' ? <Loader2 size={24} className="animate-spin" /> : <><Send size={20} /> Enviar Cadastro</>}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}