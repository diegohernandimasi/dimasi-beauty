import { 
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, serverTimestamp, onSnapshot 
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { Appointment } from "../types";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const appointmentService = {
  async create(appointment: Omit<Appointment, "id">) {
    const path = 'appointments';
    try {
      const docRef = await addDoc(collection(db, path), {
        ...appointment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  async update(id: string, data: Partial<Appointment>) {
    const path = `appointments/${id}`;
    try {
      await updateDoc(doc(db, "appointments", id), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  async getById(id: string) {
    const path = `appointments/${id}`;
    try {
      const docSnap = await getDoc(doc(db, "appointments", id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Appointment;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  subscribeToUserAppointments(userId: string, callback: (appointments: Appointment[]) => void) {
    const path = 'appointments';
    const q = query(
      collection(db, path),
      where("clientId", "==", userId),
      orderBy("date", "desc"),
      orderBy("startTime", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      callback(appointments);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  subscribeToAllAppointments(callback: (appointments: Appointment[]) => void) {
    const path = 'appointments';
    const q = query(collection(db, path), orderBy("date", "desc"), orderBy("startTime", "desc"));

    return onSnapshot(q, (snapshot) => {
      const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      callback(appointments);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }
};
