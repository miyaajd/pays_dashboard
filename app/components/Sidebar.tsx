"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

// 메뉴더미데이터
const menus = [
  {
    id: 1,
    title: "대시보드",
    icon: "fa-solid fa-chart-area",
    path: "/dashboard",
  },
  {
    id: 2,
    title: "거래내역 조회",
    icon: "fa-solid fa-list",
    path: "/transactions",
  },
  {
    id: 3,
    title: "가맹점 조회",
    icon: "fa-solid fa-shop",
    path: "",
  },
  {
    id: 4,
    title: "정산",
    icon: "fa-solid fa-dollar-sign",
    path: "",
  },
];

export default function Sidebar() {
  const pathname = usePathname(); //지금 경로받아오기
  const router = useRouter();
  return (
    <div className="max-w-65 flex flex-col h-full">
      {/* 로고 */}
      <img
        src="/images/allpays.png"
        alt="logo"
        className="py-12 px-8 w-[80%] cursor-pointer mx-auto"
        onClick={() => router.push("/dashboard")}
      />
      {/* 메뉴 */}
      <ul className="flex flex-col gap-2 px-6 text-[15px]">
        {menus.map((m) => (
          <li
            key={m.id}
            className={`py-3 px-3 rounded-md hover:bg-gray-100 transition ${
              pathname === m.path
                ? "shadow-md bg-gray-100 text-[#4381ff] font-bold"
                : "hover:shadow-md opacity-60 font-semibold"
            }`}
          >
            <Link href={m.path} className="flex items-center gap-3">
              <i className={`${m.icon} text-[18px]`}></i>
              <span className="text-[18px]">{m.title}</span>
            </Link>
          </li>
        ))}
      </ul>
      {/* 하단메뉴 */}
      <ul className="flex px-9 text-[1.7rem] justify-between border-t border-gray-300 py-6 mt-auto">
        <li className="opacity-70 hover:text-[#4381ff] cursor-pointer transition">
          <i className="fa-solid fa-gear"></i>
        </li>
        <li className="opacity-70 hover:text-[#4381ff] cursor-pointer transition">
          <i className="fa-solid fa-headset"></i>
        </li>
        <li className="opacity-70 hover:text-[#4381ff] cursor-pointer transition">
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
        </li>
      </ul>
    </div>
  );
}
