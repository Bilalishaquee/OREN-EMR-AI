import fs from 'fs';
import path from 'path';

// Save AI response to JSON file for debugging
export const saveAIResponseToFile = (noteType, patientId, response, jsonData = null) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${noteType}_${patientId}_${timestamp}.json`;
    const filepath = path.join(process.cwd(), 'server', 'debug', filename);
    
    // Ensure debug directory exists
    const debugDir = path.dirname(filepath);
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    
    const debugData = {
      timestamp: new Date().toISOString(),
      noteType,
      patientId,
      rawResponse: response,
      parsedJson: jsonData,
      formattedNote: jsonData ? formatConsultationNote(jsonData) : null
    };
    
    fs.writeFileSync(filepath, JSON.stringify(debugData, null, 2));
    console.log(`AI response saved to: ${filepath}`);
    
    return filepath;
  } catch (error) {
    console.error('Error saving AI response to file:', error);
    return null;
  }
};

// Format consultation note from JSON structure
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
