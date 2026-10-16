export interface SaleNotification {
  id: string;
  customerName: string;
  amount: number;
  productName: string;
  method: 'M-Pesa' | 'eMola';
  createdAt: string;
  timeAgo: string;
}

// Notificações fictícias desativadas em conformidade com a Lei de Defesa do Consumidor (Lei n.º 22/2009)
export const NOTIFICATIONS_100: SaleNotification[] = [];
