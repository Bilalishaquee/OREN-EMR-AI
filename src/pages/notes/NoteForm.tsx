import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSave, FaArrowLeft, FaSpinner, FaTrash, FaRobot } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

// Import React Quill
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Import color picker
import { ChromePicker } from 'react-color';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

interface Visit {
  _id: string;
  visitType: string;
  date: string;
}

interface DiagnosisCode {
  code: string;
  description: string;
}

interface TreatmentCode {
  code: string;
  description: string;
}

interface Attachment {
  _id?: string;
  filename: string;
  originalname: string;
  path: string;
  mimetype: string;
  size: number;
}

interface Note {
  _id?: string;
  title: string;
  content: string;
  noteType: string;
  colorCode: string;
  patient: string | Patient;
  doctor?: string;
  visit?: string | Visit | null;
  diagnosisCodes: DiagnosisCode[];
  treatmentCodes: TreatmentCode[];
  attachments: Attachment[];
  isAiGenerated: boolean;
}

const NoteForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [note, setNote] = useState<Note>({
    title: '',
    content: '',
    noteType: 'Progress',
    colorCode: '#FFFFFF',
    patient: '',
    visit: null,
    diagnosisCodes: [],
    treatmentCodes: [],
    attachments: [],
    isAiGenerated: false
  });
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [diagnosisSearch, setDiagnosisSearch] = useState<string>('');
  const [treatmentSearch, setTreatmentSearch] = useState<string>('');
  const [diagnosisResults, setDiagnosisResults] = useState<DiagnosisCode[]>([]);
  const [treatmentResults, setTreatmentResults] = useState<TreatmentCode[]>([]);
  const [searchingDiagnosis, setSearchingDiagnosis] = useState<boolean>(false);
  const [searchingTreatment, setSearchingTreatment] = useState<boolean>(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);
  const [generatingNote, setGeneratingNote] = useState<boolean>(false);
  const [promptData, setPromptData] = useState<string>('');
  
  // Quill editor modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'clean']
    ],
  };

  // Fetch note data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch patients
        const patientsResponse = await axios.get('http://localhost:5000/api/patients?limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Patients API response:', patientsResponse.data);
        
        if (patientsResponse.data && Array.isArray(patientsResponse.data.patients)) {
          setPatients(patientsResponse.data.patients);
          console.log('Patients set in state:', patientsResponse.data.patients);
        } else {
          console.error('Invalid patients data structure:', patientsResponse.data);
          setPatients([]);
        }
        
        // If in edit mode, fetch note data
        if (isEditMode && id) {
          const noteResponse = await axios.get(`http://localhost:5000/api/notes/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const noteData = noteResponse.data;
          
          // Format note data for form
          setNote({
            _id: noteData._id,
            title: noteData.title,
            content: noteData.content,
            noteType: noteData.noteType,
            colorCode: noteData.colorCode,
            patient: noteData.patient._id,
            visit: noteData.visit ? noteData.visit._id : null,
            diagnosisCodes: noteData.diagnosisCodes || [],
            treatmentCodes: noteData.treatmentCodes || [],
            attachments: noteData.attachments || [],
            isAiGenerated: noteData.isAiGenerated || false
          });
          
          // Fetch visits for the selected patient
          if (noteData.patient._id) {
            const visitsResponse = await axios.get(`http://localhost:5000/api/visits/patient/${noteData.patient._id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            setVisits(visitsResponse.data);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, isEditMode, token]);

  // Handle patient change and fetch their visits
  const handlePatientChange = async (patientId: string) => {
    setNote(prev => ({ ...prev, patient: patientId, visit: null }));
    
    if (patientId) {
      try {
        const visitsResponse = await axios.get(`http://localhost:5000/api/visits/patient/${patientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setVisits(visitsResponse.data);
      } catch (error) {
        console.error('Error fetching patient visits:', error);
        toast.error('Failed to load patient visits');
      }
    } else {
      setVisits([]);
    }
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNote(prev => ({ ...prev, [name]: value }));
  };

  // Handle rich text editor content change
  const handleContentChange = (content: string) => {
    setNote(prev => ({ ...prev, content }));
  };

  // Handle color change
  const handleColorChange = (color: any) => {
    setNote(prev => ({ ...prev, colorCode: color.hex }));
  };

  // Search for diagnosis codes
  const searchDiagnosisCodes = async () => {
    if (!diagnosisSearch.trim()) return;
    
    setSearchingDiagnosis(true);
    try {
      // This is a mock implementation - replace with actual API call to your diagnosis codes database
      // For demo purposes, we'll create some sample results
      setTimeout(() => {
        const mockResults = [
          { code: 'M54.5', description: 'Low back pain' },
          { code: 'M54.2', description: 'Cervicalgia (neck pain)' },
          { code: 'M25.511', description: 'Pain in right shoulder' },
          { code: 'M25.512', description: 'Pain in left shoulder' },
          { code: 'M79.604', description: 'Pain in right leg' },
          { code: 'M79.605', description: 'Pain in left leg' },
        ].filter(item => 
          item.code.toLowerCase().includes(diagnosisSearch.toLowerCase()) || 
          item.description.toLowerCase().includes(diagnosisSearch.toLowerCase())
        );
        
        setDiagnosisResults(mockResults);
        setSearchingDiagnosis(false);
      }, 500);
    } catch (error) {
      console.error('Error searching diagnosis codes:', error);
      setSearchingDiagnosis(false);
    }
  };

  // Search for treatment codes
  const searchTreatmentCodes = async () => {
    if (!treatmentSearch.trim()) return;
    
    setSearchingTreatment(true);
    try {
      // This is a mock implementation - replace with actual API call to your treatment codes database
      // For demo purposes, we'll create some sample results
      setTimeout(() => {
        const mockResults = [
          { code: '97110', description: 'Therapeutic exercises' },
          { code: '97112', description: 'Neuromuscular reeducation' },
          { code: '97140', description: 'Manual therapy techniques' },
          { code: '97530', description: 'Therapeutic activities' },
          { code: '98940', description: 'Chiropractic manipulation (1-2 regions)' },
          { code: '98941', description: 'Chiropractic manipulation (3-4 regions)' },
        ].filter(item => 
          item.code.toLowerCase().includes(treatmentSearch.toLowerCase()) || 
          item.description.toLowerCase().includes(treatmentSearch.toLowerCase())
        );
        
        setTreatmentResults(mockResults);
        setSearchingTreatment(false);
      }, 500);
    } catch (error) {
      console.error('Error searching treatment codes:', error);
      setSearchingTreatment(false);
    }
  };

  // Add diagnosis code to note
  const addDiagnosisCode = (code: DiagnosisCode) => {
    if (!note.diagnosisCodes.some(c => c.code === code.code)) {
      setNote(prev => ({
        ...prev,
        diagnosisCodes: [...prev.diagnosisCodes, code]
      }));
    }
    setDiagnosisSearch('');
    setDiagnosisResults([]);
  };

  // Add treatment code to note
  const addTreatmentCode = (code: TreatmentCode) => {
    if (!note.treatmentCodes.some(c => c.code === code.code)) {
      setNote(prev => ({
        ...prev,
        treatmentCodes: [...prev.treatmentCodes, code]
      }));
    }
    setTreatmentSearch('');
    setTreatmentResults([]);
  };

  // Remove diagnosis code from note
  const removeDiagnosisCode = (code: string) => {
    setNote(prev => ({
      ...prev,
      diagnosisCodes: prev.diagnosisCodes.filter(c => c.code !== code)
    }));
  };

  // Remove treatment code from note
  const removeTreatmentCode = (code: string) => {
    setNote(prev => ({
      ...prev,
      treatmentCodes: prev.treatmentCodes.filter(c => c.code !== code)
    }));
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFilesToUpload(prev => [...prev, ...newFiles]);
    }
  };

  // Remove selected file before upload
  const removeSelectedFile = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  // Mark existing attachment for removal
  const markAttachmentForRemoval = (attachmentId: string) => {
    setFilesToRemove(prev => [...prev, attachmentId]);
    setNote(prev => ({
      ...prev,
      attachments: prev.attachments.filter(a => a._id !== attachmentId)
    }));
  };

  // Generate note using AI
  const generateNote = async () => {
    if (!note.patient || !note.noteType) {
      toast.error('Please select a patient and note type before generating');
      return;
    }
    
    setGeneratingNote(true);
    try {
      const response = await axios.post('http://localhost:5000/api/notes/generate', {
        patientId: note.patient,
        visitId: note.visit,
        noteType: note.noteType,
        promptData: promptData
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Note generated successfully');
        navigate(`/notes/${response.data.note._id}/edit`);
      } else {
        toast.error('Failed to generate note');
      }
    } catch (error) {
      console.error('Error generating note:', error);
      toast.error('Failed to generate note');
    } finally {
      setGeneratingNote(false);
    }
  };

  // Save note
  const saveNote = async () => {
    // Validate required fields
    if (!note.title || !note.content || !note.patient) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setSaving(true);
    try {
      // Create form data for file uploads
      const formData = new FormData();
      formData.append('title', note.title);
      formData.append('content', note.content);
      formData.append('noteType', note.noteType);
      formData.append('colorCode', note.colorCode);
      formData.append('patientId', note.patient.toString());
      
      if (note.visit) {
        formData.append('visitId', note.visit.toString());
      }
      
      // Add diagnosis codes
      if (note.diagnosisCodes.length > 0) {
        formData.append('diagnosisCodes', JSON.stringify(note.diagnosisCodes));
      }
      
      // Add treatment codes
      if (note.treatmentCodes.length > 0) {
        formData.append('treatmentCodes', JSON.stringify(note.treatmentCodes));
      }
      
      // Add files to upload
      filesToUpload.forEach(file => {
        formData.append('attachments', file);
      });
      
      // Add files to remove
      if (filesToRemove.length > 0) {
        formData.append('removeAttachments', JSON.stringify(filesToRemove));
      }
      
      // Add AI generated flag
      formData.append('isAiGenerated', note.isAiGenerated.toString());
      
      // Ensure we have the token
      if (!token) {
        console.error('Authentication token is missing');
        toast.error('Authentication error. Please log in again.');
        return;
      }
      
      let response;
      if (isEditMode && id) {
        // Update existing note
        response = await axios.put(`http://localhost:5000/api/notes/${id}`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}` 
          }
        });
        toast.success('Note updated successfully');
      } else {
        // Create new note
        response = await axios.post('http://localhost:5000/api/notes', formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}` 
          }
        });
        toast.success('Note created successfully');
      }
      
      // Navigate back to notes list
      navigate('/notes');
    } catch (error) {
      console.error('Error saving note:', error);
      // Log more detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        toast.error(`Failed to save note: ${error.response.data.message || error.response.status}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        toast.error('Failed to save note: No response received from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        toast.error(`Failed to save note: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/notes')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Edit Note' : 'Create New Note'}
          </h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={generateNote}
            disabled={!note.patient || !note.noteType || generatingNote}
            className={`flex items-center px-4 py-2 rounded-md ${generatingNote || !note.patient || !note.noteType ? 'bg-gray-300 cursor-not-allowed' : 'bg-purple-500 text-white hover:bg-purple-600'}`}
          >
            {generatingNote ? <FaSpinner className="animate-spin mr-2" /> : <FaRobot className="mr-2" />}
            Generate with AI
          </button>
          <button
            onClick={saveNote}
            disabled={saving}
            className={`flex items-center px-4 py-2 bg-blue-500 text-white rounded-md ${saving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'}`}
          >
            {saving ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
            Save Note
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {/* Debug information */}
        <div className="mb-4 p-4 bg-gray-100 rounded-md">
          <h3 className="font-bold">Debug Info:</h3>
          <p>Patients count: {patients ? patients.length : 0}</p>
          <p>First few patients: {patients && patients.length > 0 ? 
            patients.slice(0, 3).map(p => `${p.firstName} ${p.lastName}`).join(', ') + 
            (patients.length > 3 ? '...' : '') : 'None'}</p>
        </div>
        
        {/* Basic Note Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={note.title}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              placeholder="Note Title"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note Type *</label>
            <select
              name="noteType"
              value={note.noteType}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="Progress">Progress Note</option>
              <option value="Consultation">Consultation Note</option>
              <option value="Pre-Operative">Pre-Operative Note</option>
              <option value="Post-Operative">Post-Operative Note</option>
              <option value="Legal">Legal Narrative</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
            <select
              name="patient"
              value={typeof note.patient === 'string' ? note.patient : note.patient?._id || ''}
              onChange={(e) => handlePatientChange(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Select Patient</option>
              {patients && patients.length > 0 ? (
                patients.map(patient => (
                  <option key={patient._id} value={patient._id}>
                    {patient.firstName} {patient.lastName} ({new Date(patient.dateOfBirth).toLocaleDateString()})
                  </option>
                ))
              ) : (
                <option value="" disabled>No patients available</option>
              )}
            </select>
            {patients && patients.length === 0 && (
              <p className="text-red-500 text-sm mt-1">No patients found. Please check your connection or permissions.</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Related Visit</label>
            <select
              name="visit"
              value={note.visit ? note.visit.toString() : ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md"
            >
              <option value="">None</option>
              {visits && visits.map(visit => (
                <option key={visit._id} value={visit._id}>
                  {visit.visitType.charAt(0).toUpperCase() + visit.visitType.slice(1)} Visit - {new Date(visit.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color Code</label>
            <div className="flex items-center">
              <div
                className="w-10 h-10 border rounded-md mr-2 cursor-pointer"
                style={{ backgroundColor: note.colorCode }}
                onClick={() => setShowColorPicker(!showColorPicker)}
              />
              <input
                type="text"
                name="colorCode"
                value={note.colorCode}
                onChange={handleChange}
                className="w-32 p-2 border rounded-md"
              />
              {showColorPicker && (
                <div className="absolute z-10 mt-2">
                  <div className="fixed inset-0" onClick={() => setShowColorPicker(false)} />
                  <ChromePicker color={note.colorCode} onChange={handleColorChange} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rich Text Editor */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Note Content *</label>
          <ReactQuill
            theme="snow"
            value={note.content}
            onChange={handleContentChange}
            modules={quillModules}
            className="h-64 mb-12"
          />
        </div>

        {/* Diagnosis and Treatment Codes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Codes</label>
            <div className="flex">
              <input
                type="text"
                value={diagnosisSearch}
                onChange={(e) => setDiagnosisSearch(e.target.value)}
                placeholder="Search diagnosis codes..."
                className="w-full p-2 border rounded-l-md"
              />
              <button
                onClick={searchDiagnosisCodes}
                disabled={searchingDiagnosis || !diagnosisSearch.trim()}
                className={`px-4 py-2 rounded-r-md ${searchingDiagnosis || !diagnosisSearch.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              >
                {searchingDiagnosis ? <FaSpinner className="animate-spin" /> : 'Search'}
              </button>
            </div>
            
            {diagnosisResults.length > 0 && (
              <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                {diagnosisResults.map(code => (
                  <div
                    key={code.code}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                    onClick={() => addDiagnosisCode(code)}
                  >
                    <div>
                      <span className="font-medium">{code.code}</span> - {code.description}
                    </div>
                    <button className="text-blue-500 hover:text-blue-700">Add</button>
                  </div>
                ))}
              </div>
            )}
            
            {note.diagnosisCodes.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Diagnosis Codes:</h4>
                <div className="space-y-2">
                  {note.diagnosisCodes.map(code => (
                    <div key={code.code} className="flex justify-between items-center p-2 bg-blue-50 rounded-md">
                      <div>
                        <span className="font-medium">{code.code}</span> - {code.description}
                      </div>
                      <button
                        onClick={() => removeDiagnosisCode(code.code)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Codes</label>
            <div className="flex">
              <input
                type="text"
                value={treatmentSearch}
                onChange={(e) => setTreatmentSearch(e.target.value)}
                placeholder="Search treatment codes..."
                className="w-full p-2 border rounded-l-md"
              />
              <button
                onClick={searchTreatmentCodes}
                disabled={searchingTreatment || !treatmentSearch.trim()}
                className={`px-4 py-2 rounded-r-md ${searchingTreatment || !treatmentSearch.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
              >
                {searchingTreatment ? <FaSpinner className="animate-spin" /> : 'Search'}
              </button>
            </div>
            
            {treatmentResults.length > 0 && (
              <div className="mt-2 border rounded-md max-h-40 overflow-y-auto">
                {treatmentResults.map(code => (
                  <div
                    key={code.code}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                    onClick={() => addTreatmentCode(code)}
                  >
                    <div>
                      <span className="font-medium">{code.code}</span> - {code.description}
                    </div>
                    <button className="text-blue-500 hover:text-blue-700">Add</button>
                  </div>
                ))}
              </div>
            )}
            
            {note.treatmentCodes.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Treatment Codes:</h4>
                <div className="space-y-2">
                  {note.treatmentCodes.map(code => (
                    <div key={code.code} className="flex justify-between items-center p-2 bg-green-50 rounded-md">
                      <div>
                        <span className="font-medium">{code.code}</span> - {code.description}
                      </div>
                      <button
                        onClick={() => removeTreatmentCode(code.code)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* File Attachments */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
          <div className="flex items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept="image/jpeg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Select Files
            </button>
            <span className="ml-2 text-sm text-gray-500">
              Supported formats: Images, PDFs, and Office documents (max 10MB each)
            </span>
          </div>
          
          {/* Display selected files */}
          {filesToUpload.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Files to Upload:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filesToUpload.map((file, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <div className="truncate">
                      <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                    <button
                      onClick={() => removeSelectedFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Display existing attachments */}
          {note.attachments.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Attachments:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {note.attachments.map(attachment => (
                  <div key={attachment._id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <div className="truncate">
                      <span className="font-medium">{attachment.originalname}</span> ({(attachment.size / 1024).toFixed(1)} KB)
                    </div>
                    <div className="flex space-x-2">
                      <a
                        href={`/${attachment.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        View
                      </a>
                      <button
                        onClick={() => markAttachmentForRemoval(attachment._id!)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Generation Prompt */}
        {!isEditMode && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information for AI Generation</label>
            <textarea
              value={promptData}
              onChange={(e) => setPromptData(e.target.value)}
              placeholder="Add any additional information you'd like to include in the AI-generated note..."
              className="w-full p-2 border rounded-md h-24"
            />
            <p className="text-sm text-gray-500 mt-1">
              This information will be used when generating a note with AI. It will not be saved unless you generate a note.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteForm;