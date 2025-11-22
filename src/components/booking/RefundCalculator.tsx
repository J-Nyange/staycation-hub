import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface RefundCalculatorProps {
  checkInDate: string;
  totalPrice: number;
  cancellationPolicy: string;
}

export const RefundCalculator = ({ checkInDate, totalPrice, cancellationPolicy }: RefundCalculatorProps) => {
  const calculateRefund = () => {
    const checkIn = new Date(checkInDate);
    const now = new Date();
    const daysUntilCheckIn = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let refundPercentage = 0;

    if (cancellationPolicy === 'flexible') {
      if (daysUntilCheckIn > 1) refundPercentage = 100;
      else if (daysUntilCheckIn >= 0) refundPercentage = 50;
    } else if (cancellationPolicy === 'moderate') {
      if (daysUntilCheckIn >= 7) refundPercentage = 100;
      else if (daysUntilCheckIn >= 3) refundPercentage = 50;
    } else if (cancellationPolicy === 'strict') {
      if (daysUntilCheckIn >= 30) refundPercentage = 50;
    }

    return {
      percentage: refundPercentage,
      amount: (totalPrice * refundPercentage) / 100,
      daysUntil: daysUntilCheckIn,
    };
  };

  const refund = calculateRefund();

  const getPolicyDescription = () => {
    if (cancellationPolicy === 'flexible') {
      return "Full refund if cancelled more than 24 hours before check-in, 50% refund within 24 hours";
    } else if (cancellationPolicy === 'moderate') {
      return "Full refund if cancelled 7+ days before check-in, 50% refund 3-7 days before";
    } else if (cancellationPolicy === 'strict') {
      return "50% refund if cancelled 30+ days before check-in, no refund within 30 days";
    }
    return "";
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Refund Calculation</h4>
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Original amount:</span>
            <span className="font-semibold">${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-muted-foreground">Refund percentage:</span>
            <span className="font-semibold text-primary">{refund.percentage}%</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="font-semibold">You will receive:</span>
            <span className="text-lg font-bold text-primary">${refund.amount.toFixed(2)}</span>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium capitalize">{cancellationPolicy} Cancellation Policy</p>
              <p className="text-sm">{getPolicyDescription()}</p>
              <p className="text-sm text-muted-foreground">
                Days until check-in: {refund.daysUntil > 0 ? refund.daysUntil : "Check-in date has passed"}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};