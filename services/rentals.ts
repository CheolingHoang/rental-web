// services/rentals.ts
import { collection, addDoc, getDocs, Timestamp, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface RentalOrder {
  id?: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  equipmentSummary: string; // Tóm tắt thiết bị thuê (VD: Sony A7IV + Lens 24-70)
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 'Chờ AI duyệt' | 'Đang hoạt động' | 'Đã thu hồi' | 'Cảnh báo trễ';
  createdAt?: any;
}

// Tạo lệnh thuê mới
export const createRentalOrder = async (data: Omit<RentalOrder, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, "rentals"), {
      ...data,
      createdAt: Timestamp.now()
    });
    return { id: docRef.id, error: null };
  } catch (error: any) {
    return { id: null, error: error.message };
  }
};

// Lấy danh sách lệnh thuê
export const getRentalOrders = async () => {
  try {
    const q = query(collection(db, "rentals"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const rentals: RentalOrder[] = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as RentalOrder));
    return { rentals, error: null };
  } catch (error: any) {
    return { rentals: [], error: error.message };
  }
};