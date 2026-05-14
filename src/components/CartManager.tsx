"use client";

import { useState } from 'react';
import { OrderType, CartItem } from '@/types';
import { Plus, Trash2 } from 'lucide-react';

interface CartManagerProps {
  orderType: OrderType;
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

export default function CartManager({ orderType, cart, setCart }: CartManagerProps) {
  const [selectedColor, setSelectedColor] = useState('Areia');
  const [selectedSize, setSelectedSize] = useState('M Tradicional');
  const [quantity, setQuantity] = useState(1);

  const calculatePrice = (size: string) => {
    const specialSizes = ['G1', 'G2', 'G3', 'G5'];
    return specialSizes.includes(size) ? 60 : 50;
  };

  const handleAddItem = () => {
    const price = calculatePrice(selectedSize);
    const newItem: CartItem = {
      id: crypto.randomUUID(),
      color: selectedColor,
      size: selectedSize,
      quantity: orderType === 'individual' ? 1 : quantity,
      price,
    };

    if (orderType === 'individual') {
      setCart([newItem]);
    } else {
      setCart(prev => [...prev, newItem]);
    }
  };

  const handleRemoveItem = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-brand-dark">Camisetas</h3>
        {orderType === 'individual' && cart.length > 0 && (
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Selecionada</span>
        )}
      </div>

      {(orderType === 'leader' || cart.length === 0) && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-brand-sand/30 p-4 rounded-xl border border-brand-light/30">
          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-dark uppercase">Cor</label>
            <select 
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-brand-light text-sm outline-none"
            >
              <option value="Areia">Areia</option>
              <option value="Verde">Verde</option>
              <option value="Marrom">Marrom</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-brand-dark uppercase">Tamanho</label>
            <select 
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-brand-light text-sm outline-none"
            >
              <option value="P Tradicional">P Tradicional</option>
              <option value="M Tradicional">M Tradicional</option>
              <option value="G Tradicional">G Tradicional</option>
              <option value="G1">G1 Especial</option>
            </select>
          </div>
          
          {orderType === 'leader' && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark uppercase">Qtd</label>
              <input 
                type="number" 
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white border border-brand-light text-sm outline-none"
              />
            </div>
          )}

          <button 
            type="button"
            onClick={handleAddItem}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-sm text-white transition-all ${orderType === 'individual' ? 'col-span-1 md:col-span-2 bg-brand-blue hover:bg-brand-dark' : 'bg-brand-blue hover:bg-brand-dark'}`}
          >
            <Plus size={16} /> Adicionar
          </button>
        </div>
      )}

      {cart.length > 0 && (
        <div className="bg-white rounded-xl border border-brand-light overflow-hidden">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border-b border-brand-light/30 last:border-0">
              <div>
                <p className="font-bold text-brand-dark text-sm">{item.quantity}x {item.color} - {item.size}</p>
                <p className="text-xs text-brand-blue">R$ {item.price.toFixed(2)} / un</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold text-brand-dark">R$ {(item.price * item.quantity).toFixed(2)}</span>
                <button 
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          <div className="bg-brand-dark p-4 flex justify-between items-center text-white">
            <span className="font-bold uppercase text-sm tracking-wider">Total</span>
            <span className="font-extrabold text-xl">R$ {totalAmount.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}