import { Card, CardContent, Typography } from "@mui/material";

export default function DashboardPage() {
  return (
    <div className="bg-gray-200">
      <Card className="mb-4">
        <CardContent>
          <Typography variant="h6">오늘 매출</Typography>
          <Typography variant="h4" className="mt-2">
            ₩1,250,000
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}
