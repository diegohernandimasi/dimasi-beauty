import { useState, useEffect } from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";
import { db } from "../firebase";
import { appointmentService } from "../services/appointmentService";
import { collection, query, getDocs, doc, updateDoc, addDoc, deleteDoc, orderBy, limit } from "firebase/firestore";
import { Appointment, Service, Professional, User } from "../types";
import { INITIAL_SERVICES, INITIAL_PROFESSIONALS } from "../constants";
import { formatCurrency, cn } from "../lib/utils";
import { format, parseISO, startOfToday, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { 
  LayoutDashboard, Calendar, Scissors, Users, Settings, 
  Search, Filter, CheckCircle2, XCircle, Clock, 
  Plus, Trash2, Edit3, MessageCircle, MoreVertical
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";

export default function Admin() {
  const location = useLocation();
  
  const navItems = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
    { name: "Agenda", path: "/admin/agenda", icon: Calendar },
    { name: "Servicios", path: "/admin/services", icon: Scissors },
    { name: "Equipo", path: "/admin/team", icon: Users },
    { name: "Configuración", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 space-y-2">
        <div className="p-4 bg-neutral-900 rounded-2xl text-white mb-6">
          <h2 className="font-bold text-lg">Panel Admin</h2>
          <p className="text-neutral-400 text-xs uppercase tracking-widest font-bold mt-1">DIMASI.BEAUTY</p>
        </div>
        
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all",
                  isActive ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Admin Content */}
      <main className="flex-1 min-w-0">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="agenda" element={<Agenda />} />
          <Route path="services" element={<ServicesAdmin />} />
          <Route path="team" element={<TeamAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
        </Routes>
      </main>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, revenue: 0 });
  const [recent, setRecent] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const q = query(collection(db, "appointments"), orderBy("createdAt", "desc"), limit(50));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        
        const total = data.length;
        const pending = data.filter(a => a.status === "confirmed").length;
        const completed = data.filter(a => a.status === "completed").length;
        const revenue = data.filter(a => a.status === "completed").reduce((acc, curr) => acc + curr.price, 0);
        
        setStats({ total, pending, completed, revenue });
        setRecent(data.slice(0, 5));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="p-12 text-center text-neutral-400">Cargando estadísticas...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Turnos", value: stats.total, icon: Calendar, color: "bg-blue-500" },
          { label: "Pendientes", value: stats.pending, icon: Clock, color: "bg-amber-500" },
          { label: "Completados", value: stats.completed, icon: CheckCircle2, color: "bg-green-500" },
          { label: "Ingresos", value: formatCurrency(stats.revenue), icon: Scissors, color: "bg-pink-500" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm space-y-2">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-bold text-neutral-900">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
          <h3 className="font-bold text-lg text-neutral-900">Turnos Recientes</h3>
          <Link to="/admin/agenda" className="text-pink-500 text-sm font-bold hover:underline">Ver todos</Link>
        </div>
        <div className="divide-y divide-neutral-100">
          {recent.map(app => (
            <div key={app.id} className="p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-500 font-bold">
                  {app.clientName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900">{app.clientName}</h4>
                  <p className="text-neutral-500 text-xs">{app.serviceName} • {app.startTime} hs</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                  app.status === "confirmed" ? "bg-amber-100 text-amber-700" :
                  app.status === "completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {app.status}
                </span>
                <p className="text-neutral-400 text-[10px]">{format(parseISO(app.date), "dd/MM/yyyy")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Agenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = appointmentService.subscribeToAllAppointments((data) => {
      setAppointments(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, "appointments", id), { status, updatedAt: new Date().toISOString() });
      setAppointments(appointments.map(a => a.id === id ? { ...a, status: status as any } : a));
      toast.success(`Turno marcado como ${status}`);
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar estado.");
    }
  };

  const filtered = appointments.filter(a => filter === "all" || a.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-neutral-900">Agenda de Turnos</h2>
        <div className="flex p-1 bg-neutral-100 rounded-xl">
          {["all", "confirmed", "completed", "cancelled"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                filter === f ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              {f === "all" ? "Todos" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Cliente</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Servicio</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Fecha/Hora</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Estado</th>
                <th className="p-4 text-xs font-bold text-neutral-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map(app => (
                <tr key={app.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-neutral-900">{app.clientName}</div>
                    <div className="text-xs text-neutral-400 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" /> {app.clientWhatsapp}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-neutral-700">{app.serviceName}</div>
                    <div className="text-xs text-neutral-400">{formatCurrency(app.price)}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-neutral-700">{format(parseISO(app.date), "dd/MM/yy")}</div>
                    <div className="text-xs text-neutral-400">{app.startTime} hs</div>
                  </td>
                  <td className="p-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                      app.status === "confirmed" ? "bg-amber-100 text-amber-700" :
                      app.status === "completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {app.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      {app.status === "confirmed" && (
                        <>
                          <button
                            onClick={() => updateStatus(app.id, "completed")}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                            title="Completar"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(app.id, "cancelled")}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            title="Cancelar"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-12 text-center text-neutral-400">No hay turnos para mostrar.</div>
        )}
      </div>
    </div>
  );
}

function ServicesAdmin() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const snapshot = await getDocs(collection(db, "services"));
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        setServices(data.length > 0 ? data : INITIAL_SERVICES);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-900">Servicios</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-all">
          <Plus className="w-4 h-4" /> Nuevo Servicio
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-3 h-3 rounded-full",
                  s.category === "peluqueria" ? "bg-pink-500" : "bg-blue-500"
                )} />
                <h3 className="font-bold text-neutral-900">{s.name}</h3>
              </div>
              <p className="text-neutral-500 text-xs">{s.description}</p>
              <div className="flex items-center gap-4 text-xs font-bold text-neutral-400">
                <span>{s.durationMinutes} min</span>
                <span>{formatCurrency(s.price)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 text-neutral-400 hover:text-neutral-900"><Edit3 className="w-4 h-4" /></button>
              <button className="p-2 text-neutral-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamAdmin() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-neutral-900">Equipo Profesional</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-all">
          <Plus className="w-4 h-4" /> Añadir Profesional
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {INITIAL_PROFESSIONALS.map(p => (
          <div key={p.id} className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm text-center space-y-4">
            <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-500 font-bold text-2xl mx-auto">
              {p.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-xl text-neutral-900">{p.name}</h3>
              <p className="text-pink-500 text-sm font-bold uppercase tracking-wider">{p.specialties.join(", ")}</p>
            </div>
            <div className="flex justify-center gap-4">
              <button className="px-4 py-2 bg-neutral-50 text-neutral-600 text-xs font-bold rounded-lg hover:bg-neutral-100">Horarios</button>
              <button className="px-4 py-2 bg-neutral-50 text-neutral-600 text-xs font-bold rounded-lg hover:bg-neutral-100">Editar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsAdmin() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-neutral-900">Configuración</h2>
      
      <div className="grid grid-cols-1 gap-8">
        <section className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
          <h3 className="font-bold text-lg text-neutral-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-500" />
            Recordatorios de WhatsApp
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-neutral-700">Envío Automático</p>
                <p className="text-neutral-500 text-sm">Enviar recordatorio el día anterior a las 10:00 AM</p>
              </div>
              <div className="w-12 h-6 bg-pink-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase">Mensaje de Plantilla</label>
              <textarea 
                className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm min-h-[120px]"
                defaultValue="Hola {client_name}, te recordamos tu turno en DIMASI.BEAUTY:
Servicio: {service}
Fecha: {date}
Hora: {time} hs
¡Te esperamos!"
              />
            </div>
          </div>
        </section>

        <section className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm space-y-6">
          <h3 className="font-bold text-lg text-neutral-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-neutral-400" />
            Políticas de Reserva
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase">Cancelación Anticipada (horas)</label>
              <input type="number" defaultValue={24} className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase">Tiempo de Preparación (min)</label>
              <input type="number" defaultValue={15} className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
