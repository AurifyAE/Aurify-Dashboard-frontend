import Image from "next/image";
import DashboardPage from "./dashboard/page";
import Login from "./(auth)/login/page";

export default function Home() {
  return (
    <div>
      {/* <DashboardPage /> */}
      <Login />
    </div>
  );
}
