import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Search, 
  Plus, 
  Eye, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Mail,
  Phone,
  User,
  Users
} from 'lucide-react';

interface Patient {
  _id: string;
  dynamicData?: {
    [key: string]: any;
  };
  assignedDoctor?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  status: string;
  createdAt: string;
}

const PatientList: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [currentPage, searchTerm]);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/patients?page=${currentPage}&search=${searchTerm}`);
      setPatients(response.data.patients);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPatients();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const confirmDelete = (patientId: string) => {
    setSelectedPatient(patientId);
    setShowDeleteModal(true);
  };

  const deletePatient = async () => {
    try {
      await axios.delete(`/api/patients/${selectedPatient}`);
      setShowDeleteModal(false);
      fetchPatients();
    } catch (error) {
      console.error('Error deleting patient:', error);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    // Check if birthDate is valid
    if (isNaN(birthDate.getTime())) return '';
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <Users className="w-8 h-8 mr-3 text-blue-600" />
              Patients
            </h1>
            <p className="text-sm text-gray-500">Manage and view all patient records</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Link
                to="/forms/questionnaires"
                className="flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-r-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                <span>New Patient</span>
              </Link>
            </form>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading patients...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Age/Gender
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {patients.length > 0 ? (
                    patients.map((patient) => {
                      const data = patient.dynamicData || {};
                      const firstName = data.firstName || data["First Name"] || "";
                      const lastName = data.lastName || data["Last Name"] || "";
                      const fullName = `${firstName} ${lastName}`.trim() || "Unknown Patient";
                      const email = data.email || data["Email"] || "";
                      const phone = data.phone || data["Phone"] || "";
                      const age = calculateAge(data.dateOfBirth || data["Date of Birth"]);
                      const gender = data.gender || data["Gender"] || "";
                      
                      return (
                        <tr 
                          key={patient._id} 
                          className="hover:bg-blue-50/50 transition-colors duration-150 border-b border-gray-100"
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg shadow-md mr-4">
                                {getInitials(firstName, lastName)}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900 mb-1">
                                  {fullName}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Added {new Date(patient.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            {email && email !== "-" ? (
                              <div className="flex items-center text-sm text-gray-900 mb-1">
                                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                <span className="truncate max-w-xs">{email}</span>
                              </div>
                            ) : null}
                            {phone && phone !== "-" ? (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{phone}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">No contact info</span>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            {age ? (
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {age} years
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400 italic">-</div>
                            )}
                            {gender && gender !== "-" ? (
                              <div className="text-xs text-gray-500 capitalize flex items-center">
                                <User className="w-3 h-3 mr-1" />
                                {gender}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-6 py-5">
                            {patient.assignedDoctor ? (
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs mr-2">
                                  {patient.assignedDoctor.firstName?.charAt(0) || "D"}
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  Dr. {patient.assignedDoctor.firstName} {patient.assignedDoctor.lastName}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">Not assigned</span>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                patient.status === 'active'
                                  ? 'bg-green-100 text-green-800 border border-green-200'
                                  : patient.status === 'inactive'
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                                patient.status === 'active'
                                  ? 'bg-green-500'
                                  : patient.status === 'inactive'
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}></span>
                              {patient.status?.charAt(0).toUpperCase() + patient.status?.slice(1) || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center justify-end space-x-2">
                              <Link
                                to={`/patients/${patient._id}`}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-150"
                                title="View Details"
                              >
                                <Eye className="w-5 h-5" />
                              </Link>
                              <Link
                                to={`/appointments/new?patient=${patient._id}`}
                                className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all duration-150"
                                title="Schedule Appointment"
                              >
                                <Calendar className="w-5 h-5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <Users className="w-12 h-12 text-gray-300 mb-3" />
                          <p className="text-sm font-medium text-gray-500">No patients found</p>
                          <p className="text-xs text-gray-400 mt-1">Try adjusting your search criteria</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 bg-gray-50">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg transition-all ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg transition-all ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm'
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Showing page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                      <span className="font-semibold text-gray-900">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium transition-all ${
                          currentPage === 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all ${
                            currentPage === page
                              ? 'z-10 bg-blue-600 border-blue-600 text-white shadow-md'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium transition-all ${
                          currentPage === totalPages
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Patient</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this patient? All data associated with this patient will be
                        permanently removed. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={deletePatient}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;