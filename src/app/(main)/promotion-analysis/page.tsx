import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PromotionAnalyzer } from "./components/promotion-analyzer";
import { Award } from "lucide-react";

export default function PromotionAnalysisPage() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-md">
                <Award className="w-6 h-6 text-primary" />
            </div>
            <div>
                <CardTitle className="font-headline">Promotion Candidate Analysis</CardTitle>
                <CardDescription className="mt-1">
                Use AI to suggest potential promotion candidates based on their performance metrics.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <PromotionAnalyzer />
      </CardContent>
    </Card>
  );
}
