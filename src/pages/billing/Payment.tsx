// src/pages/PaymentPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';
interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Visit {
  _id: string;
  date: string;
  visitType: string;
}

const stripePromise = loadStripe("pk_test_51QckoZCKTuZa0kMf9xPQdeYWRunNSt9Y8VLNFMss2BYyUFuFazb8BsjIbQ4rZNLryBxrYi9wIOEX6lFwfxlNennh00i52y6he8");

const Payment: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const [patients, setPatients] = useState<Patient[]>([]);
    const [visits, setVisits] = useState<Visit[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
        invoiceNumber: '', // ✅ required field
        patient: '',
        visit: '',
        dateIssued: new Date(),
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
        items: [{ description: '', code: '', quantity: 1, unitPrice: 0, total: 0 }],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        status: 'draft',
        notes: ''
    });

    console.log(formData)




    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch patients
                const patientsResponse = await axios.get('http://localhost:5000/api/patients');
                setPatients(patientsResponse.data.patients);
                const invoiceResponse = await axios.get(`http://localhost:5000/api/billing/${id}`);
                const invoiceData = invoiceResponse.data;

                setFormData({
                    invoiceNumber: invoiceData.invoiceNumber || '',
                    patient: invoiceData.patient?._id || '',
                    visit: invoiceData.visit?._id || '',
                    dateIssued: new Date(invoiceData.dateIssued),
                    dueDate: new Date(invoiceData.dueDate),
                    items: invoiceData.items || [],
                    subtotal: invoiceData.subtotal || 0,
                    tax: invoiceData.tax || 0,
                    discount: invoiceData.discount || 0,
                    total: invoiceData.total || 0,
                    status: invoiceData.status || 'draft',
                    notes: invoiceData.notes || ''
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id, location.search]);

    const handleStripeCheckout = async () => {
    try {
      
      const stripe = await loadStripe("pk_test_51QckoZCKTuZa0kMf9xPQdeYWRunNSt9Y8VLNFMss2BYyUFuFazb8BsjIbQ4rZNLryBxrYi9wIOEX6lFwfxlNennh00i52y6he8");
      const body = {
        Products: formData,
        id: id
      }
      
      const response = await axios.post('/api/payments/checkout-session', body);
      const session = response.data;
      const result = await stripe.redirectToCheckout({ sessionId: session.id })
      if(result.error){
        console.log(result.error.message)
      }
    } catch (error) {
      console.error('Error processing Stripe checkout:', error);
    }
  };
    // useEffect(() => {
    //     if (id) {
    //         handleStripeCheckout();
    //     }
    // }, [id]);

    return (
        <div className="flex flex-col items-center justify-center gap-2 h-screen bg-gray-100">
            <h2 className="text-xl font-semibold text-gray-700">Redirecting to secure payment...</h2>
            <button className="bg-blue-800 py-3 px-3 text-white rounded-lg"  onClick={handleStripeCheckout}>Pay Now!</button>
        </div>
    );
};

export default Payment;
