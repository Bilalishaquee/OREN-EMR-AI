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
  const [rawPatientsData, setRawPatientsData] = useState<any[]>([]);
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
      
      // Validate and sanitize the response data
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
      
      // Safely access pagination data with fallback values
      const paginationData = response.data?.pagination || {};
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
      console.log('Fetching filter data...');
      
      // Try to fetch patients with fallback endpoints
      let patientsData = [];
      try {
        // First try the debug endpoint to see what's in the database
        try {
          const debugResponse = await axios.get('http://localhost:5000/api/patients/debug');
          console.log('Debug endpoint response:', debugResponse.data);
        } catch (debugError) {
          console.log('Debug endpoint failed:', debugError);
        }
        
        const patientsResponse = await axios.get('http://localhost:5000/api/patients?limit=1000');
              console.log('Primary patients response:', patientsResponse.data);
      console.log('First patient from API:', patientsResponse.data?.patients?.[0]);
      console.log('First patient firstName:', patientsResponse.data?.patients?.[0]?.firstName);
      console.log('First patient lastName:', patientsResponse.data?.patients?.[0]?.lastName);
      console.log('First patient dynamicData:', patientsResponse.data?.patients?.[0]?.dynamicData);
      patientsData = patientsResponse.data?.patients || patientsResponse.data || [];
      } catch (patientError) {
        console.log('Primary patients endpoint failed, trying alternative...');
        try {
          const altPatientsResponse = await axios.get('http://localhost:5000/api/patients');
          console.log('Alternative patients response:', altPatientsResponse.data);
          patientsData = altPatientsResponse.data?.patients || altPatientsResponse.data || [];
        } catch (altError) {
          console.error('Both patients endpoints failed:', altError);
          patientsData = [];
        }
      }
      
      // Try to fetch doctors
      let doctorsData = [];
      try {
        const doctorsResponse = await axios.get('http://localhost:5000/api/auth/doctors');
        console.log('Doctors response:', doctorsResponse.data);
        doctorsData = doctorsResponse.data || [];
      } catch (doctorError) {
        console.error('Doctors endpoint failed:', doctorError);
        doctorsData = [];
      }
      
            console.log('Extracted patients data:', patientsData);
      console.log('First patient structure:', patientsData[0]);
      console.log('First patient keys:', patientsData[0] ? Object.keys(patientsData[0]) : 'No patients');
      console.log('First patient dynamicData:', patientsData[0]?.dynamicData);
      console.log('First patient firstName:', patientsData[0]?.firstName);
      console.log('First patient lastName:', patientsData[0]?.lastName);
      
      // Store raw data for debugging
      setRawPatientsData(patientsData);
      
      // Test: Let's see what the first patient actually contains
      if (patientsData.length > 0) {
        console.log('=== PATIENT DATA ANALYSIS ===');
        console.log('Total patients:', patientsData.length);
        console.log('First patient full object:', JSON.stringify(patientsData[0], null, 2));
        console.log('First patient dynamicData:', JSON.stringify(patientsData[0]?.dynamicData, null, 2));
        console.log('First patient firstName property:', patientsData[0]?.firstName);
        console.log('First patient lastName property:', patientsData[0]?.lastName);
        console.log('=== END ANALYSIS ===');
      }
      
      // Validate and sanitize patient data
      const sanitizedPatients = patientsData
        .filter((patient: any) => patient && patient._id)
        .map((patient: any) => {
          // Handle different possible data structures
          let firstName = '';
          let lastName = '';
          
          console.log('Processing patient:', patient._id, 'Raw patient data:', patient);
          console.log('Patient firstName:', patient.firstName, 'lastName:', patient.lastName);
          console.log('Patient dynamicData:', patient.dynamicData);
          
          // Primary: Try direct properties first (server already extracts from dynamicData)
          if (patient.firstName) {
            firstName = patient.firstName;
            console.log('Found firstName in direct property:', firstName);
          }
          if (patient.lastName) {
            lastName = patient.lastName;
            console.log('Found lastName in direct property:', lastName);
          }
          
          // Fallback: Try to get firstName and lastName from dynamicData (if not already extracted)
          if (!firstName && patient.dynamicData && typeof patient.dynamicData === 'object') {
            // Check for both formats: "firstName" and "First Name"
            firstName = patient.dynamicData.firstName || patient.dynamicData['First Name'] || '';
            lastName = patient.dynamicData.lastName || patient.dynamicData['Last Name'] || '';
            console.log('Found names in dynamicData:', { firstName, lastName, patientId: patient._id });
            console.log('dynamicData object:', patient.dynamicData);
          }
          
          // Additional fallback: Check if dynamicData is a Map
          if (!firstName && patient.dynamicData && patient.dynamicData instanceof Map) {
            firstName = patient.dynamicData.get('firstName') || '';
            lastName = patient.dynamicData.get('lastName') || '';
            console.log('Found names in dynamicData Map:', { firstName, lastName, patientId: patient._id });
          }
          
          // Last resort: Try to extract from formData
          if (!firstName && !lastName && patient.formData && Array.isArray(patient.formData)) {
            const intakeForm = patient.formData.find((form: any) => form.formType === 'intake');
            if (intakeForm && intakeForm.data) {
              firstName = intakeForm.data.firstName || intakeForm.data['First Name'] || '';
              lastName = intakeForm.data.lastName || intakeForm.data['Last Name'] || '';
            }
          }
          
          // If still no names, try to extract from any other possible locations
          if (!firstName && !lastName) {
            // Check if the patient object has any string properties that might be names
            for (const [key, value] of Object.entries(patient)) {
              if (typeof value === 'string' && value.length > 0) {
                if (key.toLowerCase().includes('first') || key.toLowerCase().includes('name')) {
                  firstName = value;
                  console.log('Found firstName in key:', key, 'value:', value);
                }
                if (key.toLowerCase().includes('last') || key.toLowerCase().includes('surname')) {
                  lastName = value;
                  console.log('Found lastName in key:', key, 'value:', value);
                }
              }
            }
          }
          
          // Final fallback: If we still don't have names, try to extract from any nested objects
          if (!firstName && !lastName) {
            // Check if there are any nested objects that might contain names
            for (const [key, value] of Object.entries(patient)) {
              if (typeof value === 'object' && value !== null && value !== undefined) {
                const nestedObj = value as any;
                if (nestedObj.firstName) {
                  firstName = nestedObj.firstName;
                  console.log('Found firstName in nested object:', key, 'value:', nestedObj.firstName);
                }
                if (nestedObj.lastName) {
                  lastName = nestedObj.lastName;
                  console.log('Found lastName in nested object:', key, 'value:', nestedObj.lastName);
                }
              }
            }
          }
          
          const result = {
            _id: patient._id || '',
            firstName: firstName || '',
            lastName: lastName || '',
            dateOfBirth: patient.dynamicData?.dateOfBirth || patient.dateOfBirth || '',
          };
          
          console.log('Final patient result:', result);
          console.log('Result firstName:', result.firstName, 'lastName:', result.lastName);
          return result;
        })
        .filter((patient: any) => {
          const hasName = patient.firstName || patient.lastName;
          console.log('Filtering patient:', patient._id, 'hasName:', hasName, 'firstName:', patient.firstName, 'lastName:', patient.lastName);
          return hasName;
        }); // Only include patients with names
      
      console.log('Sanitized patients:', sanitizedPatients);
      console.log('Sanitized patients count:', sanitizedPatients.length);
      console.log('First sanitized patient:', sanitizedPatients[0]);
      
      // Debug: Check if any patients have names
      const patientsWithNames = sanitizedPatients.filter((p: any) => p.firstName || p.lastName);
      console.log('Patients with names:', patientsWithNames.length);
      console.log('Patients with names details:', patientsWithNames);
      
      // TEMPORARY FIX: Let's bypass all the complex logic and just show what we have
      console.log('=== TEMPORARY FIX TEST ===');
      const tempPatients = patientsData.map((patient: any, index: number) => {
        // Try to get any name from any possible location
        let displayFirstName = '';
        let displayLastName = '';
        
        // Check direct properties
        if (patient.firstName) displayFirstName = patient.firstName;
        if (patient.lastName) displayLastName = patient.lastName;
        
        // Check dynamicData with various formats
        if (patient.dynamicData) {
          if (!displayFirstName) {
            displayFirstName = patient.dynamicData.firstName || 
                             patient.dynamicData['First Name'] || 
                             patient.dynamicData['first_name'] || '';
          }
          if (!displayLastName) {
            displayLastName = patient.dynamicData.lastName || 
                            patient.dynamicData['Last Name'] || 
                            patient.dynamicData['last_name'] || '';
          }
        }
        
        // If still no names, use fallback
        if (!displayFirstName && !displayLastName) {
          displayFirstName = 'Patient';
          displayLastName = `#${index + 1}`;
        }
        
        console.log(`Patient ${index + 1}:`, {
          _id: patient._id,
          originalFirstName: patient.firstName,
          originalLastName: patient.lastName,
          dynamicData: patient.dynamicData,
          finalFirstName: displayFirstName,
          finalLastName: displayLastName
        });
        
        return {
          _id: patient._id || '',
          firstName: displayFirstName,
          lastName: displayLastName,
          dateOfBirth: patient.dynamicData?.dateOfBirth || patient.dateOfBirth || '',
        };
      });
      
      console.log('Temp patients result:', tempPatients);
      setPatients(tempPatients);
      setDoctors(doctorsData);
      
    } catch (error) {
      console.error('Error in fetchFilterData:', error);
      // Set empty arrays on error to prevent crashes
      setPatients([]);
      setDoctors([]);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchFilterData();
  }, [pagination.page, pagination.limit]);

  // Separate useEffect for initial load to avoid dependency issues
  useEffect(() => {
    fetchFilterData();
  }, []);

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
  const getNoteStyle = (colorCode: string | null | undefined) => {
    const defaultColor = '#e5e7eb'; // Default gray color
    const color = colorCode || defaultColor;
    
    return {
      borderLeft: `4px solid ${color}`,
      backgroundColor: `${color}10` // Add slight transparency
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
                {patients && patients.length > 0 ? (
                  patients.map(patient => {
                    console.log('=== DROPDOWN RENDERING ===');
                    console.log('Rendering patient option:', patient);
                    console.log('Patient _id:', patient._id);
                    console.log('Patient firstName:', patient.firstName);
                    console.log('Patient lastName:', patient.lastName);
                    
                    const displayName = patient.firstName && patient.lastName 
                      ? `${patient.firstName} ${patient.lastName}`.trim()
                      : patient.firstName || patient.lastName || 'Unknown Patient';
                    
                    console.log('Final display name:', displayName);
                    console.log('=== END DROPDOWN RENDERING ===');
                    
                    return (
                      <option key={patient._id} value={patient._id}>
                        {displayName}
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

      {/* Debug Info - Remove this in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-100 p-4 rounded-md mb-6 text-sm">
          <h4 className="font-semibold mb-2">Debug Info:</h4>
          <p>Patients loaded: {patients.length}</p>
          <p>Doctors loaded: {doctors.length}</p>
          <details className="mt-2">
            <summary>Raw Patient Data from API</summary>
            <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(rawPatientsData, null, 2)}
            </pre>
          </details>
          <details className="mt-2">
            <summary>Sanitized Patient Data</summary>
            <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(patients, null, 2)}
            </pre>
          </details>
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