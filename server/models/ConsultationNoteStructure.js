// JSON structure for consultation note sections
export const ConsultationNoteStructure = {
  // Basic patient information
  patientInfo: {
    name: "",
    dateOfBirth: "",
    location: "",
    dateOfService: ""
  },
  
  // Corresponding form data
  correspondingForm: {
    mrn: "",
    assessment: "",
    plan: {
      medications: "",
      therapy: "",
      outsideImaging: "",
      splint: {
        type: "",
        status: ""
      },
      injections: {
        type: "",
        location: "",
        medication: ""
      }
    },
    workSchoolStatus: "",
    specificComments: ""
  },
  
  // Clinical sections
  clinicalSections: {
    chiefComplaint: "",
    hpi: "",
    objective: "",
    assessment: "",
    plan: ""
  }
};

// Helper function to create empty consultation note structure
export const createEmptyConsultationNote = () => {
  return {
    patientInfo: {
      name: "",
      dateOfBirth: "",
      location: "Hand Surgery Clinic, Main Campus",
      dateOfService: new Date().toLocaleDateString()
    },
    correspondingForm: {
      mrn: "1234567",
      assessment: "",
      plan: {
        medications: "None",
        therapy: "None",
        outsideImaging: "None",
        splint: {
          type: "",
          status: "None"
        },
        injections: {
          type: "None (Default)",
          location: "",
          medication: "Kenalog"
        }
      },
      workSchoolStatus: "No Restrictions",
      specificComments: ""
    },
    clinicalSections: {
      chiefComplaint: "",
      hpi: "",
      objective: "",
      assessment: "",
      plan: ""
    }
  };
};

// Helper function to format consultation note from JSON structure
export const formatConsultationNote = (noteData) => {
  const { patientInfo, correspondingForm, clinicalSections } = noteData;
  
  return `Notes
I expect that the following will be carried over directly from the intake form or EMR
• Patient Name: ${patientInfo.name}
• Patient Date of Birth: ${patientInfo.dateOfBirth}
• Location: ${patientInfo.location}
• Date of Service: ${patientInfo.dateOfService}

Corresponding Form
• MRN: ${correspondingForm.mrn}
• Assessment: ${correspondingForm.assessment}
• Plan: 
o Medications: ${correspondingForm.plan.medications}
o Therapy: ${correspondingForm.plan.therapy}
o Outside Imaging or Nerve Study: ${correspondingForm.plan.outsideImaging}
o Splint: ${correspondingForm.plan.splint.status}
  Type: ${correspondingForm.plan.splint.type}
o Injections: ${correspondingForm.plan.injections.type}
  Location: ${correspondingForm.plan.injections.location}
  Medication: ${correspondingForm.plan.injections.medication}
• Work/School Status: ${correspondingForm.workSchoolStatus}
• Specific Comments: ${correspondingForm.specificComments}

Chief Complaint: ${clinicalSections.chiefComplaint}

HPI (History of Present Illness): ${clinicalSections.hpi}

Objective: ${clinicalSections.objective}

Assessment: ${clinicalSections.assessment}

Plan: ${clinicalSections.plan}`;
};
