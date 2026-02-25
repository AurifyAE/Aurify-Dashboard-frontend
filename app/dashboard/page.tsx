import React from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import DashboardData from "@/components/dashboard/DashboardData";
import Image from "next/image";


export default function DashboardPage() {
  return (
    <div className="h-screen flex  ">
      <div className="background_image fixed inset-0 -z-1 bg-no-repeat bg-cover">
        <Image
          src={"/images/background.svg"}
          height={1000}
          width={1000}
          alt=""
        />
      </div>
      <Sidebar />
      <div className="flex-1 transition-all duration-300 p-5 overflow-hidden">
        <div className="h-full bg-white rounded-[15px] overflow-hidden flex flex-col">
          <Header />
          <main className="flex-1 p-6 space-y-6">
           
           

            <DashboardData />
          </main>
        </div>
      </div>
    </div>
  );
}
