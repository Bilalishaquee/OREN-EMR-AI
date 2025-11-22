import React from 'react';

interface ConsultationNoteData {
  patientInfo: {
    name: string;
    dateOfBirth: string;
    location: string;
    dateOfService: string;
  };
  correspondingForm: {
    mrn: string;
    assessment: string;
    plan: {
      medications: string;
      therapy: string;
      outsideImaging: string;
      splint: {
        type: string;
        status: string;
      };
      injections: {
        type: string;
        location: string;
        medication: string;
      };
    };
    workSchoolStatus: string;
    specificComments: string;
  };
  clinicalSections: {
    chiefComplaint: string;
    hpi: string;
    objective: string;
    assessment: string;
    plan: string;
  };
}

interface ConsultationNoteDisplayProps {
  noteData: ConsultationNoteData;
  className?: string;
}

const ConsultationNoteDisplay: React.FC<ConsultationNoteDisplayProps> = ({ 
  noteData, 
  className = "" 
}) => {
  const { patientInfo, correspondingForm, clinicalSections } = noteData;

  return (
    <div className={`consultation-note ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Notes</h2>
        <p className="text-sm text-gray-600 mb-3">
          I expect that the following will be carried over directly from the intake form or EMR
        </p>
        <ul className="space-y-1">
          <li><strong>Patient Name:</strong> {patientInfo.name}</li>
          <li><strong>Patient Date of Birth:</strong> {patientInfo.dateOfBirth}</li>
          <li><strong>Location:</strong> {patientInfo.location}</li>
          <li><strong>Date of Service:</strong> {patientInfo.dateOfService}</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Corresponding Form</h3>
        <ul className="space-y-1">
          <li><strong>MRN:</strong> {correspondingForm.mrn}</li>
          <li><strong>Assessment:</strong> {correspondingForm.assessment}</li>
          <li><strong>Plan:</strong></li>
          <ul className="ml-4 space-y-1">
            <li>Medications: {correspondingForm.plan.medications}</li>
            <li>Therapy: {correspondingForm.plan.therapy}</li>
            <li>Outside Imaging or Nerve Study: {correspondingForm.plan.outsideImaging}</li>
            <li>Splint: {correspondingForm.plan.splint.status}</li>
            <ul className="ml-4">
              <li>Type: {correspondingForm.plan.splint.type}</li>
            </ul>
            <li>Injections: {correspondingForm.plan.injections.type}</li>
            <ul className="ml-4">
              <li>Location: {correspondingForm.plan.injections.location}</li>
              <li>Medication: {correspondingForm.plan.injections.medication}</li>
            </ul>
          </ul>
          <li><strong>Work/School Status:</strong> {correspondingForm.workSchoolStatus}</li>
          <li><strong>Specific Comments:</strong> {correspondingForm.specificComments}</li>
        </ul>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Chief Complaint:</h3>
        <p>{clinicalSections.chiefComplaint}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">HPI (History of Present Illness):</h3>
        <p className="whitespace-pre-wrap">{clinicalSections.hpi}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Objective:</h3>
        <p className="whitespace-pre-wrap">{clinicalSections.objective}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Assessment:</h3>
        <p className="whitespace-pre-wrap">{clinicalSections.assessment}</p>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Plan:</h3>
        <p className="whitespace-pre-wrap">{clinicalSections.plan}</p>
      </div>
    </div>
  );
};

export default ConsultationNoteDisplay;
