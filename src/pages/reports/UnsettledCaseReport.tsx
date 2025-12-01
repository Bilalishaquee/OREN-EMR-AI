import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Search, 
  FileText as FileTextIcon, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  UserCircle,
  Eye,
  AlertCircle,
  Download
} from 'lucide-react';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  status: string;
  visits: Array<{
    _id: string;
    visitType: string;
    status: string;
    date: string;
  }>;
  assignedDoctor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

const UnsettledCaseReport: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalUnsettled, setTotalUnsettled] = useState(0);

  useEffect(() => {
    fetchActivePatients();
  }, []);

  const fetchActivePatients = async () => {
    setIsLoading(true);
    try {
      // First, get all active patients
      const response = await axios.get('/api/patients?status=active');
      const activePatients = response.data.patients || [];
      
      // Filter out patients who have a discharge visit
      const unsettledPatients = activePatients.filter((patient: Patient) => {
        return !patient.visits || !patient.visits.some(visit => visit.visitType === 'discharge');
      });
      
      setPatients(unsettledPatients);
      setTotalUnsettled(unsettledPatients.length);
    } catch (error) {
      console.error('Error fetching unsettled cases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredPatients = patients.filter(patient => 
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm) ||
    patient.phone.includes(searchTerm) ||
    patient.email.toLowerCase().includes(searchTerm)
  );

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Unsettled Case Report</h1>
              <p className="text-sm text-gray-600">Track and manage patients with active, unresolved cases</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg shadow-sm hover:bg-gray-50 hover:shadow-md transition-all">
                <Download className="w-5 h-5 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Stats and Search Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-blue-600 uppercase tracking-wide">Total Cases</div>
                    <div className="text-2xl font-bold text-blue-900">{totalUnsettled}</div>
                  </div>
                </div>
                <div className="hidden md:block h-12 w-px bg-gray-300"></div>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{filteredPatients.length}</span> {filteredPatients.length === 1 ? 'case' : 'cases'} shown
                </div>
              </div>
              <div className="relative flex-1 md:max-w-md">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-96 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Loading unsettled cases...</p>
          </div>
        ) : (
          <>
            {filteredPatients.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Age/Gender
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Doctor
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPatients.map((patient) => (
                        <tr 
                          key={patient._id} 
                          className="hover:bg-blue-50/50 transition-colors duration-150 group"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                <User className="h-5 w-5 text-white" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">
                                  {patient.firstName} {patient.lastName}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center mt-1">
                                  <FileTextIcon className="h-3 w-3 mr-1.5" />
                                  MR# {patient._id.substring(0, 8).toUpperCase()}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col gap-1.5">
                              {patient.phone && (
                                <div className="flex items-center text-sm text-gray-700">
                                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                  <span>{patient.phone}</span>
                                </div>
                              )}
                              {patient.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                  <span className="truncate max-w-xs">{patient.email}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              <span className="font-medium">{calculateAge(patient.dateOfBirth)}</span>
                              <span className="mx-1 text-gray-400">•</span>
                              <span className="capitalize text-gray-600">{patient.gender}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-700">
                              {patient.assignedDoctor ? (
                                <>
                                  <UserCircle className="h-4 w-4 mr-2 text-gray-400" />
                                  <span className="font-medium">
                                    Dr. {patient.assignedDoctor.firstName} {patient.assignedDoctor.lastName}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-400 italic">Not assigned</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right">
                            <Link
                              to={`/patients/${patient._id}`}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                              <Eye className="h-4 w-4 mr-1.5" />
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="flex justify-center mb-4">
                    <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-10 w-10 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm ? 'No matching cases found' : 'No unsettled cases'}
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm 
                      ? 'Try adjusting your search criteria to find patients.'
                      : 'All patient cases have been settled. Great work!'}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UnsettledCaseReport;
