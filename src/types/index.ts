export type OrderType = 'individual' | 'leader';

export interface ProductConfig {
    id: string;
    color: string;
    size: string;
    price: number;
}

export interface CartItem extends ProductConfig {
    quantity: number;
}

export interface OrderPayload {
    fullName: string;
    phone: string;
    congregation: string;
    orderType: OrderType;
    items: CartItem[];
    receiptFile: File | null;
}