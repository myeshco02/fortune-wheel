import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  updateDoc,
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

const getCrypto = () => {
  if (typeof crypto !== "undefined") {
    return crypto;
  }
  if (typeof window !== "undefined" && window.crypto) {
    return window.crypto;
  }
  throw new Error("Crypto API is not available in this environment.");
};

const generateEditKey = () => {
  const cryptoApi = getCrypto();
  if (typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID().replace(/-/g, "");
  }
  const array = new Uint8Array(16);
  cryptoApi.getRandomValues(array);
  return Array.from(array)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
};

const toHexString = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");

const hashEditKey = async (editKey) => {
  const cryptoApi = getCrypto();
  if (!cryptoApi.subtle) {
    throw new Error("Crypto API does not support hashing in this environment.");
  }
  const encoded = new TextEncoder().encode(editKey);
  const hashBuffer = await cryptoApi.subtle.digest("SHA-256", encoded);
  return toHexString(hashBuffer);
};

const sanitizeSlices = (slices = []) =>
  slices.map((slice) => ({
    label: slice.label.trim(),
    color: slice.color,
    id: slice.id,
  }));

const validateEditAccess = async (wheelId, editKey) => {
  const documentRef = doc(db, "wheels", wheelId);
  const snapshot = await getDoc(documentRef);

  if (!snapshot.exists()) {
    const error = new Error("NOT_FOUND");
    error.code = "NOT_FOUND";
    throw error;
  }

  const data = snapshot.data();
  if (!data?.editKeyHash) {
    const error = new Error("EDIT_KEY_MISSING");
    error.code = "EDIT_KEY_MISSING";
    throw error;
  }

  const providedHash = await hashEditKey(editKey);
  if (providedHash !== data.editKeyHash) {
    const error = new Error("INVALID_EDIT_KEY");
    error.code = "INVALID_EDIT_KEY";
    throw error;
  }

  return { snapshot, data };
};

export const createWheel = async ({ title, slices }) => {
  const sanitizedSlices = sanitizeSlices(slices);
  const editKey = generateEditKey();
  const editKeyHash = await hashEditKey(editKey);

  const payload = {
    title: title?.trim() || null,
    slices: sanitizedSlices,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    editKeyHash,
    editKeyCreatedAt: serverTimestamp(),
  };

  const result = await addDoc(wheelsCollection, payload);
  return { id: result.id, editKey };
};

export const getWheel = async (id) => {
  const snapshot = await getDoc(doc(db, "wheels", id));
  if (!snapshot.exists()) {
    return null;
  }

  const { editKeyHash, ...rest } = snapshot.data();
  return { id: snapshot.id, ...rest };
};

export const getWheelForEditing = async (wheelId, editKey) => {
  const { snapshot, data } = await validateEditAccess(wheelId, editKey);
  const { editKeyHash, ...rest } = data;
  return { id: snapshot.id, ...rest };
};

export const updateWheel = async ({ wheelId, editKey, title, slices }) => {
  const { snapshot } = await validateEditAccess(wheelId, editKey);
  const sanitizedSlices = sanitizeSlices(slices);

  await updateDoc(snapshot.ref, {
    title: title?.trim() || null,
    slices: sanitizedSlices,
    updatedAt: serverTimestamp(),
  });

  return { id: snapshot.id, title: title?.trim() || null, slices: sanitizedSlices };
};

export const verifyEditKey = async (wheelId, editKey) => {
  await validateEditAccess(wheelId, editKey);
  return true;
};

export { db };
export default app;
