export interface Business {
  id?: string;
  ownerId: string;
  ownerName: string;
  email?: string;
  phone?: string;
  businessName: string;
  businessType: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  ownerId: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  status: 'lead' | 'active' | 'completed';
  totalValue: number;
  notes?: string;
  createdAt: string;
}

export interface FollowUpItem {
  id: string;
  ownerId: string;
  clientName: string;
  clientPhone?: string;
  scheduledDate: string;
  time?: string;
  notes: string;
  type: 'call' | 'meeting' | 'visit' | 'message';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface TaskItem {
  id: string;
  ownerId: string;
  title: string;
  customerName: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  amount?: number;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  ownerId: string;
  customerName: string;
  description: string;
  amount: number;
  status: 'paid' | 'pending';
  date: string;
  createdAt?: string;
}
