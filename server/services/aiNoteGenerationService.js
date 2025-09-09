import Patient from '../models/Patient.js';
import { Visit } from '../models/Visit.js';
import Note from '../models/Note.js';
import { createEmptyConsultationNote, formatConsultationNote } from '../models/ConsultationNoteStructure.js';
import { saveAIResponseToFile, formatConsultationNote as formatNote } from '../utils/noteFormatter.js';

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

class AINoteGenerationService {
  
  // Call Gemini API
  async callGeminiAPI(systemPrompt, userPrompt) {
    try {
      console.log('Calling Gemini API...');
      console.log('System Prompt Length:', systemPrompt.length);
      console.log('User Prompt Length:', userPrompt.length);
      
      // Validate inputs
      if (!systemPrompt || !userPrompt) {
        throw new Error('System prompt and user prompt are required');
      }
      
      if (systemPrompt.length > 100000 || userPrompt.length > 100000) {
        throw new Error('Prompt too long. Maximum 100,000 characters allowed.');
      }
      
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\n${userPrompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
            topP: 0.8,
            topK: 10
          }
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      console.log('Gemini API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error Response:', errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini API Response Data:', JSON.stringify(data, null, 2));
      
      if (!data.candidates || !data.candidates[0]) {
        console.error('No candidates in Gemini API response:', data);
        throw new Error('No response generated from Gemini API');
      }

      if (!data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        console.error('Invalid content structure in Gemini API response:', data);
        throw new Error('Invalid content structure in Gemini API response');
      }

      const generatedText = data.candidates[0].content.parts[0].text;
      
      if (!generatedText || generatedText.trim().length === 0) {
        console.error('Empty response from Gemini API:', data);
        throw new Error('Empty response from Gemini API');
      }
      
      console.log('Generated text length:', generatedText.length);
      console.log('Generated text preview:', generatedText.substring(0, 200) + '...');
      
      return generatedText;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: Gemini API took too long to respond');
      }
      
      throw error;
    }
  }
  
  // Get patient data with all relevant information
  async getPatientData(patientId) {
    try {
      console.log('Fetching patient data for ID:', patientId);
      
      const patient = await Patient.findById(patientId);
      if (!patient) {
        console.error('Patient not found for ID:', patientId);
        throw new Error('Patient not found');
      }
      
      console.log('Patient found:', {
        _id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth
      });

      // Get all visits for this patient
      const visits = await Visit.find({ patient: patientId })
        .sort({ date: -1 })
        .populate('patient')
        .populate('doctor');
      
      console.log('Found visits:', visits.length);

      // Get all previous notes for this patient
      const previousNotes = await Note.find({ patient: patientId })
        .sort({ createdAt: -1 })
        .populate('doctor')
        .populate('visit');
      
      console.log('Found previous notes:', previousNotes.length);

      return {
        patient,
        visits,
        previousNotes
      };
    } catch (error) {
      console.error('Error fetching patient data:', error);
      throw error;
    }
  }

  // Generate Progress Note
  async generateProgressNote(patientId, visitId, promptData) {
    const { patient, visits, previousNotes } = await this.getPatientData(patientId);
    
    const systemPrompt = `You are an expert surgeon specializing in hand surgery, peripheral nerve surgery, and microsurgery. Your target audience for this SOAP note includes insurance auditors, judges, or juries, where fine details are critical.

Key Instructions:
1. Tone and Detail:
   - All responses must be overly detailed. Every piece of information provided in the prompt is essential; no details should be removed. If any details are missing or unclear, you must add or clarify them.
2. Subjective:
   - The subjective portion should always be written in paragraph format. It must include:
     - The patient's age and gender.
     - The time elapsed since any injury (e.g., "7 days after the patient fell and broke her wrist").
     - The time elapsed since surgery if applicable (e.g., "post-op day 10 after [insert surgery]").
     - A brief recap of their clinical course to date including any issues or complications and specifically a recap of what occurred during the last visit.
     - An update on how the patient is doing during the current visit.
3. Objective: A standard exam that would be expected given the information provided. However do not include vital signs since my office does not take those.
4. X-Rays: For any patient who's diagnosis includes a fracture please put the appropriate x-rays and X ray findings for this patient.
5. Assessment:
   - Provide a comprehensive summary of the patient's medical condition in sentence format. This should include time elapsed since surgery if I operated on the patient.
   - Follow this with a numbered list of diagnoses, each with the correct ICD-10 codes. After the ICD10 code write the official description of the code in parenthesis.
6. Plan: For anything that is not applicable put not applicable
   - Structure the plan as a numbered list and sub lists.
   - Divide the plan into services provided during today's visit.
   - Prescriptions Provided: Therapy, splint, antibiotics, imaging or other.
   - Dressing or Splint care
   - Activity: Showering weight limits
   - Work or school status
   - Follow up:`;

    const currentDate = new Date().toLocaleDateString();
    const patientAge = this.calculateAge(patient.dateOfBirth);
    const patientGender = patient.gender || 'Unknown';

    let prompt = `Generate a SOAP note for the patient's office follow up on ${currentDate}.

I expect that the following will be carried over directly from the intake form or EMR:
• Patient Name: ${patient.firstName} ${patient.lastName}
• Patient Date of Birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}
• Location: [To be pulled from appointment settings]
• Date of Service: ${currentDate}
• MRN: [Internal MRN not hospital MRN]

Corresponding Form
• Key points about the subjective: [To be filled]
• Key physical exam findings: [To be filled]
• Plan:
  o Medications: None, Ordered Antibiotics, Discontinue antibiotics, other_____
  o Therapy: None, Ordered, Continue, Discontinue, Offered and Declined
  o Outside Imaging or Nerve Study: None, Prescription Provided for ______
  o Splint: Options should be provided, ordered, discontinued or continued
    - Type________
  o Injections: None (Default), Fluoroscopy guided, not fluoroscopy guided
    - Location
    - Medication: Kenalog, Kenalog
• Work/School Status: Changes
• Specific Comments:

Patient Information:
- Name: ${patient.firstName} ${patient.lastName}
- Age: ${patientAge} years old
- Gender: ${patientGender}
- Date of Birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}
- MRN: [Internal MRN]`;

    // Add medical history if available
    if (patient.dynamicData) {
      prompt += `\n\nMedical History from Intake Form:`;
      if (patient.dynamicData.medicalHistory) {
        prompt += `\n- Medical History: ${patient.dynamicData.medicalHistory}`;
      }
      if (patient.dynamicData.allergies) {
        prompt += `\n- Allergies: ${patient.dynamicData.allergies}`;
      }
      if (patient.dynamicData.medications) {
        prompt += `\n- Current Medications: ${patient.dynamicData.medications}`;
      }
      if (patient.dynamicData.surgicalHistory) {
        prompt += `\n- Surgical History: ${patient.dynamicData.surgicalHistory}`;
      }
    }

    // Add previous notes context
    if (previousNotes.length > 0) {
      prompt += `\n\nPrevious Clinical Course:`;
      previousNotes.slice(0, 3).forEach((note, index) => {
        const noteDate = new Date(note.createdAt).toLocaleDateString();
        prompt += `\n\nNote from ${noteDate} (${note.noteType}):`;
        prompt += `\n${note.content.substring(0, 500)}...`;
      });
    }

    // Add visit information if available
    if (visitId) {
      const visit = visits.find(v => v._id.toString() === visitId);
      if (visit) {
        prompt += `\n\nCurrent Visit Information:`;
        prompt += `\n- Visit Type: ${visit.visitType}`;
        prompt += `\n- Date: ${new Date(visit.date).toLocaleDateString()}`;
        if (visit.chiefComplaint) {
          prompt += `\n- Chief Complaint: ${visit.chiefComplaint}`;
        }
        if (visit.notes) {
          prompt += `\n- Visit Notes: ${visit.notes}`;
        }
      }
    }

    // Add additional prompt data
    if (promptData) {
      prompt += `\n\nAdditional Information: ${promptData}`;
    }

    return { systemPrompt, prompt };
  }

  // Generate Consultation Note
  async generateConsultationNote(patientId, visitId, promptData) {
    const { patient, visits, previousNotes } = await this.getPatientData(patientId);
    
    const systemPrompt = `You are an expert surgeon specializing in hand surgery, peripheral nerve surgery, and microsurgery. Your target audience for this consult note includes insurance auditors, judges, or juries, where fine details are critical.

You must generate a consultation note in JSON format with the exact structure provided. Fill in all sections with actual clinical content based on the patient information provided.`;

    const currentDate = new Date().toLocaleDateString();
    const patientAge = this.calculateAge(patient.dateOfBirth);
    const patientGender = patient.gender || 'Unknown';

    // Build patient context
    let patientContext = `Patient: ${patient.firstName} ${patient.lastName}, ${patientAge}-year-old ${patientGender}
Date of Birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}
Current Date: ${currentDate}`;

    // Add medical history if available
    if (patient.dynamicData) {
      if (patient.dynamicData.medicalHistory) {
        patientContext += `\nMedical History: ${patient.dynamicData.medicalHistory}`;
      }
      if (patient.dynamicData.allergies) {
        patientContext += `\nAllergies: ${patient.dynamicData.allergies}`;
      }
      if (patient.dynamicData.medications) {
        patientContext += `\nCurrent Medications: ${patient.dynamicData.medications}`;
      }
      if (patient.dynamicData.surgicalHistory) {
        patientContext += `\nSurgical History: ${patient.dynamicData.surgicalHistory}`;
      }
    }

    // Add visit information if available
    if (visitId) {
      const visit = visits.find(v => v._id.toString() === visitId);
      if (visit) {
        patientContext += `\nVisit Type: ${visit.visitType}`;
        patientContext += `\nVisit Date: ${new Date(visit.date).toLocaleDateString()}`;
        if (visit.chiefComplaint) {
          patientContext += `\nChief Complaint: ${visit.chiefComplaint}`;
        }
        if (visit.notes) {
          patientContext += `\nVisit Notes: ${visit.notes}`;
        }
      }
    }

    // Add previous notes context
    if (previousNotes.length > 0) {
      patientContext += `\n\nPrevious Clinical Course:`;
      previousNotes.slice(0, 3).forEach((note, index) => {
        const noteDate = new Date(note.createdAt).toLocaleDateString();
        patientContext += `\n\nNote from ${noteDate} (${note.noteType}):`;
        patientContext += `\n${note.content.substring(0, 500)}...`;
      });
    }

    // Add additional prompt data
    if (promptData) {
      patientContext += `\n\nAdditional Information: ${promptData}`;
    }

    const prompt = `Generate a consultation note for this patient in JSON format. Use the exact structure provided below and fill in all sections with actual clinical content based on the patient information.

PATIENT INFORMATION:
${patientContext}

Generate a JSON response with this EXACT structure:

{
  "patientInfo": {
    "name": "${patient.firstName} ${patient.lastName}",
    "dateOfBirth": "${new Date(patient.dateOfBirth).toLocaleDateString()}",
    "location": "Hand Surgery Clinic, Main Campus",
    "dateOfService": "${currentDate}"
  },
  "correspondingForm": {
    "mrn": "1234567",
    "assessment": "[Generate a comprehensive assessment based on the patient's condition]",
    "plan": {
      "medications": "[Select appropriate option: None, Ordered Antibiotics, Discontinue antibiotics, other_____]",
      "therapy": "[Select appropriate option: None, Ordered, Continue, Discontinue, Offered and Declined]",
      "outsideImaging": "[Select appropriate option: None, Prescription Provided for ______]",
      "splint": {
        "type": "[Specify type if applicable]",
        "status": "[Select appropriate option: Options should be provided, ordered, discontinued or continued]"
      },
      "injections": {
        "type": "[Select appropriate option: None (Default), Fluoroscopy guided, not fluoroscopy guided]",
        "location": "[Specify location if applicable]",
        "medication": "Kenalog"
      }
    },
    "workSchoolStatus": "[Select appropriate option: No Restrictions, One handed duty, 5Lbs restriction, 10lbs restriction, 15lbs Restriction, 20lbs restriction, no gym class]",
    "specificComments": "[Generate specific clinical comments based on the patient's condition]"
  },
  "clinicalSections": {
    "chiefComplaint": "[Generate a short description of why the consult is conducted based on the patient information]",
    "hpi": "[Generate a detailed paragraph that includes the patient's age and gender, time elapsed since any injury, prehospital care received, care received in the hospital, medical history, surgical history and allergies, pain or sensory complaints, specific laterality of the injury, specific body part involved, and any studies/reports uploaded such as labs, imaging, nerve studies]",
    "objective": "[Generate a standard exam that would be expected given the information provided. For heart and lungs, describe in terms of things that could be seen without listening. For example: Heart: Regular rate and rhythm (that can be checked by palpating the radial artery), Lungs: Regular respiratory rate and pattern, no respiratory distress. All other things do as normal]",
    "assessment": "[Generate a comprehensive summary of the patient's medical condition in sentence format. Follow this with a numbered list of diagnoses, each with the correct ICD-10 codes]",
    "plan": "[Generate a detailed plan. For anything that is not applicable put 'not applicable'. Structure the plan as a numbered list and sub lists. Divide the plan into services provided during today's visit. Include prescriptions provided, dressing or splint care, activity restrictions, work or school status, and follow up]"
  }
}

IMPORTANT: Generate actual clinical content, not template instructions. Fill in all bracketed sections with real patient data and clinical information. Return ONLY the JSON object, no additional text.`;

    return { systemPrompt, prompt };
  }

  // Generate ER Operative Report
  async generateEROperativeReport(patientId, visitId, promptData) {
    const { patient, visits, previousNotes } = await this.getPatientData(patientId);
    
    const systemPrompt = `You are an expert surgeon specializing in hand surgery, peripheral nerve surgery, and microsurgery. Your target audience includes insurance auditors, judges, and juries who require overly detailed, the documentation must be interpreted as precise and intentional. In cases with intraoperatively complications or adverse events they should be discussed in such a way that it was unavoidable, or inevitable due to the initial injury or the anatomy, or the patients actions. Add any missing details as needed.

Formatting Requirements:
Every operative report must follow this standardized template:

Operative Dictation:
• Patient Name:
• Patient Date of Birth:
• Location: (Which hospital)
• Place of Service: Emergency Room
• MRN:
• Date of Service:
• Surgeon: Oren Michaeli, DO
• Assistant Surgeon (if applicable): If not specified then there was none.
• Anesthesia Type: Local (unless sedation is used from reduction of dislocations)
• Estimated Blood Loss: Less than 10 ml (unless otherwise stated)
• Implants: (List any applicable: Nerve grafts, Nerve wraps, K-wires, integra)
• Wound Class: (Contaminated, Dirty)

Preoperative Diagnosis:
• Provide numbered list.

Postoperative Diagnosis:
• Provide numbered list, including exact diagnosis, followed by the ICD-10 codes, and then official ICD-10 descriptions in parentheses.

Procedures Performed:
• Provide numbered list, specifying the detailed procedure description, followed by the associated CPT codes, and then the official CPT code descriptions.

Indication for Assistant (if applicable): Usually omit this section unless an assistant was specified.
• Usually if there is one it's a resident and the indication was that it is a teaching facility.

Indication for Surgery:
• Each procedure must be individually justified with a direct link to the diagnosis.
• Describe negative repercussions of not performing the procedure and potential benefits or time sensitivity if applicable.

Procedure Details:
• Each numbered procedure must described separately, in independent paragraphs.
• Avoid repetitive phrasing; each step must appear uniquely critical in order to justify high billing fees. If it is discussed briefly it gives the impression it is insignificant and insurance companies and arbitrators wont allow for high billing.
• Begin with patient positioning, irrigation then sterile prep and partially draped. Prep is usually betadine unless express otherwise.
• Use vivid, precise anatomical language; imagine detailing the procedure to someone visualizing it step-by-step without prior visibility. The direction structures are retracted should be discussed as well as the instruments used to dissect and retract (Use terms like ulnar/ly, radial/ly, distally and proximally). Someone reading this operative report should be able to reproduce this operation as if it were a manual.
• In every operative case involving an open wound, describe thorough irrigation of the surgical site.

Specific Procedure Descriptions depending on the procedure list provided. These details must be included although it is ok to paraphrase or expand on it. Always repeat multiple times the speficic laterality and body part example left small finger or right wrist.

Ensure absolute compliance with each instruction. Maintain maximum clarity, precision, and anatomical detail in your documentation at all times. The procedures listed above have key points that MUST be mentioned. Sometimes I will do surgeries that are not listed above if the procedure list that is provided does not have a corresponding instructions please write the procedure yourself but with that same level of detail and minutia.`;

    const currentDate = new Date().toLocaleDateString();
    const patientAge = this.calculateAge(patient.dateOfBirth);
    const patientGender = patient.gender || 'Unknown';

    let prompt = `Generate an ER Operative Report for the following patient:

I expect that the following will be carried over directly from the intake form or EMR:
• Patient Name: ${patient.firstName} ${patient.lastName}
• Patient Date of Birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}
• Location: [To be pulled from appointment settings]
• Date of Service: ${currentDate}

Corresponding Form
• Place of Service: Emergency Room
• MRN: [Internal MRN not hospital MRN]
• Surgeon: Oren Michaeli, DO
• Assistant Surgeon: [If applicable]
• Anesthesia Type: [Local unless sedation used]
• Implants: [List any applicable: Nerve grafts, Nerve wraps, K-wires, integra]
• Wound Class: [Contaminated, Dirty] - this should be a dropdown
• Preoperative Diagnosis: [To be filled]
• Postoperative Diagnosis: [If left blank should be the same as above]
• Procedure List: [To be filled]
• Specific notes about the surgery: [To be filled]

Patient Information:
- Name: ${patient.firstName} ${patient.lastName}
- Age: ${patientAge} years old
- Gender: ${patientGender}
- Date of Birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}`;

    // Add medical history if available
    if (patient.dynamicData) {
      prompt += `\n\nMedical History from Intake Form:`;
      if (patient.dynamicData.medicalHistory) {
        prompt += `\n- Medical History: ${patient.dynamicData.medicalHistory}`;
      }
      if (patient.dynamicData.allergies) {
        prompt += `\n- Allergies: ${patient.dynamicData.allergies}`;
      }
      if (patient.dynamicData.medications) {
        prompt += `\n- Current Medications: ${patient.dynamicData.medications}`;
      }
      if (patient.dynamicData.surgicalHistory) {
        prompt += `\n- Surgical History: ${patient.dynamicData.surgicalHistory}`;
      }
    }

    // Add visit information if available
    if (visitId) {
      const visit = visits.find(v => v._id.toString() === visitId);
      if (visit) {
        prompt += `\n\nVisit Information:`;
        prompt += `\n- Visit Type: ${visit.visitType}`;
        prompt += `\n- Date: ${new Date(visit.date).toLocaleDateString()}`;
        if (visit.chiefComplaint) {
          prompt += `\n- Chief Complaint: ${visit.chiefComplaint}`;
        }
        if (visit.notes) {
          prompt += `\n- Visit Notes: ${visit.notes}`;
        }
      }
    }

    // Add additional prompt data
    if (promptData) {
      prompt += `\n\nAdditional Information: ${promptData}`;
    }

    return { systemPrompt, prompt };
  }

  // Generate OR Operative Report
  async generateOROperativeReport(patientId, visitId, promptData) {
    const { patient, visits, previousNotes } = await this.getPatientData(patientId);
    
    const systemPrompt = `You are an expert surgeon specializing in hand surgery, peripheral nerve surgery, and microsurgery. Your target audience includes insurance auditors, judges, and juries who require overly detailed, the documentation must be interpreted as precise and intentional. In cases with intraoperatively complications or adverse events they should be discussed in such a way that it was unavoidable, or inevitable due to the initial injury or the anatomy, or the patients actions. Add any missing details as needed. Everything to follow is a general rule but any special notes above superseded anything below.

Formatting Requirements:
Every operative report must follow this standardized template:

Operative Dictation:
• Patient Name:
• Patient Date of Birth:
• Location: (Which hospital)
• Place of Service: (Emergency - Inpatient, Emergency - Outpatient, Elective - Inpatient, Elective - Outpatient)
• MRN:
• Date of Service:
• Surgeon: Oren Michaeli, DO
• Assistant Surgeon (if applicable):
• Anesthesia Type:
• Estimated Blood Loss: Less than 10 ml (unless otherwise stated)
• Implants: (List any applicable: plates, screws, anchors, suture tape, tightropes, nerve grafts, nerve wraps, K-wires, intramedullary nails, bone allografts)
• Wound Class: (Clean, Contaminated, Dirty)

Preoperative Diagnosis:
• Provide numbered list.

Postoperative Diagnosis:
• Provide numbered list, including exact diagnosis, followed by the ICD-10 codes, and then official ICD-10 descriptions in parentheses.

Procedures Performed:
• Provide numbered list, specifying the detailed procedure description, followed by the associated CPT codes, and then the official CPT code descriptions.

Indication for Assistant (if applicable):
• Clearly justify necessity of the assistant. If the information has been provided to you for the specific assistant please include the specialty, the board certification, years in practice and any other unique qualifiers. Also highlight why this procedure requires more than one experienced surgeon.

Indication for Surgery:
• Each procedure must be individually justified with a direct link to the diagnosis.
• Describe negative repercussions of not performing the procedure and potential benefits or time sensitivity if applicable.

Procedure Details:
• Each numbered procedure must described separately, in independent paragraphs.
• Avoid repetitive phrasing; each step must appear uniquely critical in order to justify high billing fees. If it is discussed briefly it gives the impression it is insignificant and insurance companies and arbitrators wont allow for high billing.
• Begin with patient positioning, sterile preparation, placement of a protective barrier, tourniquet (if used), and performing a preoperative timeout. including confirmation of antibiotics, DVT prophylaxis, and laterality prior to tourniquet inflation or skin incision.
• For Procedures in the emergency room only state that the extremity was irrigated then prepped and partially draped.
• Conclude with verification of counts, confirmation of perfusion of the extremity or digit, and the patient's complication-free emergence from anesthesia (if general anesthesia was used).
• Use vivid, precise anatomical language; imagine detailing the procedure to someone visualizing it step-by-step without prior visibility. The direction structures are retracted should be discussed as well as the instruments used to dissect and retract (Use terms like ulnar/ly, radial/ly, distally and proximally). Someone reading this operative report should be able to reproduce this operation as if it were a manual.
• In every operative case involving an open wound, describe thorough irrigation of the surgical site.

Ensure absolute compliance with each instruction. Maintain maximum clarity, precision, and anatomical detail in your documentation at all times.`;

    const currentDate = new Date().toLocaleDateString();
    const patientAge = this.calculateAge(patient.dateOfBirth);
    const patientGender = patient.gender || 'Unknown';

    let prompt = `Generate a New OR Operative Report for the following patient:

I expect that the following will be carried over directly from the intake form or EMR:
• Patient Name: ${patient.firstName} ${patient.lastName}
• Patient Date of Birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}
• Location: [To be pulled from appointment settings]
• Date of Service: ${currentDate}

Corresponding Form
• Place of Service: (Emergency - Inpatient, Emergency - Outpatient, Elective - Inpatient, Elective - Outpatient) this should be a drop down.
• MRN: [Internal MRN not hospital MRN]
• Surgeon: Oren Michaeli, DO
• Assistant Surgeon: [If applicable]
• Anesthesia Type: [To be filled]
• Implants: [To be filled]
• Wound Class: (Clean, Contaminated, Dirty) this should be a dropdown
• Preoperative Diagnosis: [To be filled]
• Postoperative Diagnosis: [If left blank should be the same as above]
• Procedure List: [To be filled]
• Specific notes about the surgery: [To be filled]

Patient Information:
- Name: ${patient.firstName} ${patient.lastName}
- Age: ${patientAge} years old
- Gender: ${patientGender}
- Date of Birth: ${new Date(patient.dateOfBirth).toLocaleDateString()}`;

    // Add medical history if available
    if (patient.dynamicData) {
      prompt += `\n\nMedical History from Intake Form:`;
      if (patient.dynamicData.medicalHistory) {
        prompt += `\n- Medical History: ${patient.dynamicData.medicalHistory}`;
      }
      if (patient.dynamicData.allergies) {
        prompt += `\n- Allergies: ${patient.dynamicData.allergies}`;
      }
      if (patient.dynamicData.medications) {
        prompt += `\n- Current Medications: ${patient.dynamicData.medications}`;
      }
      if (patient.dynamicData.surgicalHistory) {
        prompt += `\n- Surgical History: ${patient.dynamicData.surgicalHistory}`;
      }
    }

    // Add visit information if available
    if (visitId) {
      const visit = visits.find(v => v._id.toString() === visitId);
      if (visit) {
        prompt += `\n\nVisit Information:`;
        prompt += `\n- Visit Type: ${visit.visitType}`;
        prompt += `\n- Date: ${new Date(visit.date).toLocaleDateString()}`;
        if (visit.chiefComplaint) {
          prompt += `\n- Chief Complaint: ${visit.chiefComplaint}`;
        }
        if (visit.notes) {
          prompt += `\n- Visit Notes: ${visit.notes}`;
        }
      }
    }

    // Add additional prompt data
    if (promptData) {
      prompt += `\n\nAdditional Information: ${promptData}`;
    }

    return { systemPrompt, prompt };
  }

  // Generate note using AI
  async generateNote(patientId, visitId, noteType, promptData) {
    try {
      console.log('Starting note generation...');
      console.log('Patient ID:', patientId);
      console.log('Visit ID:', visitId);
      console.log('Note Type:', noteType);
      console.log('Prompt Data:', promptData);
      
      let systemPrompt, prompt;

      switch (noteType) {
        case 'Progress':
          console.log('Generating Progress note...');
          ({ systemPrompt, prompt } = await this.generateProgressNote(patientId, visitId, promptData));
          break;
        case 'Consultation':
          console.log('Generating Consultation note...');
          ({ systemPrompt, prompt } = await this.generateConsultationNote(patientId, visitId, promptData));
          break;
        case 'New ER Operative Report':
          console.log('Generating ER Operative Report...');
          ({ systemPrompt, prompt } = await this.generateEROperativeReport(patientId, visitId, promptData));
          break;
        case 'New OR Operative Report':
          console.log('Generating OR Operative Report...');
          ({ systemPrompt, prompt } = await this.generateOROperativeReport(patientId, visitId, promptData));
          break;
        default:
          throw new Error(`Unsupported note type: ${noteType}`);
      }

      console.log('System prompt length:', systemPrompt.length);
      console.log('User prompt length:', prompt.length);
      console.log('Calling Gemini API...');

      // Call the Gemini API
      const generatedText = await this.callGeminiAPI(systemPrompt, prompt);
      
      console.log('Note generated successfully, length:', generatedText.length);
      
      // For consultation notes, parse JSON and format it
      if (noteType === 'Consultation') {
        try {
          console.log('Parsing JSON response for consultation note...');
          const jsonData = JSON.parse(generatedText);
          console.log('JSON parsed successfully:', jsonData);
          
          // Save the JSON response to file for debugging
          saveAIResponseToFile(noteType, patientId, generatedText, jsonData);
          
          // Format the JSON data into the proper consultation note format
          const formattedNote = formatNote(jsonData);
          console.log('Formatted note length:', formattedNote.length);
          
          return formattedNote;
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
          console.log('Raw response:', generatedText);
          
          // Save the raw response for debugging
          saveAIResponseToFile(noteType, patientId, generatedText);
          
          // If JSON parsing fails, return the raw text
          return generatedText;
        }
      }
      
      return generatedText;
    } catch (error) {
      console.error('Error generating note:', error);
      throw error;
    }
  }

  // Helper function to calculate age
  calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}

export default new AINoteGenerationService();
