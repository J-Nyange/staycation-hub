import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard } from 'lucide-react';

interface PaymentMethodSelectorProps {
  value: 'stripe' | 'paystack';
  onChange: (value: 'stripe' | 'paystack') => void;
}

export default function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Payment Method</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as 'stripe' | 'paystack')}
        className="grid grid-cols-2 gap-4"
      >
        <div className="relative">
          <RadioGroupItem
            value="stripe"
            id="stripe"
            className="peer sr-only"
          />
          <Label
            htmlFor="stripe"
            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
          >
            <CreditCard className="mb-2 h-6 w-6" />
            <span className="text-sm font-medium">Card Payment</span>
            <span className="text-xs text-muted-foreground">Visa, Mastercard</span>
          </Label>
        </div>

        <div className="relative">
          <RadioGroupItem
            value="paystack"
            id="paystack"
            className="peer sr-only"
          />
          <Label
            htmlFor="paystack"
            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer transition-colors"
          >
            <svg className="mb-2 h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            <span className="text-sm font-medium">Paystack</span>
            <span className="text-xs text-muted-foreground">M-Pesa, Cards</span>
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
