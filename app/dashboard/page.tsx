"use client";
import { Typography } from "@mui/material";
import Chart from "../components/Chart";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// 결제 내역 타입
type Payment = {
  paymentCode: string; //결제코드
  mchtCode: string;
  status: "SUCCESS" | "FAILED" | "CANCELLED"; //결제상태
  amount: string; //결제금액
  paymentAt: string; //결제알시
};

// 가맹점 목록 타입
type Merchant = {
  mchtCode: string; //가맹점코드
  mchtName: string; //가맹점이름
  status: string; //가맹점상태
  bizType: string; //업종타입
};

// 날짜 포맷 함수
function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export default function DashboardPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [failedCount, setFailedCount] = useState(0); // 결제 실패 건수 상태
  const [successCount, setSuccessCount] = useState(0); // 성공 건수
  const [cancelledCount, setCancelledCount] = useState(0); // 환불 건수
  const [totalCount, setTotalCount] = useState(0); //총 거래건수 상태
  const [totalRevenue, setTotalRevenue] = useState(0); // 총 매출액
  const [merchantCount, setMerchantCount] = useState(0); // 가맹점 목록
  const [merchants, setMerchants] = useState<Merchant[]>([]); // 가맹점 리스트
  const [merchantSort, setMerchantSort] = useState<"high" | "low">("high"); // 정렬 기준
  const router = useRouter(); // 라우터

  // API에서 결제 내역 가져오기
  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch(
          "https://recruit.paysbypays.com/api/v1/payments/list"
        );
        const data = await res.json();
        setPayments(data.data);

        // 총 거래건수
        setTotalCount(data.data.length);

        // 총 매출액 (성공한 결제만 합산)
        const paymentsData: Payment[] = data.data;
        const total = paymentsData
          .filter((payment) => payment.status === "SUCCESS")
          .reduce((sum, payment) => sum + Number(payment.amount), 0);

        setTotalRevenue(total);

        // 결제 실패 건수
        const failed = data.data.filter(
          (payment: Payment) => payment.status === "FAILED"
        ).length;
        setFailedCount(failed);

        // 결제 성공 건수
        const success = data.data.filter(
          (payment: Payment) => payment.status === "SUCCESS"
        ).length;
        setSuccessCount(success);

        // 환불 건수
        const cancelled = data.data.filter(
          (payment: Payment) => payment.status === "CANCELLED"
        ).length;
        setCancelledCount(cancelled);
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      }
    }

    // API에서 가맹점 목록 가져오기
    async function fetchMerchants() {
      try {
        const res = await fetch(
          "https://recruit.paysbypays.com/api/v1/merchants/list"
        );
        const data = await res.json();

        const merchants: Merchant[] = data.data;

        // 전체 가맹점 수
        setMerchantCount(merchants.length);
        // 가맹점 리스트 저장
        setMerchants(merchants);
      } catch (error) {
        console.error("Failed to fetch merchants:", error);
      }
    }
    fetchPayments();
    fetchMerchants();
  }, []);

  // 최근 거래 내역 — 최신순 정렬
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.paymentAt).getTime() - new Date(a.paymentAt).getTime()
  );

  //  가맹점별 매출액 계산 (SUCCESS만 합산)
  const revenueByMerchant: Record<string, number> = {};
  payments.forEach((p) => {
    if (p.status !== "SUCCESS") return;
    const key = p.mchtCode;
    revenueByMerchant[key] = (revenueByMerchant[key] ?? 0) + Number(p.amount);
  });

  // 가맹점 + 매출액 합쳐진 타입
  type MerchantWithRevenue = Merchant & { revenue: number };

  const merchantsWithRevenue: MerchantWithRevenue[] = merchants.map((m) => ({
    ...m,
    revenue: revenueByMerchant[m.mchtCode] ?? 0,
  }));

  // 셀렉트 값에 따라 정렬 (매출액 높은순 / 낮은순)
  const sortedMerchantList = [...merchantsWithRevenue].sort((a, b) =>
    merchantSort === "high" ? b.revenue - a.revenue : a.revenue - b.revenue
  );

  // 결제성공 / 결제실패 / 환불 클릭시 상태넘김
  const handleStatusRoute = (status: Payment["status"]) => {
  router.push(`/transactions?status=${status}`);
};

  return (
    // 전체 wrap
    <div className="space-y-6">
      {/* 페이지 타이틀 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-[500]">
          대시보드
        </h1>
      </div>

      {/* 상단 - 카드 3개 */}
      <div className="flex gap-6">
        {/* 총 매출액 카드 */}
        <div className="flex-1 rounded-3xl bg-white py-4 px-10 shadow-md">
          <div
            className="cardContent cursor-pointer"
            onClick={() => router.push("/transactions")}
          >
            <Typography variant="h6">
              총 매출액
            </Typography>
            <p className="mt-1 flex items-center gap-1 text-3xl font-bold text-[#4381ff]">
              {totalRevenue.toLocaleString()}
              <span className="text-base font-normal text-gray-600">원</span>
              <img src="/images/angle.png" alt="angle" className="opacity-60"/>
            </p>
          </div>
        </div>
        {/* 총 거래건수 카드 */}
        <div
          className="flex-1 rounded-3xl bg-white py-4 px-10 shadow-md cursor-pointer"
          onClick={() => router.push("/transactions")}
        >
          <div className="cardContent">
            <Typography variant="h6">
              총 거래건수
            </Typography>
            <p className="mt-1 flex items-center gap-1 text-3xl font-bold text-[#4381ff]">
              {totalCount}
              <span className="text-base font-normal text-gray-600">건</span>
              <img src="/images/angle.png" alt="angle" className="opacity-60"/>
            </p>
          </div>
        </div>
        {/* 전체 가맹점수 카드 */}
        <div className="flex-1 rounded-3xl bg-white py-4 px-10 shadow-md">
          <div className="cardContent">
            <Typography variant="h6">
              전체 가맹점수
            </Typography>
            <p className="mt-1 flex items-center gap-1 text-3xl font-bold text-[#4381ff]">
              {merchantCount}
              <span className="text-base font-normal text-gray-600">개</span>
              <img src="/images/angle.png" alt="angle" className="opacity-60"/>
            </p>
          </div>
        </div>
      </div>

      {/* 메인 */}
      <div className="flex gap-6">
        <div className="flex-[1.15] flex flex-col gap-6 col-span-2">
          {/* 결제성공률 차트 */}
          <Chart />
          {/* 결제 상태별 건수 */}
          <div className="rounded-3xl bg-white py-6 px-8 shadow-md flex justify-around">
            {/* 성공건수 */}
            <div className="cardContent" onClick={()=> handleStatusRoute("SUCCESS")}>
              <Typography variant="subtitle1" className="text-gray-600">
                결제성공
              </Typography>
              <p className="mt-2 flex items-center gap-1 text-2xl font-bold text-[#4381ff] cursor-pointer">
                {successCount}
                <span className="text-sm font-normal text-gray-600">건</span>
                <img src="/images/angle.png" alt="angle" className="w-5 opacity-60"/>
              </p>
            </div>
            {/* 라인 */}
            <div className="w-[1px] h-full bg-[#ccc]"></div>
            {/* 실패건수 */}
            <div className="cardContent" onClick={()=> handleStatusRoute("FAILED")}>
              <Typography variant="subtitle1" className="text-gray-600">
                결제실패
              </Typography>
              <p className="mt-2 flex items-center gap-1 text-2xl font-bold text-[#FF3C73] cursor-pointer">
                {failedCount}
                <span className="text-sm font-normal text-gray-600">건</span>
                <img src="/images/angle.png" alt="angle" className="w-5 opacity-60"/>
              </p>
            </div>
            {/* 라인 */}
            <div className="w-[1px] h-full bg-[#ccc]"></div>
            {/* 환불건수 */}
            <div className="cardContent" onClick={()=> handleStatusRoute("CANCELLED")}>
              <Typography variant="subtitle1" className="text-gray-600">
                환불
              </Typography>
              <p className="mt-2 flex items-center gap-1 text-2xl font-bold text-[#5a5a5a] cursor-pointer">
                {cancelledCount}
                <span className="text-sm font-normal text-gray-600">건</span>
                <img src="/images/angle.png" alt="angle" className="w-5 opacity-60"/>
              </p>
            </div>
          </div>
        </div>

        {/* 최근거래 내역 */}
        <div className="flex-1 flex flex-col rounded-3xl bg-white py-6 px-8 shadow-md">
          <div className="cardContent">
            {/* 타이틀 */}
            <Typography variant="h6">
              최근 거래내역
            </Typography>
            {/* 리스트 감싸는 영역 : 스크롤 */}
            <div className="mt-4 flex-1 overflow-y-auto pr-2 max-h-[550px]">
              <ul>
                {sortedPayments.map((item) => (
                  <li
                    key={item.paymentCode}
                    className="flex justify-between items-center py-3 border-b border-gray-200"
                  >
                    {/* 왼쪽: 코드 + 날짜 + 상태 */}
                    <div>
                      <p className="font-semibold text-gray-800">
                        {item.paymentCode}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(item.paymentAt)}
                      </p>
                      <p className="text-xs text-gray-500">
                        상태: {item.status}
                      </p>
                    </div>

                    {/* 오른쪽: 금액 */}
                    <p
                      className={`text-base font-bold ${
                        item.status === "SUCCESS"
                          ? "text-[#4381ff]"
                          : item.status === "FAILED"
                          ? "text-[#FF3C73]"
                          : "text-[#5a5a5a]"
                      }`}
                    >
                      {Number(item.amount).toLocaleString()}원
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 가맹점리스트 (매출액 높은순) */}
        <div className="flex-1 flex flex-col rounded-3xl bg-white py-6 px-8 shadow-md">
          {/* 타이틀 , 필터링 박스 */}
          <div className="flex justify-between items-center">
            <Typography variant="h6">
              가맹점 리스트
            </Typography>

            {/* 매출액 높은순 / 낮은순 필터링 */}
            <select
              value={merchantSort}
              onChange={(e) =>
                setMerchantSort(e.target.value as "high" | "low")
              }
              className="border border-gray-300 rounded-md px-2 py-1 text-sm cursor-pointer"
            >
              <option value="high">매출액 높은순</option>
              <option value="low">매출액 낮은순</option>
            </select>
          </div>

          {/* 리스트 + 스크롤 영역 */}
          <div className="mt-4 flex-1 overflow-y-auto pr-2 max-h-[550px]">
            <ul>
              {sortedMerchantList.map((m) => (
                <li
                  key={m.mchtCode}
                  className="flex justify_between items-center py-3 border-b border-gray-200"
                >
                  {/* 왼쪽: 이름 / 코드 / 업종 / 상태 */}
                  <div>
                    <p className="font-semibold text-gray-800">{m.mchtName}</p>
                    <p className="text-xs text-gray-500">
                      코드: {m.mchtCode} · 업종: {m.bizType}
                    </p>
                    <p className="text-xs mt-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${
                          m.status === "ACTIVE"
                            ? "bg-[#E6F0FF] text-[#4381ff]"
                            : m.status === "INACTIVE" || m.status === "CLOSED"
                            ? "bg-[#FFE4EA] text-[#FF3C73]"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {m.status}
                      </span>
                    </p>
                  </div>

                  {/* 오른쪽: 매출액 */}
                  <p className="text-base font-semibold text-[#4381ff] ml-auto">
                    {m.revenue.toLocaleString()}원
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
