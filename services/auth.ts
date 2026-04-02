import { signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

// Lấy Role của User
export const getUserRole = async (uid: string) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().role : 'staff';
  } catch {
    return 'staff';
  }
};

// Đăng nhập bằng Email/Password
export const login = async (email: string, pass: string) => {
  const res = await signInWithEmailAndPassword(auth, email, pass);
  const role = await getUserRole(res.user.uid);
  return { user: res.user, role };
};

// Đăng nhập bằng Google
export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const res = await signInWithPopup(auth, provider);
    const role = await getUserRole(res.user.uid);
    return { user: res.user, role, error: null };
  } catch (error: any) {
    return { user: null, role: null, error: error.message };
  }
};

// Đăng xuất
export const logout = () => signOut(auth);