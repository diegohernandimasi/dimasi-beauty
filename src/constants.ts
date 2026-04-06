import { Service, Professional } from "./types";

export const INITIAL_SERVICES: Service[] = [
  {
    id: "corte-dama",
    name: "Corte Dama",
    description: "Corte de cabello para mujer, incluye lavado.",
    durationMinutes: 60,
    price: 3500,
    category: "peluqueria",
    color: "#f472b6",
  },
  {
    id: "peinado",
    name: "Peinado",
    description: "Peinado para eventos o diario.",
    durationMinutes: 45,
    price: 2500,
    category: "peluqueria",
    color: "#fb923c",
  },
  {
    id: "manicura-semi",
    name: "Manicura Semi-permanente",
    description: "Esmaltado semi-permanente con limpieza de cutículas.",
    durationMinutes: 60,
    price: 2200,
    category: "manicura",
    color: "#818cf8",
  },
  {
    id: "pedicura-completa",
    name: "Pedicura Completa",
    description: "Limpieza profunda de pies y esmaltado.",
    durationMinutes: 90,
    price: 3000,
    category: "manicura",
    color: "#2dd4bf",
  },
];

export const INITIAL_PROFESSIONALS: Professional[] = [
  {
    id: "diego",
    name: "Diego",
    specialties: ["peluqueria"],
    phone: "1135031089",
    workingHours: {
      monday: { start: "09:00", end: "19:00" },
      tuesday: { start: "09:00", end: "19:00" },
      wednesday: { start: "09:00", end: "19:00" },
      thursday: { start: "09:00", end: "19:00" },
      friday: { start: "09:00", end: "19:00" },
      saturday: { start: "09:00", end: "15:00" },
      sunday: null,
    },
  },
  {
    id: "sofia",
    name: "Sofia",
    specialties: ["manicura"],
    phone: "1135031089",
    workingHours: {
      monday: { start: "09:00", end: "19:00" },
      tuesday: { start: "09:00", end: "19:00" },
      wednesday: { start: "09:00", end: "19:00" },
      thursday: { start: "09:00", end: "19:00" },
      friday: { start: "09:00", end: "19:00" },
      saturday: { start: "09:00", end: "15:00" },
      sunday: null,
    },
  },
];

export const SALON_INFO = {
  name: "DIMASI.BEAUTY",
  phone: "1135031089",
  whatsapp: "1135031089",
  address: "Calle Falsa 123, Buenos Aires",
};
