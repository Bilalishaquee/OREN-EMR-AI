import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiCheckCircle } from 'react-icons/fi';

const ThankYouPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const language = searchParams.get('lang') || 'english';
  const [countdown, setCountdown] = useState(10);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to home page after countdown
          window.location.href = '/';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <FiCheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {language === 'spanish' ? '¡Gracias!' : 'Thank You!'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {language === 'spanish'
                ? 'Su información ha sido enviada con éxito.'
                : 'Your information has been successfully submitted.'}
            </p>
            <p className="mt-6 text-sm text-gray-500">
              {language === 'spanish'
                ? 'Nos pondremos en contacto con usted pronto.'
                : 'We will contact you soon.'}
            </p>
            
            <div className="mt-8 border-t border-gray-200 pt-6">
              <p className="text-sm text-gray-500">
                {language === 'spanish'
                  ? `Redirigiendo a la página principal en ${countdown} segundos...`
                  : `Redirecting to home page in ${countdown} seconds...`}
              </p>
              <div className="mt-4">
                <Link
                  to="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {language === 'spanish' ? 'Ir a la página principal' : 'Go to home page'}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;