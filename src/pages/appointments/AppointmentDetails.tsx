import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format, parseISO } from 'date-fns';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  User, 
  UserCheck,
  FileText,
  Tag,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface Appointment {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phone: string;
    email: string;
  };
  doctor: {
    _id: string;
    firstName: string;
    lastName: string;
    specialty: string;
  };
  date: string;
  time: {
    start: string;
    end: string;
  };
  type: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

const AppointmentDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [deleteConfirm, setDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/appointments/${id}`);
        setAppointment(response.data);
      } catch (error) {
        console.error('Error fetching appointment:', error);
        toast.error('Failed to load appointment details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAppointment();
    }
  }, [id]);

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/appointments/${id}`);
      toast.success('Appointment deleted successfully');
      navigate('/appointments');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="w-5 h-5 mr-2" />;
      case 'cancelled':
      case 'no-show':
        return <XCircle className="w-5 h-5 mr-2" />;
      default:
        return <Clock className="w-5 h-5 mr-2" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h3 className="text-xl font-medium text-gray-700">Appointment not found</h3>
          <p className="text-gray-500 mt-2">The requested appointment could not be found</p>
          <button
            onClick={() => navigate('/appointments')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/appointments')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Appointment Details</h1>
        </div>
        <div className="flex space-x-2">
          <Link
            to={`/appointments/${id}/edit`}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 flex items-center"
          >
            <Edit className="w-4 h-4 mr-2" /> Edit
          </Link>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header with status */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {appointment.type} Appointment
            </h2>
            <div className={`flex items-center px-3 py-1 rounded-full ${getStatusColor(appointment.status)}`}>
              {getStatusIcon(appointment.status)}
              <span className="font-medium">
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Appointment details */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column */}
            <div className="space-y-4">
              <div className="flex items-start">
                <Calendar className="w-5 h-5 mr-3 text-gray-500 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date</h3>
                  <p className="text-base">{format(parseISO(appointment.date), 'EEEE, MMMM d, yyyy')}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Clock className="w-5 h-5 mr-3 text-gray-500 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Time</h3>
                  <p className="text-base">{appointment.time.start} - {appointment.time.end}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Tag className="w-5 h-5 mr-3 text-gray-500 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Type</h3>
                  <p className="text-base">{appointment.type}</p>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              <div className="flex items-start">
                <User className="w-5 h-5 mr-3 text-gray-500 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Patient</h3>
                  <p className="text-base font-medium">
                    {appointment.patient.firstName} {appointment.patient.lastName}
                  </p>
                  <div className="mt-1 text-sm text-gray-500">
                    <p>DOB: {format(parseISO(appointment.patient.dateOfBirth), 'MMM d, yyyy')}</p>
                    <p>Phone: {appointment.patient.phone}</p>
                    <p>Email: {appointment.patient.email}</p>
                  </div>
                  <Link 
                    to={`/patients/${appointment.patient._id}`}
                    className="text-blue-500 hover:text-blue-700 text-sm inline-block mt-2"
                  >
                    View Patient Record
                  </Link>
                </div>
              </div>

              <div className="flex items-start">
                <UserCheck className="w-5 h-5 mr-3 text-gray-500 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Doctor</h3>
                  <p className="text-base">Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}</p>
                  <p className="text-sm text-gray-500">{appointment.doctor.specialty}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes section */}
          {appointment.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-start">
                <FileText className="w-5 h-5 mr-3 text-gray-500 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                  <div className="mt-2 p-4 bg-gray-50 rounded-md">
                    <p className="text-gray-700 whitespace-pre-line">{appointment.notes}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
            <p>Created: {format(parseISO(appointment.createdAt), 'MMM d, yyyy h:mm a')}</p>
            <p>Last Updated: {format(parseISO(appointment.updatedAt), 'MMM d, yyyy h:mm a')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetails;