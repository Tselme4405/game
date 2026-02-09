"use client";

import { useRouter } from "next/navigation";
import { useOrder } from "@/app/lib/orderStore";

export default function SplitRole() {
  const router = useRouter();
  const { reset, setRole } = useOrder();

  const go = (role: "teacher" | "student") => {
    reset();
    setRole(role);
    router.push(role === "teacher" ? "/teacher" : "/student");
  };

  return (
    <div className="h-screen w-screen grid md:grid-cols-2">
      {/* Teacher side */}
      <button
        onClick={() => go("teacher")}
        className="relative overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/teacher-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="rounded-2xl bg-white/10 px-10 py-8 backdrop-blur text-white border border-white/20">
            <div className="text-4xl font-extrabold">Багш</div>
            <div className="mt-2 text-white/80">Teacher flow</div>
          </div>
        </div>
      </button>

      {/* Student side */}
      <button
        onClick={() => go("student")}
        className="relative overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/student-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="rounded-2xl bg-white/10 px-10 py-8 backdrop-blur text-white border border-white/20">
            <div className="text-4xl font-extrabold">Сурагч</div>
            <div className="mt-2 text-white/80">Student flow</div>
          </div>
        </div>
      </button>
    </div>
  );
}
