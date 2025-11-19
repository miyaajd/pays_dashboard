"use client";

import { useEffect, useMemo, useState } from "react";
import { Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";

// 결제 내역 타입
type Payment = {
  paymentCode: string; // 결제코드
  mchtCode: string; // 가맹점코드
  status: "SUCCESS" | "FAILED" | "CANCELLED"; // 결제상태
  amount: string; // 결제금액
  paymentAt: string; // 결제일시
};

// 가맹점 목록 타입
type Merchant = {
  mchtCode: string; //가맹점코드
  mchtName: string; //가맹점이름
  status: string; //가맹점상태
  bizType: string; //업종타입
};

// 상태 타입
type StatusFilter = "ALL" | "SUCCESS" | "FAILED" | "CANCELLED";

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

export default function TransactionsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);

  const searchParams = useSearchParams();

  //초기 status 값 읽기 (없으면"ALL")
  const initialStatus = (searchParams.get("status") as StatusFilter) || "ALL";

  // 필터 상태
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [merchantFilter, setMerchantFilter] = useState<string>("ALL");
  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // 페이지네이션
  const [page, setPage] = useState(1);
  const pageSize = 7;

  //  URL 쿼리가 변경될 때마다 상태 필터 동기화
  useEffect(() => {
    setStatusFilter(initialStatus);
  }, [initialStatus]);

  // 초기 데이터 로드
  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch(
          "https://recruit.paysbypays.com/api/v1/payments/list"
        );
        const data = await res.json();
        setPayments(data.data);
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      }
    }

    async function fetchMerchants() {
      try {
        const res = await fetch(
          "https://recruit.paysbypays.com/api/v1/merchants/list"
        );
        const data = await res.json();
        setMerchants(data.data);
      } catch (error) {
        console.error("Failed to fetch merchants:", error);
      }
    }

    fetchPayments();
    fetchMerchants();
  }, []);

  // 가맹점 코드 → 이름 매핑
  const merchantMap = useMemo(() => {
    const map: Record<string, Merchant> = {};
    merchants.forEach((m) => {
      map[m.mchtCode] = m;
    });
    return map;
  }, [merchants]);

  // 필터 적용된 거래내역
  const filteredPayments = useMemo(() => {
    // 최신순 정렬 (paymentAt 기준)
    const sorted = [...payments].sort(
      (a, b) =>
        new Date(b.paymentAt).getTime() - new Date(a.paymentAt).getTime()
    );
    return sorted.filter((p) => {
      // 상태 필터
      if (statusFilter !== "ALL" && p.status !== statusFilter) return false;

      // 가맹점 필터
      if (merchantFilter !== "ALL" && p.mchtCode !== merchantFilter)
        return false;

      // 날짜 필터 : 시작일
      if (dateFrom) {
        const from = new Date(dateFrom);
        const t = new Date(p.paymentAt);
        if (t < from) return false;
      }
      // 날짜 필터 : 종료일
      if (dateTo) {
        const to = new Date(dateTo);
        const t = new Date(p.paymentAt);
        // to 날짜의 끝까지 포함시키고 싶으면:
        to.setHours(23, 59, 59, 999);
        if (t > to) return false;
      }

      // 검색 (결제코드 + 가맹점명)
      if (searchText.trim()) {
        const keyword = searchText.trim().toLowerCase();
        const codeMatch = p.paymentCode.toLowerCase().includes(keyword);
        const merchantName = merchantMap[p.mchtCode]?.mchtName ?? "";
        const merchantMatch = merchantName.toLowerCase().includes(keyword);

        if (!codeMatch && !merchantMatch) return false;
      }

      return true;
    });
  }, [
    payments,
    statusFilter,
    merchantFilter,
    dateFrom,
    dateTo,
    searchText,
    merchantMap,
  ]);

  // 요약 데이터 (필터 적용 후 기준)
  const summary = useMemo(() => {
    const totalCount = filteredPayments.length;
    const successCount = filteredPayments.filter(
      (p) => p.status === "SUCCESS"
    ).length;
    const failedCount = filteredPayments.filter(
      (p) => p.status === "FAILED"
    ).length;
    const cancelledCount = filteredPayments.filter(
      (p) => p.status === "CANCELLED"
    ).length;
    const totalRevenue = filteredPayments
      .filter((p) => p.status === "SUCCESS")
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalCount,
      successCount,
      failedCount,
      cancelledCount,
      totalRevenue,
    };
  }, [filteredPayments]);

  // 페이지네이션 적용
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 필터 변경 시 페이지 1로 리셋
  useEffect(() => {
    setPage(1);
  }, [statusFilter, merchantFilter, dateFrom, dateTo, searchText]);

  return (
    <div className="space-y-6">
      {/* 타이틀 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-[500]">거래 내역 조회</h1>
      </div>

      {/* 상단 요약 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white py-4 px-8 shadow-md">
          <Typography variant="h6">총 거래건수</Typography>
          <p className="mt-1 flex items-center gap-1 text-3xl font-bold text-[#4381ff]">
            {summary.totalCount.toLocaleString()}
            <span className="text-base font-normal text-gray-600">건</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white py-4 px-8 shadow-md">
          <Typography variant="h6">성공</Typography>
          <p className="mt-1 flex items-center gap-1 text-3xl font-bold text-[#4381ff]">
            {summary.successCount.toLocaleString()}
            <span className="text-base font-normal text-gray-600">건</span>
          </p>
        </div>
        <div className="rounded-2xl bg-white py-4 px-8 shadow-md">
          <Typography variant="h6">실패 / 환불</Typography>
          <p className="mt-2 text-lg font-semibold">
            <span className="text-[#FF3C73]">
              실패 {summary.failedCount.toLocaleString()}
              <span className="text-base font-normal text-gray-600"> 건</span>
            </span>
            <span className="font-medium"> /</span>
            <span className="ml-2 text-[#5a5a5a]">
              환불 {summary.cancelledCount.toLocaleString()}
              <span className="text-base font-normal text-gray-600"> 건</span>
            </span>
          </p>
        </div>
        <div className="rounded-2xl bg-white py-4 px-8 shadow-md">
          <Typography variant="h6">총 매출액 (성공 기준)</Typography>
          <p className="mt-2 text-2xl font-bold text-[#4381ff]">
            {summary.totalRevenue.toLocaleString()}
            <span className="text-base font-normal text-gray-600"> 원</span>
          </p>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="rounded-2xl bg-white py-6 px-8 shadow-md flex flex-wrap gap-4 items-end">
        {/* 기간 */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">기간</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
            <span className="text-gray-500 text-sm">~</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
        </div>

        {/* 상태 */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">결제 상태</label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "ALL" | "SUCCESS" | "FAILED" | "CANCELLED"
              )
            }
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm min-w-[140px]"
          >
            <option value="ALL">전체</option>
            <option value="SUCCESS">성공</option>
            <option value="FAILED">실패</option>
            <option value="CANCELLED">환불</option>
          </select>
        </div>

        {/* 가맹점 */}
        <div className="flex flex-col">
          <label className="text-sm text-gray-600 mb-1">가맹점</label>
          <select
            value={merchantFilter}
            onChange={(e) => setMerchantFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm min-w-[180px]"
          >
            <option value="ALL">전체 가맹점</option>
            {merchants.map((m) => (
              <option key={m.mchtCode} value={m.mchtCode}>
                {m.mchtName}
              </option>
            ))}
          </select>
        </div>

        {/* 검색 */}
        <div className="flex flex-col flex-1 min-w-[200px]">
          <label className="text-sm text-gray-600 mb-1">
            검색 (결제코드 / 가맹점명)
          </label>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="예: PAY-2025-0001, 브런치커피 강남점"
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-full"
          />
        </div>

        {/* 필터 초기화 */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter("ALL");
            setMerchantFilter("ALL");
            setSearchText("");
            setDateFrom("");
            setDateTo("");
          }}
          className="ml-auto text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          필터 초기화
        </button>
      </div>

      {/* 테이블 영역 */}
      <div className="rounded-2xl bg-white py-6 px-8 shadow-md">
        {/* 필터 요약 */}
        <div className="flex justify-between items-center mb-3">
          <p className="text-sm text-gray-600">
            총{" "}
            <span className="font-semibold text-[#4381ff]">
              {filteredPayments.length.toLocaleString()}
            </span>
            건 조회됨
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-2 px-3">거래일시</th>
                <th className="text-left py-2 px-3">결제코드</th>
                <th className="text-left py-2 px-3">가맹점</th>
                <th className="text-left py-2 px-3">상태</th>
                <th className="text-right py-2 px-3">결제금액</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    조건에 맞는 거래내역이 없습니다.
                  </td>
                </tr>
              ) : (
                paginatedPayments.map((p) => {
                  const merchant = merchantMap[p.mchtCode];

                  return (
                    <tr
                      key={p.paymentCode}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-2 px-3 whitespace-nowrap">
                        {formatDate(p.paymentAt)}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs">
                        {p.paymentCode}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {merchant?.mchtName ?? "-"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {p.mchtCode}
                          </span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs ${
                            p.status === "SUCCESS"
                              ? "bg-[#E6F0FF] text-[#4381ff]"
                              : p.status === "FAILED"
                              ? "bg-[#FFE4EA] text-[#FF3C73]"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-semibold">
                        {Number(p.amount).toLocaleString()}원
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {filteredPayments.length > 0 && (
          <div className="flex justify-between items-center mt-4 text-sm">
            <span className="text-gray-500">
              페이지 {currentPage} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-lg border cursor-pointer ${
                  currentPage === 1
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                이전
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-lg border cursor-pointer ${
                  currentPage === totalPages
                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
