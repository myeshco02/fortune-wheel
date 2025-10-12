import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDPvElPY0NlI9rW2KaeAPkAIoKBhYE2wWs",
  authDomain: "fortune-82366.firebaseapp.com",
  projectId: "fortune-82366",
  storageBucket: "fortune-82366.firebasestorage.app",
  messagingSenderId: "880932693445",
  appId: "1:880932693445:web:53720eff94efcda0f0d7ac"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const wheelsCollection = collection(db, "wheels");

export const createWheel = async ({ title, slices }) => {
  const sanitizedSlices = slices.map((slice) => ({
    label: slice.label.trim(),
    color: slice.color,
    id: slice.id,
  }));

  const payload = {
    title: title?.trim() || null,
    slices: sanitizedSlices,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const result = await addDoc(wheelsCollection, payload);
  return result.id;
};

export const getWheel = async (id) => {
  const snapshot = await getDoc(doc(db, "wheels", id));
  if (!snapshot.exists()) {
    return null;
  }
  return { id: snapshot.id, ...snapshot.data() };
};

export { db };
export default app;
