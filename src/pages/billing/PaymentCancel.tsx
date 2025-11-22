import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';

const PaymentCancel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleBackToBilling = () => {
    navigate('/billing');
  };

  const handleRetryPayment = () => {
    navigate(`/billing/${id}/edit`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div className="flex flex-col items-center">
          <div className="rounded-full h-16 w-16 bg-red-100 flex items-center justify-center mb-4">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Payment Cancelled</h2>
          <p className="text-gray-600 mt-2">
            Your payment process was cancelled or did not complete successfully.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleRetryPayment}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry Payment
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

export default PaymentCancel;