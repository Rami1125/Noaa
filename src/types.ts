export interface Message {
  id: string;
  sender: string;
  text: string;
  html?: string; // Rich Tailwind-formatted cards populated by Noa
  isNoa: boolean;
  createdAt: string;
  attachment?: {
    name: string;
    type: string;
    size?: string;
    content?: string; // Simulated parsed raw content for the AI to extract
  };
}

export interface InventoryItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  inStock: boolean;
  lastUpdated: string;
}

export interface Customer {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  outstandingBalance: number; // in ₪
}

export interface OrderItem {
  name: string;
  quantity: number;
  unit: string;
  inStock: boolean;
  isSpecialOrder?: boolean;
}

export type OrderStatus = 'ממתין' | 'בטיפול' | 'נשלח' | 'הזמנה מיוחדת';

export interface Order {
  id: string;
  customerName: string;
  items: OrderItem[];
  status: OrderStatus;
  assignedDriver: string | null; // e.g., "היקמת", "עלי", "איציק"
  deliveryAddress: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Driver {
  name: string;
  phone: string;
  truckNumber: string;
  status: 'פנוי' | 'במשלוח' | 'בהפסקה';
  currentOrderId?: string;
}
