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
  const [patients, setPatients] = useState<Array<{ _id: string; firstName: string; lastName: string; dateOfBirth: string }>>([]);
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

      const notesData = response.data?.notes || [];
      const sanitizedNotes = notesData.map((note: any) => ({
        _id: note._id || '',
        title: note.title || 'Untitled Note',
        content: note.content || '',
        noteType: note.noteType || 'Unknown',
        colorCode: note.colorCode || '#e5e7eb',
        patient: note.patient || { _id: '', firstName: '', lastName: '', dateOfBirth: '' },
        doctor: note.doctor || { _id: '', firstName: '', lastName: '' },
        visit: note.visit || null,
        diagnosisCodes: Array.isArray(note.diagnosisCodes) ? note.diagnosisCodes : [],
        treatmentCodes: Array.isArray(note.treatmentCodes) ? note.treatmentCodes : [],
        attachments: Array.isArray(note.attachments) ? note.attachments : [],
        createdAt: note.createdAt || new Date().toISOString(),
        updatedAt: note.updatedAt || new Date().toISOString(),
        isAiGenerated: Boolean(note.isAiGenerated)
      }));

      setNotes(sanitizedNotes);

      const paginationData = response.data?.pagination || {};
      setPagination(prev => ({
        ...prev,
        total: paginationData.total || 0,
        pages: paginationData.pages || 0
      }));
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to fetch notes');
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

  // --- MODIFICATION 1: Enhanced extraction logic for names and DOB ---
  // Purpose: Ensure correct extraction from root, dynamicData, or formData, with detailed logging
  const fetchFilterData = async () => {
    try {
      console.log('Fetching filter data...');

      // Fetch patients
      let patientsData = [];
      try {
        const patientsResponse = await axios.get('http://localhost:5000/api/patients?limit=1000');
        patientsData = patientsResponse.data?.patients || patientsResponse.data || [];
        console.log('Patients response:', patientsData);
      } catch (patientError) {
        console.error('Error fetching patients:', patientError);
        patientsData = [];
      }

      // Fetch doctors
      let doctorsData = [];
      try {
        const doctorsResponse = await axios.get('http://localhost:5000/api/auth/doctors');
        doctorsData = doctorsResponse.data || [];
        console.log('Doctors response:', doctorsData);
      } catch (doctorError) {
        console.error('Error fetching doctors:', doctorError);
        doctorsData = [];
      }

      // Sanitize patient data
      const sanitizedPatients = patientsData
        .filter((patient: any) => patient && patient._id)
        .map((patient: any) => {
          // Try root-level properties first
          let firstName = patient.firstName || '';
          let lastName = patient.lastName || '';
          let dateOfBirth = patient.dateOfBirth || '';
          let dataSource = 'root';

          // Fallback to dynamicData
          if (!firstName || !lastName || !dateOfBirth) {
            firstName = firstName || patient.dynamicData?.['First Name'] || '';
            lastName = lastName || patient.dynamicData?.['Last Name'] || '';
            dateOfBirth = dateOfBirth || patient.dynamicData?.['Date of Birth'] || '';
            if (firstName || lastName || dateOfBirth) dataSource = 'dynamicData';
          }

          // Fallback to formData (demographics)
          if (!firstName || !lastName || !dateOfBirth) {
            const formData = patient.formData?.[0]?.data;
            if (formData) {
              const formKey = Object.keys(formData).find(key => formData[key]?.type === 'demographics');
              if (formKey && formData[formKey]?.value) {
                firstName = firstName || formData[formKey].value['First Name'] || '';
                lastName = lastName || formData[formKey].value['Last Name'] || '';
                dateOfBirth = dateOfBirth || formData[formKey].value['Date of Birth'] || '';
                if (firstName || lastName || dateOfBirth) dataSource = 'formData';
              }
            }
          }

          // Log extraction details
          if (!firstName && !lastName && !dateOfBirth) {
            console.log(`Incomplete patient skipped (_id: ${patient._id}): No name or DOB found`);
          } else {
            console.log(`Processed patient (_id: ${patient._id}, source: ${dataSource}):`, {
              firstName,
              lastName,
              dateOfBirth,
            });
          }

          return {
            _id: patient._id || '',
            firstName: firstName || 'Unknown',
            lastName: lastName || 'Patient',
            dateOfBirth: dateOfBirth || '',
          };
        })
        // --- MODIFICATION 2: Stricter filter to exclude completely empty patients ---
        // Purpose: Only include patients with at least a name or DOB
        .filter((patient: any) => 
          !(patient.firstName === 'Unknown' && patient.lastName === 'Patient' && !patient.dateOfBirth)
        );

      console.log('Sanitized patients:', sanitizedPatients);

      // Set state
      setPatients(sanitizedPatients);
      setDoctors(doctorsData);
    } catch (error) {
      console.error('Error in fetchFilterData:', error);
      setPatients([]);
      setDoctors([]);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchFilterData();
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchFilterData();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilterOptions(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
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

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

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

  const handlePrintNote = (noteId: string) => {
    navigate(`/notes/${noteId}/print`);
  };

  const getNoteStyle = (colorCode: string | null | undefined) => {
    const defaultColor = '#e5e7eb';
    const color = colorCode || defaultColor;
    return {
      borderLeft: `4px solid ${color}`,
      backgroundColor: `${color}10`
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

      {showFilters && (
        <div className="bg-gray-100 p-4 rounded-md mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
              {/* --- MODIFICATION 3: Enhanced DOB display with validation --- */}
              {/* Purpose: Ensure valid DOB rendering and clear fallback */}
              <select
                name="patientId"
                value={filterOptions.patientId}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All Patients</option>
                {patients && patients.length > 0 ? (
                  patients.map(patient => {
                    const displayName = patient.firstName && patient.lastName
                      ? `${patient.firstName} ${patient.lastName}`.trim()
                      : patient.firstName || patient.lastName || 'Unknown Patient';
                    const displayDOB = patient.dateOfBirth && !isNaN(new Date(patient.dateOfBirth).getTime())
                      ? new Date(patient.dateOfBirth).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })
                      : 'No DOB';
                    return (
                      <option key={patient._id} value={patient._id}>
                        {`${displayName} (DOB: ${displayDOB})`}
                      </option>
                    );
                  })
                ) : (
                  <option value="" disabled>No patients available</option>
                )}
              </select>
            </div>

            {user && user.role === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <select
                  name="doctorId"
                  value={filterOptions.doctorId}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">All Doctors</option>
                  {doctors && doctors.map(doctor => (
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
            note._id ? (
              <div
                key={note._id}
                className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                style={getNoteStyle(note.colorCode)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{note.title || 'Untitled Note'}</h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <span className="mr-4">
                        Patient: {note.patient ?
                          (note.patient.firstName || note.patient.lastName ?
                            `${note.patient.firstName || ''} ${note.patient.lastName || ''}`.trim() :
                            'Unknown Patient') :
                          'Unknown Patient'}
                      </span>
                      <span className="mr-4">Type: {note.noteType || 'Unknown'}</span>
                      <span>Created: {(() => {
                        try {
                          return note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Unknown Date';
                        } catch {
                          return 'Invalid Date';
                        }
                      })()}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => note._id && handlePrintNote(note._id)}
                      className="p-2 text-gray-600 hover:text-blue-600"
                      title="Print Note"
                      disabled={!note._id}
                    >
                      <FaPrint />
                    </button>
                    <button
                      onClick={() => note._id && navigate(`/notes/${note._id}/edit`)}
                      className="p-2 text-gray-600 hover:text-green-600"
                      title="Edit Note"
                      disabled={!note._id}
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => note._id && handleDeleteNote(note._id)}
                      className="p-2 text-gray-600 hover:text-red-600"
                      title="Delete Note"
                      disabled={!note._id}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <div
                    className="text-gray-700 line-clamp-3 text-sm"
                    dangerouslySetInnerHTML={{ __html: (note.content || '').substring(0, 200) + ((note.content && note.content.length > 200) ? '...' : '') }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {note.diagnosisCodes && note.diagnosisCodes.length > 0 && (
                    <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {note.diagnosisCodes.length} Diagnosis {note.diagnosisCodes.length === 1 ? 'Code' : 'Codes'}
                    </div>
                  )}
                  {note.treatmentCodes && note.treatmentCodes.length > 0 && (
                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {note.treatmentCodes.length} Treatment {note.treatmentCodes.length === 1 ? 'Code' : 'Codes'}
                    </div>
                  )}
                  {note.attachments && note.attachments.length > 0 && (
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
            ) : null
          ))}
        </div>
      )}

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