import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPlus, FaFileAlt, FaTrash, FaEdit, FaPrint } from 'react-icons/fa';

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

interface PatientNotesProps {
  patientId: string;
}

const PatientNotes: React.FC<PatientNotesProps> = ({ patientId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPatientNotes();
  }, [patientId]);

  const fetchPatientNotes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/notes/patient/${patientId}`);
      setNotes(response.data || []);
    } catch (error) {
      console.error('Error fetching patient notes:', error);
      toast.error('Failed to fetch patient notes');
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId: string) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await axios.delete(`http://localhost:5000/api/notes/${noteId}`);
        toast.success('Note deleted successfully');
        fetchPatientNotes();
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

  // Create new note for this patient
  const handleCreateNote = () => {
    navigate(`/notes/new?patientId=${patientId}`);
  };

  // Get background color style based on note's color code
  const getNoteStyle = (colorCode: string) => {
    return {
      borderLeft: `4px solid ${colorCode}`,
      backgroundColor: `${colorCode}10` // Add slight transparency
    };
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Patient Notes</h2>
        <button
          onClick={handleCreateNote}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          <FaPlus className="mr-2" /> New Note
        </button>
      </div>

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
    </div>
  );
};

export default PatientNotes;