import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ArrowLeft, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';

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

const NotePrintView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Fetch note data
  useEffect(() => {
    const fetchNote = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`/api/notes/${id}`);
        setNote(response.data);
      } catch (error) {
        console.error('Error fetching note:', error);
        toast.error('Failed to load note');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNote();
  }, [id]);

  // Handle print functionality
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: note?.title || 'Medical Note',
    onBeforeGetContent: () => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, 500);
      });
    },
    onAfterPrint: () => {
      toast.success('Note printed successfully');
    },
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h3 className="text-xl font-medium text-gray-700">Note not found</h3>
          <p className="text-gray-500 mt-2">The requested note could not be found</p>
          <button
            onClick={() => navigate('/notes')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Back to Notes
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
            onClick={() => navigate('/notes')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft />
          </button>
          <h1 className="text-2xl font-bold">Print Note</h1>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          <Printer className="mr-2" /> Print
        </button>
      </div>

      {/* Printable content */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div ref={printRef} className="p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 border-b pb-4">
            <h1 className="text-2xl font-bold mb-2">{note.title}</h1>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Patient:</strong> {note.patient.firstName} {note.patient.lastName}</p>
                <p><strong>DOB:</strong> {new Date(note.patient.dateOfBirth).toLocaleDateString()}</p>
                {note.visit && (
                  <p>
                    <strong>Visit:</strong> {note.visit.visitType.charAt(0).toUpperCase() + note.visit.visitType.slice(1)} Visit - {new Date(note.visit.date).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div>
                <p><strong>Provider:</strong> Dr. {note.doctor.firstName} {note.doctor.lastName}</p>
                <p><strong>Date:</strong> {new Date(note.createdAt).toLocaleDateString()}</p>
                <p><strong>Note Type:</strong> {note.noteType}</p>
              </div>
            </div>
          </div>

          {/* Note content */}
          <div className="mb-8">
            <div dangerouslySetInnerHTML={{ __html: note.content }} />
          </div>

          {/* Diagnosis and Treatment Codes */}
          {(note.diagnosisCodes.length > 0 || note.treatmentCodes.length > 0) && (
            <div className="mb-8 border-t pt-4">
              {note.diagnosisCodes.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Diagnosis Codes</h3>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Code</th>
                        <th className="border p-2 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {note.diagnosisCodes.map(code => (
                        <tr key={code.code}>
                          <td className="border p-2">{code.code}</td>
                          <td className="border p-2">{code.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {note.treatmentCodes.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Treatment Codes</h3>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">Code</th>
                        <th className="border p-2 text-left">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {note.treatmentCodes.map(code => (
                        <tr key={code.code}>
                          <td className="border p-2">{code.code}</td>
                          <td className="border p-2">{code.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Attachments list (not the actual files) */}
          {note.attachments.length > 0 && (
            <div className="mb-8 border-t pt-4">
              <h3 className="text-lg font-semibold mb-2">Attachments</h3>
              <ul className="list-disc pl-5">
                {note.attachments.map(attachment => (
                  <li key={attachment._id}>{attachment.originalname}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-4 border-t text-sm text-gray-500">
            <p>Generated on {new Date(note.createdAt).toLocaleString()}</p>
            {note.isAiGenerated && (
              <p className="italic">This note was generated with AI assistance</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotePrintView;