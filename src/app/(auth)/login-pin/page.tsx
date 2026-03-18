'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Delete } from 'lucide-react';

export default function PinLoginPage() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDigit = useCallback((digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);

      // Auto-submit on 4 digits
      if (newPin.length === 4) {
        handleSubmit(newPin);
      }
    }
  }, [pin]);

  const handleDelete = useCallback(() => {
    setPin(pin.slice(0, -1));
  }, [pin]);

  const handleSubmit = async (pinValue: string) => {
    setLoading(true);

    const res = await fetch('/api/auth/login-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pinValue }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || 'Invalid PIN');
      setPin('');
      setLoading(false);
      return;
    }

    router.push('/checklists/today');
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Staff Login</CardTitle>
        <CardDescription>Enter your 4-digit PIN</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* PIN dots */}
        <div className="flex justify-center gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full border-2 transition-colors ${
                i < pin.length
                  ? 'bg-emerald-600 border-emerald-600'
                  : 'border-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        {/* Numeric keypad */}
        <div className="grid grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <Button
              key={digit}
              variant="outline"
              className="h-16 text-2xl font-medium"
              onClick={() => handleDigit(digit)}
              disabled={loading}
            >
              {digit}
            </Button>
          ))}
          <div /> {/* empty space */}
          <Button
            variant="outline"
            className="h-16 text-2xl font-medium"
            onClick={() => handleDigit('0')}
            disabled={loading}
          >
            0
          </Button>
          <Button
            variant="outline"
            className="h-16"
            onClick={handleDelete}
            disabled={loading || pin.length === 0}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Delete className="h-5 w-5" />}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <Link href="/login" className="text-sm text-muted-foreground hover:text-emerald-600">
          Manager? Sign in with email
        </Link>
      </CardFooter>
    </Card>
  );
}
