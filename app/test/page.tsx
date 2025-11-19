"use client";

import { useEffect } from "react";
import axios from "axios";

export default function Test() {
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          "https://recruit.paysbypays.com/api/v1"
        );
        console.log("응답:", res.data);
      } catch (err) {
        console.log("에러:", err);
      }
    };
    fetchData();
  }, []);

  return <div>API 테스트 중... 콘솔 확인!</div>;
}