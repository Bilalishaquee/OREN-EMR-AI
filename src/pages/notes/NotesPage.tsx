import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FileText, Plus, Filter, Search, Trash2, Edit, Printer, User, Calendar, Tag, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
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

      const response = await axios.get(`/api/notes?${params.toString()}`);

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

      // Remove duplicates - check both by _id and by content/title/patient/date
      // This handles cases where duplicate notes were saved with different _ids
      const uniqueNotesMap = new Map<string, Note>();
      
      sanitizedNotes.forEach((note) => {
        // Skip if note is missing _id
        if (!note._id) return;
        
        // Check if we already have this exact note by _id
        if (uniqueNotesMap.has(note._id)) {
          return; // Skip duplicate _id
        }
        
        // Check for duplicate by content (title, patient, noteType, same day)
        let isDuplicate = false;
        for (const [existingId, existingNote] of uniqueNotesMap.entries()) {
          // Check if title matches
          const sameTitle = note.title.trim() === existingNote.title.trim();
          
          // Check if patient matches (by _id or by name)
          const samePatient = 
            (note.patient?._id && existingNote.patient?._id && 
             note.patient._id === existingNote.patient._id) ||
            (!note.patient?._id && !existingNote.patient?._id &&
             note.patient?.firstName === existingNote.patient?.firstName &&
             note.patient?.lastName === existingNote.patient?.lastName);
          
          // Check if noteType matches
          const sameNoteType = note.noteType === existingNote.noteType;
          
          // Check if created on the same day (duplicates are usually created on the same day)
          const sameDay = new Date(note.createdAt).toDateString() === new Date(existingNote.createdAt).toDateString();
          
          // If all match and same day, it's a duplicate
          if (sameTitle && samePatient && sameNoteType && sameDay) {
            isDuplicate = true;
            console.log(`Found duplicate note: "${note.title}" for patient, created on same day. Keeping first occurrence.`);
            break;
          }
        }
        
        // Only add if not a duplicate
        if (!isDuplicate) {
          uniqueNotesMap.set(note._id, note);
        }
      });
      
      // Convert map back to array
      const uniqueNotes = Array.from(uniqueNotesMap.values());

      setNotes(uniqueNotes);

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
        const patientsResponse = await axios.get('/api/patients?limit=1000');
        patientsData = patientsResponse.data?.patients || patientsResponse.data || [];
        console.log('Patients response:', patientsData);
      } catch (patientError) {
        console.error('Error fetching patients:', patientError);
        patientsData = [];
      }

      // Fetch doctors
      let doctorsData = [];
      try {
        const doctorsResponse = await axios.get('/api/auth/doctors');
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
        await axios.delete(`/api/notes/${noteId}`);
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
    // Convert hex to rgba for better transparency
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };
    
    return {
      borderLeft: `4px solid ${color}`,
      backgroundColor: hexToRgba(color, 0.05)
    };
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <FileText className="w-8 h-8 mr-3 text-blue-600" />
              Patient Notes
            </h1>
            <p className="text-sm text-gray-500">View and manage all patient medical notes</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-4 py-2.5 border rounded-lg transition-all ${
                showFilters 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </button>
            <button
              onClick={() => navigate('/notes/new')}
              className="flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Note
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Patient</label>
              <select
                name="patientId"
                value={filterOptions.patientId}
                onChange={handleFilterChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-medium"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Doctor</label>
                <select
                  name="doctorId"
                  value={filterOptions.doctorId}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-medium"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Note Type</label>
              <select
                name="noteType"
                value={filterOptions.noteType}
                onChange={handleFilterChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-medium"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="search"
                  value={filterOptions.search}
                  onChange={handleFilterChange}
                  placeholder="Search notes..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-5 space-x-3">
            <button
              onClick={handleResetFilters}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium transition-all"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all shadow-sm hover:shadow-md"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}


      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">Loading notes...</p>
        </div>
      ) : notes.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-lg text-center border border-gray-100">
          <FileText className="mx-auto text-gray-300 w-16 h-16 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No notes found</h3>
          <p className="text-gray-500">Create a new note or adjust your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {notes.map(note => (
            note._id ? (
              <div
                key={note._id}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-150 border border-gray-100"
                style={getNoteStyle(note.colorCode)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{note.title || 'Untitled Note'}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1.5 text-gray-400" />
                        <span className="font-medium text-gray-700">Patient:</span>
                        <span className="ml-1 text-gray-900">
                          {note.patient ?
                            (note.patient.firstName || note.patient.lastName ?
                              `${note.patient.firstName || ''} ${note.patient.lastName || ''}`.trim() :
                              'Unknown Patient') :
                            'Unknown Patient'}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Tag className="w-4 h-4 mr-1.5 text-gray-400" />
                        <span className="font-medium text-gray-700">Type:</span>
                        <span className="ml-1 text-gray-900">{note.noteType || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                        <span className="font-medium text-gray-700">Created:</span>
                        <span className="ml-1 text-gray-900">
                          {(() => {
                            try {
                              return note.createdAt ? new Date(note.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              }) : 'Unknown Date';
                            } catch {
                              return 'Invalid Date';
                            }
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => note._id && handlePrintNote(note._id)}
                      className="p-2.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-150"
                      title="Print Note"
                      disabled={!note._id}
                    >
                      <Printer className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => note._id && navigate(`/notes/${note._id}/edit`)}
                      className="p-2.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition-all duration-150"
                      title="Edit Note"
                      disabled={!note._id}
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => note._id && handleDeleteNote(note._id)}
                      className="p-2.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-150"
                      title="Delete Note"
                      disabled={!note._id}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 mb-4">
                  <div
                    className="text-gray-700 line-clamp-3 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: (note.content || '').substring(0, 200) + ((note.content && note.content.length > 200) ? '...' : '') }}
                  />
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                  {note.diagnosisCodes && note.diagnosisCodes.length > 0 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                      {note.diagnosisCodes.length} Diagnosis {note.diagnosisCodes.length === 1 ? 'Code' : 'Codes'}
                    </span>
                  )}
                  {note.treatmentCodes && note.treatmentCodes.length > 0 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                      {note.treatmentCodes.length} Treatment {note.treatmentCodes.length === 1 ? 'Code' : 'Codes'}
                    </span>
                  )}
                  {note.attachments && note.attachments.length > 0 && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                      {note.attachments.length} {note.attachments.length === 1 ? 'Attachment' : 'Attachments'}
                    </span>
                  )}
                  {note.isAiGenerated && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Generated
                    </span>
                  )}
                </div>
              </div>
            ) : null
          ))}
        </div>
      )}

      {!loading && pagination.pages > 1 && (
        <div className="flex justify-center mt-8">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className={`relative inline-flex items-center px-3 py-2 rounded-l-lg border border-gray-300 bg-white text-sm font-medium transition-all ${
                pagination.page === 1
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" />
            </button>

            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-all ${
                  pagination.page === page
                    ? 'z-10 bg-blue-600 border-blue-600 text-white shadow-md'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className={`relative inline-flex items-center px-3 py-2 rounded-r-lg border border-gray-300 bg-white text-sm font-medium transition-all ${
                pagination.page === pagination.pages
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default NotesPage;