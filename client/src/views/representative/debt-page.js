'use client';
import { useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from '@/sections/representative/debt-manage/CheckoutForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUB_KEY);

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState('');
  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra Stripe đã sẵn sàng chưa
    stripePromise.then((stripe) => {
      if (!stripe) {
        console.error('Stripe failed to load');
        return;
      }
      setStripeReady(true);
    });

    // 2. Lấy clientSecret từ backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/';

    fetch(`${backendUrl}/api/stripe/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 100000, currency: 'vnd' })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        if (!data.clientSecret) throw new Error('Missing clientSecret');
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error('Fetch error:', error);
        // Xử lý lỗi UI tại đây
      });
  }, []);

  // 3. Chỉ render khi đủ điều kiện
  if (!stripeReady || !clientSecret) {
    return <div>Loading payment gateway...</div>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }} key={clientSecret}>
      <CheckoutForm />
    </Elements>
  );
}
