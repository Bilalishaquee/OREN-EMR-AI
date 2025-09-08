import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle } from 'lucide-react';

const PaymentSuccess: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    const updatePaymentStatus = async () => {
      if (!id) {
        setError('Invoice ID is missing');
        setIsLoading(false);
        return;
      }

      try {
        // Update the payment status to 'paid'
        const response = await axios.put(
          `/api/payments/update-payment-status/${id}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setInvoice(response.data.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error updating payment status:', error);
        setError('Failed to update payment status. Please contact support.');
        setIsLoading(false);
      }
    };

    updatePaymentStatus();
  }, [id, token]);

  const handleBackToBilling = () => {
    navigate('/billing');
  };

  const handleViewInvoice = () => {
    navigate(`/billing/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800">Processing Payment</h2>
            <p className="text-gray-600 mt-2">Please wait while we confirm your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="flex flex-col items-center">
            <div className="rounded-full h-12 w-12 bg-red-100 flex items-center justify-center mb-4">
              <span className="text-red-500 text-2xl">!</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">Payment Error</h2>
            <p className="text-red-500 mt-2">{error}</p>
            <button
              onClick={handleBackToBilling}
              className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Back to Billing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center">
          <div className="rounded-full h-16 w-16 bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Payment Successful!</h2>
          <p className="text-gray-600 mt-2">
            Your payment for invoice {invoice?.invoiceNumber} has been processed successfully.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleViewInvoice}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              View Invoice
            </button>
            <button
              onClick={handleBackToBilling}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
            >
              Back to Billing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;