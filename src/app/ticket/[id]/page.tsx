"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Package, Calendar, MapPin, Loader2, QrCode } from 'lucide-react';

export default function TicketPage() {
  const { id } = useParams();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      const { data } = await supabase.from('pedidos').select('*, itens_pedido(*)').eq('id', id).single();
      if (data) setPedido(data);
      setLoading(false);
    };
    fetchTicket();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-[#3c5491]" size={48} /></div>;
  
  if (!pedido) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center font-black text-2xl">Ticket inválido ou não encontrado.</div>;

  const orderIdVisual = pedido.id.split('-')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#3c5491] opacity-20 blur-[150px]" />
      
      <div className="w-full max-w-sm bg-[#0a0a0a] rounded-[2rem] border border-white/10 shadow-2xl relative z-10 overflow-hidden flex flex-col">
        <div className="bg-[#3c5491] p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          <CheckCircle2 size={48} className="mx-auto text-white mb-4 drop-shadow-lg" />
          <h1 className="text-3xl font-black text-white tracking-tighter">TICKET OFICIAL</h1>
          <p className="text-white/80 font-medium text-sm mt-1 uppercase tracking-widest">Congresso MPG 2026</p>
        </div>

        <div className="p-8 flex flex-col items-center border-b border-white/5 border-dashed">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-4">Apresente este QR Code</p>
          <div className="bg-white p-4 rounded-3xl shadow-xl">
             <img src={`https://quickchart.io/qr?text=${pedido.id}&size=200&margin=1`} alt="QR" className="w-48 h-48 rounded-xl" />
          </div>
          <p className="font-black text-2xl tracking-widest mt-6 text-[#b1bbe8]">#{orderIdVisual}</p>
        </div>

        <div className="p-8 bg-[#050505] space-y-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-1">Titular</p>
            <p className="font-black text-lg">{pedido.nome_completo}</p>
            <p className="text-sm text-gray-400 font-medium">{pedido.congregacao}</p>
          </div>
          
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-3 flex items-center gap-2"><Package size={14}/> Itens Reservados</p>
            <div className="space-y-3">
              {pedido.itens_pedido.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="font-black text-white text-sm">{item.quantidade}x Peça</span>
                  <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded text-[#b1bbe8] uppercase">{item.tamanho.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-emerald-500/10 p-6 text-center border-t border-emerald-500/20">
          <p className="font-black text-emerald-400 flex items-center justify-center gap-2">
            {pedido.status === 'entregue' ? 'ENTREGUE' : 'PAGAMENTO CONFIRMADO'}
          </p>
        </div>
      </div>
    </div>
  );
}