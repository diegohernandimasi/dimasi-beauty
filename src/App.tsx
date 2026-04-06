import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, createContext, useContext } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
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
    let unsubscribeUser: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubscribeUser) {
        unsubscribeUser();
        unsubscribeUser = null;
      }

      if (firebaseUser) {
        // Listen to user document changes
        const userRef = doc(db, "users", firebaseUser.uid);
        unsubscribeUser = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            // Ensure admin role for the specified email
            if (firebaseUser.email === "mariaagustinadimasi@gmail.com" && userData.role !== "admin") {
              await updateDoc(userRef, { role: "admin" });
              // The next snapshot will have the updated role
            } else {
              setUser(userData);
              setLoading(false);
            }
          } else {
            // New user logic
            const role = firebaseUser.email === "mariaagustinadimasi@gmail.com" ? "admin" : "client";
            const newUser: User = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || "Usuario",
              whatsapp: "",
              email: firebaseUser.email || "",
              role: role as "admin" | "client",
              verified: false,
              createdAt: serverTimestamp(),
            };
            if (role === "admin") {
              await setDoc(userRef, newUser);
            } else {
              // For new clients, we don't set the user state here if they are in the middle of registering
              // Login.tsx will handle the setDoc and App.tsx will pick it up in the next snapshot
              // However, if they log in via Google, we DO want to set it so they can see the profile page
              if (firebaseUser.providerData.some(p => p.providerId === "google.com")) {
                setUser(newUser);
                setLoading(false);
              } else {
                // If they are registering with email, we keep user as null so Login.tsx can finish its work
                // But we MUST set loading to false so Login.tsx can continue its UI flow
                setUser(null);
                setLoading(false);
              }
            }
          }
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
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
