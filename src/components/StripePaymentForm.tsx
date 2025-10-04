"use client";

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PaymentElement,
  useStripe,
  useElements,
  AddressElement,
} from '@stripe/react-stripe-js';
import { colors } from '@/theme/colors';

interface StripePaymentFormProps {
  orderNumber: string;
  totalAmount: number;
  customerInfo: any;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

export default function StripePaymentForm({
  orderNumber,
  totalAmount,
  customerInfo,
  onPaymentSuccess,
  onPaymentError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // ยืนยันการชำระเงิน
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
        setIsProcessing(false);
        return;
      }

      // ดำเนินการชำระเงิน
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (confirmError) {
        if (confirmError.type === 'card_error' || confirmError.type === 'validation_error') {
          setError(confirmError.message || 'ข้อมูลบัตรไม่ถูกต้อง');
        } else {
          setError('เกิดข้อผิดพลาดในการชำระเงิน กรุณาลองใหม่อีกครั้ง');
        }
        onPaymentError(confirmError.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent.id);
        onPaymentSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError('เกิดข้อผิดพลาดที่ไม่คาดคิด');
      onPaymentError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
          💳 ชำระเงินด้วยบัตรเครดิต/เดบิต
        </Typography>

        <Box sx={{ mb: 3, p: 2, backgroundColor: colors.background.default, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            📋 รายละเอียดการสั่งซื้อ
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            หมายเลขคำสั่งซื้อ: <strong>{orderNumber}</strong>
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            ยอดชำระ: <strong>฿{totalAmount.toLocaleString()}</strong>
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          {/* ข้อมูลบัตร */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
              ข้อมูลบัตรเครดิต/เดบิต
            </Typography>
            <PaymentElement
              options={{
                layout: 'tabs',
                defaultValues: {
                  billingDetails: {
                    name: customerInfo.name,
                    email: customerInfo.email,
                    phone: customerInfo.phone,
                  },
                },
              }}
            />
          </Box>

          {/* ที่อยู่เรียกเก็บเงิน */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
              ที่อยู่เรียกเก็บเงิน
            </Typography>
            <AddressElement
              options={{
                mode: 'billing',
                defaultValues: {
                  name: customerInfo.name,
                  address: {
                    line1: customerInfo.address,
                    city: customerInfo.city,
                    postal_code: customerInfo.postalCode,
                    country: 'TH',
                  },
                },
              }}
            />
          </Box>

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* ปุ่มชำระเงิน */}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={!stripe || !elements || isProcessing}
            sx={{
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 600,
              backgroundColor: colors.primary.main,
              '&:hover': {
                backgroundColor: colors.primary.dark,
              },
              '&:disabled': {
                backgroundColor: colors.text.disabled,
              },
            }}
          >
            {isProcessing ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                กำลังดำเนินการ...
              </Box>
            ) : (
              `ชำระเงิน ฿${totalAmount.toLocaleString()}`
            )}
          </Button>

          <Typography variant="caption" sx={{ 
            display: 'block', 
            textAlign: 'center', 
            mt: 2, 
            color: colors.text.secondary 
          }}>
            🔒 การชำระเงินของคุณได้รับการป้องกันด้วย Stripe SSL Encryption
          </Typography>
        </form>
      </CardContent>
    </Card>
  );
}
