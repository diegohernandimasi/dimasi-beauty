import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, createContext, useContext } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { User } from "./types";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import { Toaster } from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isAdmin: false });

export const useAuth = () => useContext(AuthContext);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          // Ensure admin role for the specified email
          if (firebaseUser.email === "diegohernandimasi@gmail.com" && userData.role !== "admin") {
            await updateDoc(doc(db, "users", firebaseUser.uid), { role: "admin" });
            userData.role = "admin";
          }
          setUser(userData);
        } else {
          // New user from Google or other provider
          const role = firebaseUser.email === "diegohernandimasi@gmail.com" ? "admin" : "client";
          const newUser: User = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || "Usuario",
            whatsapp: "",
            email: firebaseUser.email || "",
            role: role as "admin" | "client",
            verified: false,
            createdAt: new Date().toISOString(),
          };
          // If it's the admin, we can save it immediately
          if (role === "admin") {
            await setDoc(doc(db, "users", firebaseUser.uid), newUser);
          }
          setUser(newUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="booking" element={<Booking />} />
            <Route path="login" element={<Login />} />
            <Route path="profile" element={<Profile />} />
            <Route 
              path="admin/*" 
              element={isAdmin ? <Admin /> : <Navigate to="/" replace />} 
            />
          </Route>
        </Routes>
      </Router>
      <Toaster position="top-center" />
    </AuthContext.Provider>
  );
}
