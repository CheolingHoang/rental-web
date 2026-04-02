import { collection, addDoc, getDocs, Timestamp, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface Equipment {
  id?: string;
  name: string;
  category: string;
  status: 'Rảnh' | 'Đang thuê' | 'Bảo trì';
  serialNumber: string;
  pricePerDay: number;
  createdAt?: any;
}

// Thêm thiết bị mới
export const addEquipment = async (data: Omit<Equipment, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, "equipments"), {
      ...data,
      createdAt: Timestamp.now()
    });
    return { id: docRef.id, error: null };
  } catch (error: any) {
    return { id: null, error: error.message };
  }
};

// Lấy danh sách thiết bị
export const getEquipments = async () => {
  try {
    const q = query(collection(db, "equipments"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const equipments: Equipment[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Equipment));
    return { equipments, error: null };
  } catch (error: any) {
    return { equipments: [], error: error.message };
  }
};