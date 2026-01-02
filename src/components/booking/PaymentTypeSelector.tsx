import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Wallet, Info } from "lucide-react";

interface PaymentTypeSelectorProps {
  value: 'full' | 'deposit';
  onChange: (value: 'full' | 'deposit') => void;
  depositPercentage: number;
  totalPrice: number;
  checkInDate?: Date;
}

export default function PaymentTypeSelector({
  value,
  onChange,
  depositPercentage,
  totalPrice,
  checkInDate,
}: PaymentTypeSelectorProps) {
  const depositAmount = Math.round(totalPrice * (depositPercentage / 100));
  const balanceAmount = totalPrice - depositAmount;

  // Calculate balance due date (7 days before check-in, or at booking if less than 7 days)
  const getBalanceDueDate = () => {
    if (!checkInDate) return null;
    const dueDate = new Date(checkInDate);
    dueDate.setDate(dueDate.getDate() - 7);
    const today = new Date();
    return dueDate > today ? dueDate : today;
  };

  const balanceDueDate = getBalanceDueDate();

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Payment Option</Label>
      
      <RadioGroup value={value} onValueChange={(v) => onChange(v as 'full' | 'deposit')} className="space-y-3">
        {/* Full Payment Option */}
        <div
          className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
            value === 'full'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => onChange('full')}
        >
          <RadioGroupItem value="full" id="full" className="mt-1" />
          <div className="flex-1">
            <label htmlFor="full" className="font-semibold cursor-pointer flex items-center">
              <CreditCard className="h-4 w-4 mr-2 text-primary" />
              Pay Full Amount Now
            </label>
            <p className="text-sm text-muted-foreground mt-1">
              Pay KES {totalPrice.toLocaleString()} now and you're all set!
            </p>
            {value === 'full' && (
              <div className="mt-2 text-sm font-medium text-green-600">
                ✓ No additional payments required
              </div>
            )}
          </div>
        </div>

        {/* Deposit Option */}
        <div
          className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
            value === 'deposit'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onClick={() => onChange('deposit')}
        >
          <RadioGroupItem value="deposit" id="deposit" className="mt-1" />
          <div className="flex-1">
            <label htmlFor="deposit" className="font-semibold cursor-pointer flex items-center">
              <Wallet className="h-4 w-4 mr-2 text-primary" />
              Pay {depositPercentage}% Deposit Now
            </label>
            <p className="text-sm text-muted-foreground mt-1">
              Pay KES {depositAmount.toLocaleString()} now, KES {balanceAmount.toLocaleString()} later
            </p>
            {value === 'deposit' && (
              <div className="mt-2 space-y-1">
                <div className="text-sm">
                  <span className="font-medium">Today: </span>
                  <span className="text-primary font-semibold">KES {depositAmount.toLocaleString()}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Balance due: </span>
                  <span className="font-semibold">KES {balanceAmount.toLocaleString()}</span>
                  {balanceDueDate && (
                    <span className="text-muted-foreground">
                      {' '}(by {balanceDueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </RadioGroup>

      {value === 'deposit' && (
        <Alert className="border-blue-500/20 bg-blue-500/10">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-700">
            <strong>Payment Schedule: </strong>
            The remaining balance must be paid at least 7 days before check-in. 
            You'll receive email reminders before the due date.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
