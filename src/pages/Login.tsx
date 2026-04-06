import { useState } from "react";
import { auth, db, googleProvider } from "../firebase";
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { MessageCircle, Mail, Lock, User as UserIcon, LogIn, Chrome } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Nombre demasiado corto"),
  whatsapp: z.string().min(8, "Número de WhatsApp inválido"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  consent: z.boolean().refine(val => val === true, "Debes aceptar recibir mensajes"),
});

export default function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: zodResolver(isRegistering ? registerSchema : loginSchema),
  });

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        // If first time, we need to ask for WhatsApp number
        // For now, we'll just redirect to profile to complete it
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName || "Usuario",
          whatsapp: "",
          email: user.email || "",
          role: "client",
          verified: false,
          createdAt: serverTimestamp(),
        });
        toast.success("¡Bienvenido! Por favor completa tu número de WhatsApp.");
        navigate("/profile");
      } else {
        toast.success("¡Hola de nuevo!");
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al iniciar sesión con Google.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      if (isRegistering) {
        const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
        await setDoc(doc(db, "users", result.user.uid), {
          uid: result.user.uid,
          name: data.name,
          whatsapp: data.whatsapp,
          email: data.email,
          role: "client",
          verified: true, // Simulated verification
          createdAt: serverTimestamp(),
        });
        toast.success("Cuenta creada con éxito.");
      } else {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast.success("¡Hola de nuevo!");
      }
      navigate("/");
    } catch (error: any) {
      console.error("Registration Error:", error);
      if (error.code === "auth/email-already-in-use") {
        toast.error("El email ya está en uso.");
      } else if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        toast.error("Credenciales inválidas.");
      } else if (error.code === "permission-denied") {
        toast.error("Error de permisos en la base de datos.");
      } else {
        toast.error(`Error: ${error.message || "Ocurrió un error."}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-3xl border border-neutral-200 shadow-xl shadow-neutral-200/50"
      >
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">
            {isRegistering ? "Crear Cuenta" : "Bienvenido"}
          </h1>
          <p className="text-neutral-500">
            {isRegistering ? "Únete a DIMASI.BEAUTY" : "Inicia sesión para reservar"}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-neutral-200 rounded-2xl font-bold text-neutral-700 hover:bg-neutral-50 transition-all disabled:opacity-50"
          >
            <Chrome className="w-5 h-5 text-blue-500" />
            Continuar con Google
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-400 font-medium">O con email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isRegistering && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-500 uppercase px-1">Nombre Completo</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      {...register("name")}
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
                      placeholder="Tu nombre"
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 px-1">{errors.name.message as string}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-500 uppercase px-1">WhatsApp</label>
                  <div className="relative">
                    <MessageCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      {...register("whatsapp")}
                      className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
                      placeholder="11 1234-5678"
                    />
                  </div>
                  {errors.whatsapp && <p className="text-xs text-red-500 px-1">{errors.whatsapp.message as string}</p>}
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-500 uppercase px-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  {...register("email")}
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
                  placeholder="tu@email.com"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 px-1">{errors.email.message as string}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-500 uppercase px-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  {...register("password")}
                  type="password"
                  className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-xs text-red-500 px-1">{errors.password.message as string}</p>}
            </div>

            {isRegistering && (
              <div className="flex items-start gap-3 px-1 py-2">
                <input
                  type="checkbox"
                  {...register("consent")}
                  id="consent"
                  className="mt-1 w-4 h-4 text-pink-500 border-neutral-300 rounded focus:ring-pink-500"
                />
                <label htmlFor="consent" className="text-xs text-neutral-500 leading-tight">
                  Acepto recibir recordatorios y confirmaciones de turnos por WhatsApp.
                </label>
                {errors.consent && <p className="text-xs text-red-500">{errors.consent.message as string}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-pink-500/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isRegistering ? <UserIcon className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                  {isRegistering ? "Crear Cuenta" : "Iniciar Sesión"}
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-4">
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm font-bold text-pink-500 hover:underline"
            >
              {isRegistering ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
