import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { INITIAL_SERVICES, INITIAL_PROFESSIONALS } from "../constants";
import { Category, Service, Professional, Appointment } from "../types";
import { cn, formatCurrency } from "../lib/utils";
import { 
  Scissors, Sparkles, Calendar as CalendarIcon, Clock, 
  ChevronRight, ChevronLeft, MapPin, CheckCircle2, AlertCircle 
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import { es } from "date-fns/locale";
import { format, addDays, isSameDay, isBefore, startOfToday } from "date-fns";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { appointmentService } from "../services/appointmentService";
import { whatsappService } from "../services/whatsappService";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import "react-day-picker/dist/style.css";

type Step = "category" | "service" | "details" | "confirmation";

export default function Booking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<Category | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | null>(null);
  const [location, setLocation] = useState<"salon" | "home">("salon");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);

  // Initial state from URL
  useEffect(() => {
    const serviceId = searchParams.get("service");
    if (serviceId) {
      const foundService = INITIAL_SERVICES.find(s => s.id === serviceId);
      if (foundService) {
        setCategory(foundService.category);
        setService(foundService);
        setStep("details");
      }
    }
  }, [searchParams]);

  // Fetch occupied slots when date or professional changes
  useEffect(() => {
    if (date && service) {
      const fetchOccupiedSlots = async () => {
        const dateStr = format(date, "yyyy-MM-dd");
        let q = query(
          collection(db, "appointments"),
          where("date", "==", dateStr),
          where("status", "==", "confirmed")
        );
        
        if (professional) {
          q = query(q, where("professionalId", "==", professional.id));
        }

        const snapshot = await getDocs(q);
        const slots = snapshot.docs.map(doc => doc.data().startTime);
        setOccupiedSlots(slots);
      };
      fetchOccupiedSlots();
    }
  }, [date, service, professional]);

  const handleBooking = async () => {
    if (!user) {
      toast.error("Debes iniciar sesión para reservar.");
      navigate("/login");
      return;
    }

    if (!user.whatsapp) {
      toast.error("Por favor completa tu número de WhatsApp en tu perfil.");
      navigate("/profile");
      return;
    }

    if (!service || !date || !time) return;

    setLoading(true);
    try {
      const endTime = calculateEndTime(time, service.durationMinutes);
      const appointmentData: Omit<Appointment, "id"> = {
        clientId: user.uid,
        clientName: user.name,
        clientWhatsapp: user.whatsapp,
        serviceId: service.id,
        serviceName: service.name,
        professionalId: professional?.id,
        professionalName: professional?.name,
        date: format(date, "yyyy-MM-dd"),
        startTime: time,
        endTime,
        status: "confirmed",
        price: service.price,
        location,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await appointmentService.create(appointmentData);
      await whatsappService.sendConfirmation(user.name, user.whatsapp, service.name, format(date, "dd/MM/yyyy"), time);

      setStep("confirmation");
      toast.success("¡Turno reservado con éxito!");
    } catch (error) {
      console.error(error);
      toast.error("Error al reservar el turno.");
    } finally {
      setLoading(false);
    }
  };

  const calculateEndTime = (start: string, duration: number) => {
    const [hours, minutes] = start.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`;
  };

  const generateTimeSlots = () => {
    if (!date) return [];
    const slots = [];
    const start = 9; // 9 AM
    const end = 19; // 7 PM
    const interval = 30; // 30 min

    for (let h = start; h < end; h++) {
      for (let m = 0; m < 60; m += interval) {
        const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        slots.push(timeStr);
      }
    }
    return slots;
  };

  const renderStep = () => {
    switch (step) {
      case "category":
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => { setCategory("peluqueria"); setStep("service"); }}
              className="group p-8 bg-white border border-neutral-200 rounded-3xl hover:border-pink-500 hover:shadow-xl transition-all text-center space-y-4"
            >
              <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600 mx-auto group-hover:scale-110 transition-transform">
                <Scissors className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900">Peluquería</h3>
              <p className="text-neutral-500">Cortes, peinados, color y más.</p>
            </button>
            <button
              onClick={() => { setCategory("manicura"); setStep("service"); }}
              className="group p-8 bg-white border border-neutral-200 rounded-3xl hover:border-pink-500 hover:shadow-xl transition-all text-center space-y-4"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto group-hover:scale-110 transition-transform">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-neutral-900">Manicura</h3>
              <p className="text-neutral-500">Uñas, pedicura y esmaltado.</p>
            </button>
          </div>
        );

      case "service":
        return (
          <div className="space-y-6">
            <button onClick={() => setStep("category")} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 font-medium">
              <ChevronLeft className="w-4 h-4" /> Volver
            </button>
            <div className="grid grid-cols-1 gap-4">
              {INITIAL_SERVICES.filter(s => s.category === category).map(s => (
                <button
                  key={s.id}
                  onClick={() => { setService(s); setStep("details"); }}
                  className="flex items-center justify-between p-6 bg-white border border-neutral-200 rounded-2xl hover:border-pink-500 hover:shadow-lg transition-all text-left"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-neutral-900">{s.name}</h4>
                    <p className="text-neutral-500 text-sm">{s.description}</p>
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-xs font-bold text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {s.durationMinutes} min
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-pink-500">{formatCurrency(s.price)}</span>
                    <ChevronRight className="w-5 h-5 text-neutral-300 ml-2 inline" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case "details":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-8">
              <button onClick={() => setStep("service")} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 font-medium">
                <ChevronLeft className="w-4 h-4" /> Volver
              </button>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-pink-500" />
                  Selecciona Fecha
                </h3>
                <div className="bg-white p-4 rounded-3xl border border-neutral-200 shadow-sm">
                  <DayPicker
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={es}
                    disabled={{ before: startOfToday() }}
                    className="mx-auto"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-pink-500" />
                  Lugar del Servicio
                </h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => setLocation("salon")}
                    className={cn(
                      "flex-1 p-4 rounded-2xl border-2 transition-all font-bold",
                      location === "salon" ? "border-pink-500 bg-pink-50 text-pink-700" : "border-neutral-200 bg-white text-neutral-500"
                    )}
                  >
                    En el Salón
                  </button>
                  <button
                    onClick={() => setLocation("home")}
                    className={cn(
                      "flex-1 p-4 rounded-2xl border-2 transition-all font-bold",
                      location === "home" ? "border-pink-500 bg-pink-50 text-pink-700" : "border-neutral-200 bg-white text-neutral-500"
                    )}
                  >
                    A Domicilio
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-pink-500" />
                  Horarios Disponibles
                </h3>
                {!date ? (
                  <div className="p-8 text-center bg-neutral-100 rounded-3xl border border-dashed border-neutral-300 text-neutral-500">
                    Selecciona una fecha primero
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {generateTimeSlots().map(t => {
                      const isOccupied = occupiedSlots.includes(t);
                      return (
                        <button
                          key={t}
                          disabled={isOccupied}
                          onClick={() => setTime(t)}
                          className={cn(
                            "py-3 rounded-xl text-sm font-bold transition-all border",
                            isOccupied ? "bg-neutral-100 text-neutral-300 border-neutral-100 cursor-not-allowed" :
                            time === t ? "bg-pink-500 text-white border-pink-500 shadow-lg shadow-pink-500/20" :
                            "bg-white text-neutral-700 border-neutral-200 hover:border-pink-500"
                          )}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-neutral-900">Notas Adicionales</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Alergias, preferencias o detalles de la dirección..."
                  className="w-full p-4 bg-white border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none min-h-[100px]"
                />
              </div>

              <div className="p-6 bg-neutral-900 rounded-3xl text-white space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Servicio</span>
                  <span className="font-bold">{service?.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Fecha</span>
                  <span className="font-bold">{date ? format(date, "dd/MM/yyyy") : "-"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400">Hora</span>
                  <span className="font-bold">{time || "-"}</span>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-lg">Total</span>
                  <span className="text-2xl font-bold text-pink-500">{service ? formatCurrency(service.price) : "-"}</span>
                </div>
                <button
                  disabled={!date || !time || loading}
                  onClick={handleBooking}
                  className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {loading ? "Reservando..." : "Confirmar Reserva"}
                </button>
              </div>
            </div>
          </div>
        );

      case "confirmation":
        return (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center space-y-6 py-12"
          >
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-neutral-900">¡Turno Confirmado!</h2>
              <p className="text-neutral-500">
                Hemos enviado la confirmación a tu WhatsApp. Te recordaremos el día anterior.
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 text-left space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-500">Servicio:</span>
                <span className="font-bold">{service?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Fecha:</span>
                <span className="font-bold">{date ? format(date, "dd/MM/yyyy") : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Hora:</span>
                <span className="font-bold">{time} hs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Lugar:</span>
                <span className="font-bold">{location === "salon" ? "En el Salón" : "A Domicilio"}</span>
              </div>
            </div>
            <div className="pt-6 flex flex-col gap-3">
              <button
                onClick={() => navigate("/profile")}
                className="w-full py-4 bg-neutral-900 text-white font-bold rounded-2xl hover:bg-neutral-800 transition-all"
              >
                Ver mis turnos
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full py-4 bg-white border border-neutral-200 text-neutral-700 font-bold rounded-2xl hover:bg-neutral-50 transition-all"
              >
                Volver al inicio
              </button>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-12 text-center space-y-2">
        <h1 className="text-4xl font-bold text-neutral-900">Reserva tu Turno</h1>
        <p className="text-neutral-500">Sigue los pasos para agendar tu cita en segundos</p>
      </div>

      {step !== "confirmation" && (
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-4">
            {[
              { id: "category", label: "Categoría" },
              { id: "service", label: "Servicio" },
              { id: "details", label: "Detalles" },
            ].map((s, i) => (
              <div key={s.id} className="flex items-center gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
                    step === s.id ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" : 
                    (i < ["category", "service", "details"].indexOf(step) ? "bg-green-500 text-white" : "bg-neutral-200 text-neutral-500")
                  )}>
                    {i < ["category", "service", "details"].indexOf(step) ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                  </div>
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-wider",
                    step === s.id ? "text-pink-500" : "text-neutral-400"
                  )}>
                    {s.label}
                  </span>
                </div>
                {i < 2 && <div className="w-12 h-[2px] bg-neutral-200 mb-6" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
