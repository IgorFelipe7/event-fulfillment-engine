"use client";

import { useState } from 'react';
import { OrderType, OrderPayload, CartItem } from '@/types';
import CartManager from './CartManager';

export default function OrderForm() {
  const [orderType, setOrderType] = useState<OrderType>('individual');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    congregation: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: OrderPayload = {
      ...formData,
      orderType,
      items: cart,
      receiptFile: null, 
    };
    
    console.log("Submitting payload:", payload);
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-white/50">
      <div className="flex justify-center mb-10">
        <div className="bg-brand-light/30 p-1 rounded-full flex gap-2">
          <button 
            type="button"
            onClick={() => setOrderType('individual')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${orderType === 'individual' ? 'bg-brand-dark text-white shadow-md' : 'text-brand-dark hover:bg-white/50'}`}
          >
            Sou Jovem
          </button>
          <button 
            type="button"
            onClick={() => setOrderType('leader')}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${orderType === 'leader' ? 'bg-brand-dark text-white shadow-md' : 'text-brand-dark hover:bg-white/50'}`}
          >
            Sou Líder
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Nome Completo</label>
            <input 
              required
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              type="text" 
              className="w-full px-4 py-3 rounded-xl bg-white/80 border border-brand-light focus:ring-2 focus:ring-brand-blue outline-none transition-all" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Telefone</label>
            <input 
              required
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              type="tel" 
              className="w-full px-4 py-3 rounded-xl bg-white/80 border border-brand-light focus:ring-2 focus:ring-brand-blue outline-none transition-all" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Congregação</label>
          <select 
            required
            name="congregation"
            value={formData.congregation}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-xl bg-white/80 border border-brand-light focus:ring-2 focus:ring-brand-blue outline-none transition-all appearance-none"
          >
            <option value="">Selecione...</option>
            <option value="adelaide">Adelaide</option>
            <option value="templo_central">Templo Central</option>
          </select>
        </div>

        <hr className="border-brand-light/40 my-8" />

        <CartManager 
          orderType={orderType} 
          cart={cart} 
          setCart={setCart} 
        />

        <div className="pt-6">
          <button 
            type="submit" 
            disabled={cart.length === 0}
            className="w-full bg-brand-blue hover:bg-brand-dark text-white font-bold py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prosseguir para Pagamento
          </button>
        </div>
      </form>
    </div>
  );
}