import { useState } from "react";
import { INITIAL_SERVICES } from "../constants";
import { Category, Service } from "../types";
import { cn, formatCurrency } from "../lib/utils";
import { Scissors, Sparkles, Clock, MapPin, Phone, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Category>("peluqueria");

  const filteredServices = INITIAL_SERVICES.filter(s => s.category === activeTab);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-neutral-900 text-white p-8 md:p-16">
        <div className="relative z-10 max-w-2xl space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-bold tracking-tight leading-tight"
          >
            Tu belleza, <br />
            <span className="text-pink-500">nuestra pasión.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-neutral-400 text-lg md:text-xl"
          >
            Reserva tu turno de forma fácil y rápida para peluquería y manicura en DIMASI.BEAUTY.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-4"
          >
            <Link 
              to="/booking" 
              className="px-8 py-4 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-full transition-all transform hover:scale-105"
            >
              Reservar Ahora
            </Link>
            <a 
              href="https://wa.me/1135031089" 
              target="_blank" 
              rel="noreferrer"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full transition-all flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp
            </a>
          </motion.div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full hidden md:block opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/30 rounded-full blur-[120px]" />
        </div>
      </section>

      {/* Services Section */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-neutral-900">Nuestros Servicios</h2>
            <p className="text-neutral-500">Elige la categoría que prefieras</p>
          </div>

          <div className="flex p-1 bg-neutral-100 rounded-full w-fit">
            <button
              onClick={() => setActiveTab("peluqueria")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                activeTab === "peluqueria" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <Scissors className="w-4 h-4" />
              Peluquería
            </button>
            <button
              onClick={() => setActiveTab("manicura")}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2",
                activeTab === "manicura" ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <Sparkles className="w-4 h-4" />
              Manicura
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="wait">
            {filteredServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className="group bg-white p-6 rounded-3xl border border-neutral-200 hover:border-pink-200 hover:shadow-xl hover:shadow-pink-500/5 transition-all"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-neutral-900 group-hover:text-pink-600 transition-colors">
                      {service.name}
                    </h3>
                    <span className="text-lg font-bold text-neutral-900">
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                  <p className="text-neutral-500 text-sm leading-relaxed">
                    {service.description}
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-1.5 text-neutral-400 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {service.durationMinutes} min
                    </div>
                    <Link 
                      to={`/booking?service=${service.id}`}
                      className="ml-auto text-pink-500 text-sm font-bold hover:underline"
                    >
                      Reservar
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Info Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-neutral-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600 shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-neutral-900">Ubicación</h4>
            <p className="text-neutral-500 text-sm">Calle Falsa 123, Buenos Aires</p>
            <p className="text-pink-500 text-xs font-medium mt-1">También a domicilio</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-neutral-900">Horarios</h4>
            <p className="text-neutral-500 text-sm">Lun - Vie: 09:00 - 19:00</p>
            <p className="text-neutral-500 text-sm">Sáb: 09:00 - 15:00</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-neutral-900">Contacto</h4>
            <p className="text-neutral-500 text-sm">11 3503-1089</p>
            <p className="text-neutral-500 text-sm">mariaagustinadimasi@gmail.com</p>
          </div>
        </div>
      </section>
    </div>
  );
}
