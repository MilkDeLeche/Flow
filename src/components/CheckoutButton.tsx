import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { startCheckout, type CheckoutProduct } from '../lib/stripeCheckout';

interface CheckoutButtonProps {
  product: CheckoutProduct;
  label: string;
  className?: string;
  disabled?: boolean;
  onNeedLogin?: (product: CheckoutProduct) => void;
  isLoggedIn?: boolean;
}

export default function CheckoutButton({
  product,
  label,
  className = '',
  disabled = false,
  onNeedLogin,
  isLoggedIn = false,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (disabled || loading) return;
    setError(null);

    if (!isLoggedIn) {
      onNeedLogin?.(product);
      return;
    }

    setLoading(true);
    try {
      const url = await startCheckout(product);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed.');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-accent bg-accent px-5 py-2.5 text-[14px] font-medium text-accent-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {loading && <Loader2 size={15} className="animate-spin" />}
        {label}
      </button>
      {error && <p className="mt-2 text-[12px] text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
