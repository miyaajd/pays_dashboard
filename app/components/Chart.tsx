"use client";

import { useEffect, useState } from "react";
import { Typography } from "@mui/material";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import { Pie } from "react-chartjs-2";
import type { ChartOptions } from "chart.js";
// import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

// 결제 내역 타입
type Payment = {
  paymentCode: string;
  status: "SUCCESS" | "FAILED" | "CANCELLED";
};

export default function PaymentChart() {
  const [payments, setPayments] = useState<Payment[]>([]);

  // API에서 결제 내역 가져오기
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
    fetchPayments();
  }, []);

  // 성공/실패/환불 건수 계산
  const successCount = payments.filter((p) => p.status === "SUCCESS").length;
  const failedCount = payments.filter((p) => p.status === "FAILED").length;
  const cancelledCount = payments.filter(
    (p) => p.status === "CANCELLED"
  ).length;

  // Pie 차트 데이터
  const chartData = {
    labels: ["SUCCESS", "FAILED", "CANCELLED"],
    datasets: [
      {
        label: "결제 비율",
        data: [successCount, cancelledCount, failedCount],
        backgroundColor: [
          "rgba(67, 129, 255, 0.6)", //성공
          "rgba(255, 60, 115, 0.8)", //실패
          "#ccc", //환불
        ],
      },
    ],
  };

  // Pie 차트 옵션
  const chartOptions: ChartOptions<"pie"> = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
        },
      },
      title: {
        display: true,
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl shadow-md py-6 px-8">
      <Typography variant="h6">결제 비율 차트</Typography>
      <Pie data={chartData} options={chartOptions} />
    </div>
  );
}
