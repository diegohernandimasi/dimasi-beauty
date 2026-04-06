export type Category = "manicura" | "peluqueria";

export interface Service {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category: Category;
  color?: string;
}

export interface Professional {
  id: string;
  name: string;
  specialties: Category[];
  phone: string;
  workingHours: {
    [day: string]: { start: string; end: string } | null;
  };
}

export interface User {
  uid: string;
  name: string;
  whatsapp: string;
  email?: string;
  role: "admin" | "client";
  preferences?: string;
  verified: boolean;
  createdAt: any;
}

export interface Appointment {
  id: string;
  clientId: string;
  clientName: string;
  clientWhatsapp: string;
  serviceId: string;
  serviceName: string;
  professionalId?: string;
  professionalName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: "confirmed" | "cancelled" | "completed";
  price: number;
  location: "salon" | "home";
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
}
