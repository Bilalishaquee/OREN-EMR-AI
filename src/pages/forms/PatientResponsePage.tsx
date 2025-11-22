import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft } from 'react-icons/fa';

interface FormResponse {
  _id: string;
  formTemplate: {
    _id: string;
    title: string;
    description: string;
  };
  patient: string;
  status: string;
  completedAt: string;
  responses: Array<{
    questionId: string;
    questionType: string;
    questionText: string;
    answer?: any;
    matrixResponses?: Array<any>;
    fileAttachments?: Array<any>;
    signature?: string | null;
    bodyMapMarkings?: Array<any>;
    mixedControlsResponses?: Array<any>;
  }>;
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
}

const PatientResponsePage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientName, setPatientName] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch form responses for the patient
        const responsesRes = await axios.get(`/api/form-responses/patient/${patientId}`);
        setFormResponses(responsesRes.data);
        
        // Fetch doctors for mapping doctor IDs to names
        const doctorsRes = await axios.get('/api/doctors');
        setDoctors(doctorsRes.data);
        
        // Get patient name from the demographic data if available
        if (responsesRes.data.length > 0) {
          const demographicResponse = responsesRes.data[0].responses.find(
            (response: any) => response.questionType === 'demographics'
          );
          
          if (demographicResponse && demographicResponse.answer) {
            const firstName = demographicResponse.answer['First Name'] || '';
            const lastName = demographicResponse.answer['Last Name'] || '';
            setPatientName(`${firstName} ${lastName}`.trim());
          }
        }
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to load patient data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchData();
    }
  }, [patientId]);

  // Find demographic response from the first form response
  const demographicResponse = formResponses.length > 0 
    ? formResponses[0].responses.find(response => response.questionType === 'demographics')
    : null;

  // Get doctor name from the doctor ID in demographic data
  const getDoctorName = (doctorId: string) => {
    const doctor = doctors.find(doc => doc._id === doctorId);
    return doctor ? `${doctor.firstName} ${doctor.lastName}` : 'Unknown';
  };

  // Get assigned doctor name if available
  const assignedDoctorId = demographicResponse?.answer?.assignedDoctor;
  const doctorName = assignedDoctorId ? getDoctorName(assignedDoctorId) : undefined;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <div className="mt-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <FaArrowLeft className="mr-2" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header with back button */}
      <div className="mb-6 flex justify-between items-center">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" /> Back to Patient List
        </button>
        
        <h1 className="text-2xl font-bold text-gray-800">
          {patientName ? `Patient: ${patientName}` : 'Patient Details'}
        </h1>
      </div>

      {/* Content */}
      <div className="space-y-8">
        {/* Demographic Information */}
        {demographicResponse && (
          <PatientDemographicViewer 
            demographicResponse={demographicResponse} 
            doctorName={doctorName}
          />
        )}
        
        {/* Form Responses */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Form Responses</h2>
          {formResponses.length > 0 ? (
            <PatientResponseViewer formResponses={formResponses} />
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500">No form responses available for this patient.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientResponsePage;