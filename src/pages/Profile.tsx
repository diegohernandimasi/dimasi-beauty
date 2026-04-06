import { useEffect, useState } from "react";
import { useAuth } from "../App";
import { db, auth } from "../firebase";
import { appointmentService } from "../services/appointmentService";
import { collection, query, where, getDocs, doc, updateDoc, orderBy, serverTimestamp } from "firebase/firestore";
import { Appointment, User } from "../types";
import { formatCurrency, cn } from "../lib/utils";
import { format, isAfter, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { 
  User as UserIcon, MessageCircle, Calendar, Clock, 
  CheckCircle2, XCircle, AlertCircle, LogOut, Save 
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion } from "motion/react";

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [whatsapp, setWhatsapp] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name);
      setWhatsapp(user.whatsapp);
      
      const unsubscribe = appointmentService.subscribeToUserAppointments(user.uid, (data) => {
        setAppointments(data);
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    if (!whatsapp || whatsapp.length < 8) {
      toast.error("Por favor ingresa un número de WhatsApp válido.");
      return;
    }

    try {
      await updateDoc(doc(db, "users", user.uid), {
        name,
        whatsapp,
        verified: true, // Simulated
      });
      toast.success("Perfil actualizado.");
      setEditing(false);
      // The App.tsx listener will update the user state
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el perfil.");
    }
  };

  const cancelAppointment = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que quieres cancelar este turno?")) return;
    try {
      await updateDoc(doc(db, "appointments", id), {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      });
      toast.success("Turno cancelado.");
    } catch (error) {
      console.error(error);
      toast.error("Error al cancelar el turno.");
    }
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-24 space-y-4">
        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-400 mx-auto">
          <UserIcon className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900">Inicia sesión para ver tu perfil</h2>
        <p className="text-neutral-500">Podrás ver tu historial de turnos y gestionar tus datos.</p>
      </div>
    );
  }

  const upcoming = appointments.filter(a => a.status === "confirmed" && isAfter(parseISO(`${a.date}T${a.startTime}`), new Date()));
  const past = appointments.filter(a => a.status !== "confirmed" || !isAfter(parseISO(`${a.date}T${a.startTime}`), new Date()));

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Profile Header */}
      <section className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-xl shadow-neutral-200/50 flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center text-white text-3xl font-bold shrink-0">
          {user.name.charAt(0)}
        </div>
        
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              {editing ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-2xl font-bold text-neutral-900 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 w-full"
                />
              ) : (
                <h1 className="text-3xl font-bold text-neutral-900">{user.name}</h1>
              )}
              <p className="text-neutral-500">{user.email}</p>
            </div>
            <button
              onClick={() => editing ? handleUpdateProfile() : setEditing(true)}
              className={cn(
                "px-6 py-2 rounded-full font-bold transition-all flex items-center justify-center gap-2",
                editing ? "bg-pink-500 text-white hover:bg-pink-600" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              )}
            >
              {editing ? <Save className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
              {editing ? "Guardar" : "Editar Perfil"}
            </button>
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-6">
            <div className="flex items-center gap-2 text-neutral-600">
              <MessageCircle className="w-5 h-5 text-green-500" />
              {editing ? (
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="WhatsApp"
                  className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-sm"
                />
              ) : (
                <span className="font-medium">{user.whatsapp || "Sin WhatsApp"}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-neutral-600">
              <Calendar className="w-5 h-5 text-pink-500" />
              <span className="font-medium">Miembro desde {format(user.createdAt?.toDate ? user.createdAt.toDate() : new Date(user.createdAt), "MMMM yyyy", { locale: es })}</span>
            </div>
          </div>

          {!user.whatsapp && !editing && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              Por favor completa tu número de WhatsApp para recibir recordatorios de turnos.
            </div>
          )}
        </div>
      </section>

      {/* Appointments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Upcoming */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-pink-500" />
            Próximos Turnos
          </h2>
          
          <div className="space-y-4">
            {upcoming.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 rounded-3xl border border-dashed border-neutral-200 text-neutral-500">
                No tienes turnos programados.
              </div>
            ) : (
              upcoming.map(app => (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-neutral-900">{app.serviceName}</h3>
                      <p className="text-neutral-500 text-sm">{app.professionalName || "Cualquier profesional"}</p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">
                      Confirmado
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-neutral-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      {format(parseISO(app.date), "EEEE d 'de' MMMM", { locale: es })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-neutral-400" />
                      {app.startTime} hs
                    </div>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex justify-between items-center">
                    <span className="font-bold text-pink-500">{formatCurrency(app.price)}</span>
                    <button
                      onClick={() => cancelAppointment(app.id)}
                      className="text-xs font-bold text-red-500 hover:underline"
                    >
                      Cancelar Turno
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        {/* History */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-neutral-400" />
            Historial
          </h2>
          
          <div className="space-y-3">
            {past.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 rounded-3xl border border-dashed border-neutral-200 text-neutral-400">
                Historial vacío.
              </div>
            ) : (
              past.map(app => (
                <div
                  key={app.id}
                  className="bg-white p-4 rounded-2xl border border-neutral-100 flex items-center justify-between gap-4 opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-neutral-900 text-sm">{app.serviceName}</h4>
                    <p className="text-neutral-400 text-xs">
                      {format(parseISO(app.date), "dd/MM/yyyy")} • {app.startTime} hs
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {app.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : app.status === "cancelled" ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-neutral-300" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="flex justify-center pt-8">
        <button
          onClick={() => auth.signOut()}
          className="flex items-center gap-2 text-neutral-400 hover:text-red-500 font-bold transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
