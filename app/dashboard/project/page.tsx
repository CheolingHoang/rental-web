"use client";

import { useState, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Users, FolderOpen, Loader2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ProjectCustomerListPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const snap = await getDocs(collection(db, "customers"));
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCustomers(list);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Users className="w-6 h-6 text-indigo-500" /> Chọn Khách Hàng</h1>
        <p className="text-sm text-zinc-500 mt-1">Vui lòng chọn một khách hàng để xem hoặc tạo dự án cho họ.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((customer) => (
          <Link href={`/dashboard/project/${customer.id}`} key={customer.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/50 transition-all group flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-lg">
                {customer.name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-white font-medium group-hover:text-indigo-400 transition-colors">{customer.name}</h3>
                <p className="text-xs text-zinc-500">{customer.phone || "Chưa có SĐT"}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-indigo-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}