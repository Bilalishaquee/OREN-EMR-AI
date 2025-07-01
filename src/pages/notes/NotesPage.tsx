import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaFilter, FaSearch, FaFileAlt, FaTrash, FaEdit, FaPrint } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

interface Note {
  _id: string;
  title: string;
  content: string;
  noteType: string;
  colorCode: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
  doctor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  visit?: {
    _id: string;
    visitType: string;
    date: string;
  };
  diagnosisCodes: Array<{
    code: string;
    description: string;
  }>;
  treatmentCodes: Array<{
    code: string;
    description: string;
  }>;
  attachments: Array<{
    _id: string;
    filename: string;
    originalname: string;
    path: string;
    mimetype: string;
    size: number;
  }>;
  createdAt: string;
  updatedAt: string;
  isAiGenerated: boolean;
}

interface FilterOptions {
  patientId: string;
  doctorId: string;
  noteType: string;
  search: string;
}

const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    patientId: '',
    doctorId: '',
    noteType: '',
    search: ''
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [patients, setPatients] = useState<Array<{ _id: string; firstName: string; lastName: string }>>([]);
  const [doctors, setDoctors] = useState<Array<{ _id: string; firstName: string; lastName: string }>>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch notes with filters and pagination
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { patientId, doctorId, noteType, search } = filterOptions;
      const { page, limit } = pagination;
      
      const params = new URLSearchParams();
      if (patientId) params.append('patientId', patientId);
      if (doctorId) params.append('doctorId', doctorId);
      if (noteType) params.append('noteType', noteType);
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      const response = await axios.get(`http://localhost:5000/api/notes?${params.toString()}`);
      setNotes(response.data.notes || []);
      
      // Safely access pagination data with fallback values
      const paginationData = response.data.pagination || {};
      setPagination(prev => ({
        ...prev,
        total: paginationData.total || 0,
        pages: paginationData.pages || 0
      }));
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to fetch notes');
      // Set empty data on error
      setNotes([]);
      setPagination(prev => ({
        ...prev,
        total: 0,
        pages: 0
      }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch patients and doctors for filters
  const fetchFilterData = async () => {
    try {
      const [patientsResponse, doctorsResponse] = await Promise.all([
        axios.get('http://localhost:5000/api/patients?limit=1000'),
        axios.get('http://localhost:5000/api/auth/doctors')
      ]);
      
      setPatients(patientsResponse.data.patients);
      setDoctors(doctorsResponse.data);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchFilterData();
  }, [pagination.page, pagination.limit]);

  // Apply filters
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilterOptions(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
    fetchNotes();
  };

  const handleResetFilters = () => {
    setFilterOptions({
      patientId: '',
      doctorId: '',
      noteType: '',
      search: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchNotes();
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await axios.delete(`http://localhost:5000/api/notes/${noteId}`);
        toast.success('Note deleted successfully');
        fetchNotes();
      } catch (error) {
        console.error('Error deleting note:', error);
        toast.error('Failed to delete note');
      }
    }
  };

  // Print note
  const handlePrintNote = (noteId: string) => {
    navigate(`/notes/${noteId}/print`);
  };

  // Get background color style based on note's color code
  const getNoteStyle = (colorCode: string) => {
    return {
      borderLeft: `4px solid ${colorCode}`,
      backgroundColor: `${colorCode}10` // Add slight transparency
    };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Patient Notes</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            <FaFilter className="mr-2" /> Filters
          </button>
          <button
            onClick={() => navigate('/notes/new')}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <FaPlus className="mr-2" /> New Note
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-gray-100 p-4 rounded-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              <select
                name="patientId"
                value={filterOptions.patientId}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All Patients</option>
                {patients.map(patient => (
                  <option key={patient._id} value={patient._id}>
                    {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
            </div>
            
            {user?.role === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <select
                  name="doctorId"
                  value={filterOptions.doctorId}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Doctors</option>
                  {doctors.map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                      {doctor.firstName} {doctor.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note Type</label>
              <select
                name="noteType"
                value={filterOptions.noteType}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All Types</option>
                <option value="Progress">Progress</option>
                <option value="Consultation">Consultation</option>
                <option value="Pre-Operative">Pre-Operative</option>
                <option value="Post-Operative">Post-Operative</option>
                <option value="Legal">Legal</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  name="search"
                  value={filterOptions.search}
                  onChange={handleFilterChange}
                  placeholder="Search notes..."
                  className="w-full p-2 pl-10 border rounded-md"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end mt-4 space-x-2">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border rounded-md hover:bg-gray-200"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <FaFileAlt className="mx-auto text-gray-400 text-5xl mb-4" />
          <h3 className="text-xl font-medium text-gray-700">No notes found</h3>
          <p className="text-gray-500 mt-2">Create a new note or adjust your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notes.map(note => (
            <div 
              key={note._id} 
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              style={getNoteStyle(note.colorCode)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{note.title}</h3>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <span className="mr-4">Patient: {note.patient.firstName} {note.patient.lastName}</span>
                    <span className="mr-4">Type: {note.noteType}</span>
                    <span>Created: {new Date(note.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePrintNote(note._id)}
                    className="p-2 text-gray-600 hover:text-blue-600"
                    title="Print Note"
                  >
                    <FaPrint />
                  </button>
                  <button
                    onClick={() => navigate(`/notes/${note._id}/edit`)}
                    className="p-2 text-gray-600 hover:text-green-600"
                    title="Edit Note"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note._id)}
                    className="p-2 text-gray-600 hover:text-red-600"
                    title="Delete Note"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
              
              <div className="mt-3">
                <div 
                  className="text-gray-700 line-clamp-3 text-sm" 
                  dangerouslySetInnerHTML={{ __html: note.content.substring(0, 200) + '...' }}
                />
              </div>
              
              <div className="mt-3 flex flex-wrap gap-2">
                {note.diagnosisCodes.length > 0 && (
                  <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {note.diagnosisCodes.length} Diagnosis {note.diagnosisCodes.length === 1 ? 'Code' : 'Codes'}
                  </div>
                )}
                {note.treatmentCodes.length > 0 && (
                  <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {note.treatmentCodes.length} Treatment {note.treatmentCodes.length === 1 ? 'Code' : 'Codes'}
                  </div>
                )}
                {note.attachments.length > 0 && (
                  <div className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {note.attachments.length} {note.attachments.length === 1 ? 'Attachment' : 'Attachments'}
                  </div>
                )}
                {note.isAiGenerated && (
                  <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    AI Generated
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && pagination.pages > 1 && (
        <div className="flex justify-center mt-6">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`px-3 py-1 rounded-md ${pagination.page === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Previous
            </button>
            
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-1 rounded-md ${pagination.page === page ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className={`px-3 py-1 rounded-md ${pagination.page === pagination.pages ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default NotesPage;