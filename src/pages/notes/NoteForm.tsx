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
    noteType: '',
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

  // SOAP Template for Progress Notes
  const getSOAPTemplate = () => {
    return `
<h2>SOAP Note - Progress Note</h2>

<p><strong>Patient Information:</strong></p>
<ul>
  <li><strong>Patient Name:</strong> [To be filled from patient selection]</li>
  <li><strong>Patient Date of Birth:</strong> [To be filled from patient data]</li>
  <li><strong>Location:</strong> [To be pulled from appointment settings]</li>
  <li><strong>Date of Service:</strong> [To be pulled from appointment settings]</li>
  <li><strong>MRN:</strong> [Internal MRN not hospital MRN]</li>
</ul>

<h3>Corresponding Form</h3>
<ul>
  <li><strong>Key points about the subjective:</strong> [To be filled]</li>
  <li><strong>Key physical exam findings:</strong> [To be filled]</li>
  <li><strong>Plan:</strong> [To be filled]</li>
</ul>

<h3>SOAP Note</h3>

<h4>Subjective:</h4>
<p>[The subjective portion should be written in paragraph format and must include:]</p>
<ul>
  <li>The patient's age and gender</li>
  <li>The time elapsed since any injury (e.g., "7 days after the patient fell and broke her wrist")</li>
  <li>The time elapsed since surgery if applicable (e.g., "post-op day 10 after [insert surgery]")</li>
  <li>A brief recap of their clinical course to date including any issues or complications and specifically a recap of what occurred during the last visit</li>
  <li>An update on how the patient is doing during the current visit</li>
</ul>

<h4>Objective:</h4>
<p>[A standard exam that would be expected given the information provided. However do not include vital signs since the office does not take those.]</p>

<h4>X-Rays:</h4>
<p>[For any patient whose diagnosis includes a fracture, please put the appropriate x-rays and X-ray findings for this patient.]</p>

<h4>Assessment:</h4>
<p>[Provide a comprehensive summary of the patient's medical condition in sentence format. This should include time elapsed since surgery if operated on the patient.]</p>
<p>[Follow this with a numbered list of diagnoses, each with the correct ICD-10 codes. After the ICD10 code write the official description of the code in parenthesis.]</p>

<h4>Plan:</h4>
<p>[For anything that is not applicable put "not applicable"]</p>
<p>[Structure the plan as a numbered list and sub lists. Divide the plan into services provided during today's visit.]</p>

<ol>
  <li><strong>Prescriptions Provided:</strong>
    <ul>
      <li>Medications: None, Ordered Antibiotics, Discontinue antibiotics, other_____</li>
      <li>Therapy: None, Ordered, Continue, Discontinue, Offered and Declined</li>
      <li>Outside Imaging or Nerve Study: None, Prescription Provided for ______</li>
      <li>Splint: Options should be provided, ordered, discontinued or continued
        <ul>
          <li>Type________</li>
        </ul>
      </li>
      <li>Injections: None (Default), Fluoroscopy guided, not fluoroscopy guided
        <ul>
          <li>Location: ________</li>
          <li>Medication: Kenalog, Kenalog</li>
        </ul>
      </li>
    </ul>
  </li>
  <li><strong>Dressing or Splint care:</strong> [To be filled]</li>
  <li><strong>Activity:</strong> Showering, weight limits [To be filled]</li>
  <li><strong>Work or school status:</strong> Changes [To be filled]</li>
  <li><strong>Follow up:</strong> [To be filled]</li>
  <li><strong>Specific Comments:</strong> [To be filled]</li>
</ol>

<hr>
<p><em>Note: This is a template for a SOAP note. Please fill in all the bracketed sections with the appropriate patient information and clinical details.</em></p>
    `;
  };

  // Consult Note Template
  const getConsultTemplate = () => {
    return `
<h2>Consult Note</h2>

<p><strong>Appointment Details:</strong></p>
<ul>
  <li><strong>Patient Name:</strong> [To be filled from patient selection]</li>
  <li><strong>Date of Birth:</strong> [To be filled from patient data]</li>
  <li><strong>Date of Service:</strong> [To be pulled from appointment settings]</li>
  <li><strong>Location:</strong> [To be pulled from appointment settings]</li>
  <li><strong>Place of Service:</strong> [To be filled]</li>
  <li><strong>MRN:</strong> [Internal MRN not hospital MRN]</li>
</ul>

<h3>Corresponding Form</h3>
<ul>
  <li><strong>MRN:</strong> [To be filled]</li>
  <li><strong>Assessment:</strong> [To be filled]</li>
  <li><strong>Plan:</strong> [To be filled]</li>
</ul>

<h3>Consult Note</h3>

<h4>Chief Complaint:</h4>
<p>[Short description of why the consult is conducted]</p>

<h4>HPI (History of Present Illness):</h4>
<p>[This is a subjective portion that should always be written in paragraph format. It must include:]</p>
<ul>
  <li>The patient's age and gender</li>
  <li>The time elapsed since any injury (e.g., "7 days after the patient fell and broke her wrist")</li>
  <li>Any prehospital care received, how they arrived at the hospital (e.g., Ambulance or if they were driven)</li>
  <li>Any care received in the hospital before arrival</li>
  <li>The patient's medical history, surgical history and allergies should be included in this section</li>
  <li>Any pain or sensory complaints the patient has should be included here as well</li>
  <li>The specific laterality of the injury should always be mentioned</li>
  <li>The specific body part should be mentioned when known and possible (e.g., wrist, thumb, or metacarpal). The more specific the better. The laterality should always be mentioned</li>
  <li>If there are studies/reports uploaded such as labs, imaging, nerve studies please include these here</li>
</ul>

<h4>Objective:</h4>
<p>[A standard exam that would be expected given the information provided. For heart and lungs, describe in terms of things that could be seen without listening. For example: Heart: Regular rate and rhythm (that can be checked by palpating the radial artery), Lungs: Regular respiratory rate and pattern, no respiratory distress. All other things do as normal.]</p>

<h4>Assessment:</h4>
<p>[Provide a comprehensive summary of the patient's medical condition in sentence format.]</p>
<p>[Follow this with a numbered list of diagnoses, each with the correct ICD-10 codes.]</p>

<h4>Plan:</h4>
<p>[For anything that is not applicable put "not applicable"]</p>
<p>[Structure the plan as a numbered list and sub lists. Divide the plan into services provided during today's visit.]</p>

<ol>
  <li><strong>Prescriptions Provided:</strong>
    <ul>
      <li>Medications: None, Ordered Antibiotics, Discontinue antibiotics, other_____</li>
      <li>Therapy: None, Ordered, Continue, Discontinue, Offered and Declined</li>
      <li>Outside Imaging or Nerve Study: None, Prescription Provided for ______</li>
      <li>Splint: Options should be provided, ordered, discontinued or continued
        <ul>
          <li>Type________</li>
        </ul>
      </li>
      <li>Injections: None (Default), Fluoroscopy guided, not fluoroscopy guided
        <ul>
          <li>Location: ________</li>
          <li>Medication: Kenalog, Kenalog</li>
        </ul>
      </li>
    </ul>
  </li>
  <li><strong>Dressing or Splint care:</strong> [To be filled]</li>
  <li><strong>Activity:</strong> Showering, weight limits [To be filled]</li>
  <li><strong>Work or School Status:</strong> No Restrictions, One handed duty, 5Lbs restriction, 10lbs restriction, 15lbs Restriction, 20lbs restriction, no gym class [To be filled]</li>
  <li><strong>Follow up:</strong> [To be filled]</li>
  <li><strong>Specific Comments:</strong> [To be filled]</li>
</ol>

<hr>
<p><em>Note: This is a template for a Consult note. Please fill in all the bracketed sections with the appropriate patient information and clinical details.</em></p>
    `;
  };

  // ER Operative Report Template
  const getEROperativeTemplate = () => {
    return `
<h2>ER Operative Report</h2>

<p><strong>Patient Information:</strong></p>
<ul>
  <li><strong>Patient Name:</strong> [To be filled from patient selection]</li>
  <li><strong>Date of Birth:</strong> [To be filled from patient data]</li>
  <li><strong>Date of Service:</strong> [To be pulled from appointment settings]</li>
  <li><strong>Location:</strong> [To be pulled from appointment settings]</li>
  <li><strong>MRN:</strong> [Internal MRN not hospital MRN]</li>
</ul>

<h3>ER Operative Report</h3>

<h4>Preoperative Diagnosis:</h4>
<p>[List the preoperative diagnosis with ICD-10 codes]</p>

<h4>Postoperative Diagnosis:</h4>
<p>[List the postoperative diagnosis with ICD-10 codes]</p>

<h4>Procedure:</h4>
<p>[Describe the procedure performed in detail]</p>

<h4>Surgeon:</h4>
<p>[Surgeon name]</p>

<h4>Assistant:</h4>
<p>[Assistant name if applicable]</p>

<h4>Anesthesia:</h4>
<p>[Type of anesthesia used]</p>

<h4>Operative Findings:</h4>
<p>[Detailed description of what was found during the procedure]</p>

<h4>Operative Technique:</h4>
<p>[Step-by-step description of the surgical technique]</p>

<h4>Complications:</h4>
<p>[Any complications encountered during or after the procedure]</p>

<h4>Estimated Blood Loss:</h4>
<p>[Amount of blood loss]</p>

<h4>Specimens:</h4>
<p>[Any specimens sent for pathology]</p>

<h4>Postoperative Plan:</h4>
<p>[Plan for postoperative care and follow-up]</p>

<hr>
<p><em>Note: This is a template for an ER Operative Report. Please fill in all the bracketed sections with the appropriate patient information and surgical details.</em></p>
    `;
  };

  // OR Operative Report Template
  const getOROperativeTemplate = () => {
    return `
<h2>New OR Operative Report</h2>

<p><strong>Patient Information:</strong></p>
<ul>
  <li><strong>Patient Name:</strong> [To be filled from patient selection]</li>
  <li><strong>Patient Date of Birth:</strong> [To be filled from patient data]</li>
  <li><strong>Location:</strong> [To be pulled from appointment settings]</li>
  <li><strong>Date of Service:</strong> [To be pulled from appointment settings]</li>
</ul>

<h3>Corresponding Form</h3>
<ul>
  <li><strong>MRN:</strong> [To be filled]</li>
  <li><strong>Surgeon:</strong> [To be filled]</li>
  <li><strong>Assistant Surgeon:</strong> [To be filled]</li>
  <li><strong>Anesthesia Type:</strong> [To be filled]</li>
  <li><strong>Implants:</strong> [To be filled]</li>
  <li><strong>Wound Class:</strong> [Clean, Contaminated, Dirty]</li>
  <li><strong>Preoperative Diagnosis:</strong> [To be filled]</li>
  <li><strong>Postoperative Diagnosis:</strong> [If left blank should be the same as above]</li>
  <li><strong>Procedure List:</strong> [To be filled]</li>
  <li><strong>Specific notes about the surgery:</strong> [To be filled]</li>
</ul>

<h3>Operative Dictation</h3>
<ul>
  <li><strong>Patient Name:</strong> [To be filled from patient selection]</li>
  <li><strong>Patient Date of Birth:</strong> [To be filled from patient data]</li>
  <li><strong>Location:</strong> [Which hospital]</li>
  <li><strong>Place of Service:</strong> [Emergency - Inpatient, Emergency - Outpatient, Elective - Inpatient, Elective - Outpatient]</li>
  <li><strong>MRN:</strong> [To be filled]</li>
  <li><strong>Date of Service:</strong> [To be filled]</li>
  <li><strong>Surgeon:</strong> Oren Michaeli, DO</li>
  <li><strong>Assistant Surgeon (if applicable):</strong> [To be filled]</li>
  <li><strong>Anesthesia Type:</strong> [To be filled]</li>
  <li><strong>Estimated Blood Loss:</strong> Less than 10 ml (unless otherwise stated)</li>
  <li><strong>Implants:</strong> [List any applicable: plates, screws, anchors, suture tape, tightropes, nerve grafts, nerve wraps, K-wires, intramedullary nails, bone allografts]</li>
  <li><strong>Wound Class:</strong> [Clean, Contaminated, Dirty]</li>
</ul>

<h4>Preoperative Diagnosis:</h4>
<p>[Provide numbered list]</p>

<h4>Postoperative Diagnosis:</h4>
<p>[Provide numbered list, including exact diagnosis, followed by the ICD-10 codes, and then official ICD-10 descriptions in parentheses]</p>

<h4>Procedures Performed:</h4>
<p>[Provide numbered list, specifying the detailed procedure description, followed by the associated CPT codes, and then the official CPT code descriptions]</p>

<h4>Indication for Assistant (if applicable):</h4>
<p>[Clearly justify necessity of the assistant. If the information has been provided to you for the specific assistant please include the specialty, the board certification, years in practice and any other unique qualifiers. Also highlight why this procedure requires more than one experienced surgeon]</p>

<h4>Indication for Surgery:</h4>
<p>[Each procedure must be individually justified with a direct link to the diagnosis. Describe negative repercussions of not performing the procedure and potential benefits or time sensitivity if applicable]</p>

<h4>Procedure Details:</h4>
<p>[Each numbered procedure must be described separately, in independent paragraphs. Avoid repetitive phrasing; each step must appear uniquely critical in order to justify high billing fees. Begin with patient positioning, sterile preparation, placement of a protective barrier, tourniquet (if used), and performing a preoperative timeout including confirmation of antibiotics, DVT prophylaxis, and laterality prior to tourniquet inflation or skin incision. For Procedures in the emergency room only state that the extremity was irrigated then prepped and partially draped. Conclude with verification of counts, confirmation of perfusion of the extremity or digit, and the patient's complication-free emergence from anesthesia (if general anesthesia was used). Use vivid, precise anatomical language; imagine detailing the procedure to someone visualizing it step-by-step without prior visibility. The direction structures are retracted should be discussed as well as the instruments used to dissect and retract (Use terms like ulnar/ly, radial/ly, distally and proximally). Someone reading this operative report should be able to reproduce this operation as if it were a manual. In every operative case involving an open wound, describe thorough irrigation of the surgical site]</p>

<h4>Specific Procedure Descriptions:</h4>
<p>[These details must be included although it is ok to paraphrase or expand on it]</p>

<ol>
  <li><strong>Sterile Preparation</strong>
    <ul>
      <li><strong>Clean cases (if applicable):</strong> Initially, the arm was meticulously scrubbed using a surgical-grade sponge, followed by drying with a sterile towel to ensure the absence of residual moisture. This procedure was diligently repeated. Subsequently, the [specify laterality and extremity] received a double application of a chlorhexidine preparation stick. A sterile surgical drape was applied, followed by a final chlorhexidine application within the sterile field.</li>
      <li><strong>Contaminated or Dirty cases (if applicable):</strong> The extremity was prepared using a betadine-based solution in accordance with contaminated or infected wound protocols.</li>
    </ul>
  </li>
  
  <li><strong>Volar Plating of Distal Radius (If applicable)</strong>
    <ul>
      <li>Prior to incision inspect the fracture under fluoroscopic guidance and attempt preliminary reduction.</li>
      <li>A modified Henry approach was used. The FCR was palpated and a 10 cm incision made using a 15 blade. The FCR sheath was incised with a 15 blade, and a push-cut technique used proximally and distally with tenotomy scissors. A Ragnell retractor retracted the FCR ulnarly. The base and floor of the tendon sheath were opened with a tenotomy. The FPL was freed with finger-sweep dissection. The pronator quadratus was then cut with a bipolar and a combination of blunt dissection with a raytech and a key elevator was used to expose the fracture.</li>
      <li>A freer elevator was used to open the fracture; hematoma was evacuated.</li>
      <li>DRUJ stability was assessed with the elbow at 90° in both pronation and supination if there was an associated ulnar styloid fracture.</li>
      <li>The volar plate was fixed distally first with screws to leverage and reduce the distal fragments.</li>
      <li>Proximal screws were placed to complete longitudinal stabilization.</li>
      <li>Fluoroscopy confirmed proper screw placement, no intra-articular penetration, and satisfactory construct alignment.</li>
      <li>If specified that it was an arthroscopically assisted distal radius volar plating please describe as follows:
        <ul>
          <li>If anatomic alignment remained suboptimal (e.g., >2mm displacement), arthroscopic intervention may be employed to enhance precision. The arthroscope was introduced dorsally, adjacent to Lister's tubercle, through the inter-compartmental space without disrupting tendon sheaths. Extensive irrigation was performed to improve joint visibility.</li>
          <li>A 6R portal was created with a small incision radial to the ECU, dissecting to the capsule. A probe introduced through this portal allowed adjustment of the fragments to a 0mm step-off.</li>
          <li>After achieving alignment, the plate was first fixed distally, leveraging the distal fragment against the volar plate for anatomic tilt. Proximal screws were subsequently placed to secure longitudinal stability.</li>
          <li>Screw placement and construct integrity were verified both arthroscopically and fluoroscopically, ensuring no intra-articular penetration and confirming optimal stabilization and wrist functionality.</li>
        </ul>
      </li>
    </ul>
  </li>
  
  <li><strong>Ulnar Styloid Fixation (if applicable)</strong>
    <ul>
      <li>2 cm incision made between ECU and FCU. The ulnar sensory nerve was identified and protected.</li>
      <li>TFCC instability was addressed using a specialized hook plate to secure soft tissues to the ulnar styloid.</li>
      <li>Screws were placed proximally to avoid intra-articular impingement and ensure DRUJ support. In some instances I will place a screw diagonally through the styloid into the neck/shaft. Only include this detail if it is mentioned above.</li>
    </ul>
  </li>
  
  <li><strong>Intramedullary Nailing of Metacarpal (if applicable)</strong>
    <ul>
      <li>A 1.4 mm K-wire was inserted at the dorsal third of the metacarpal head and advanced into the medullary canal.</li>
      <li>Fracture reduced manually; fluoroscopic alignment confirmed.</li>
      <li>A 0.3 mm skin incision allowed passage of a cannulated drill/reamer system.</li>
      <li>After canal preparation, Skeletal Dynamics intramedullary nail was inserted over a guidewire and buried beneath the articular cartilage.</li>
      <li>Must include the size of the screw</li>
      <li>Must specify the digit number 1st-5th, with 1st being the thumb and 5th being the small finger. Also must mention the laterality.</li>
      <li>If multiple fingers are involved each should be discussed separately.</li>
    </ul>
  </li>
  
  <li><strong>Blood Vessel Anastomosis (if applicable)</strong>
    <ul>
      <li>Hematoma and adhesions were removed. The arterial ends were mobilized.</li>
      <li>Adventitia was sharply removed with straight micro-scissors.</li>
      <li>Vessel ends debrided until healthy tissue was visible.</li>
      <li>Ends bathed in a heparin, lidocaine, and papaverine solution.</li>
      <li>Microscopic vessel dilators expanded the lumen incrementally.</li>
      <li>Vessel approximated using clamps and anastomosed with 8-0 nylon sutures under magnification.</li>
      <li>Perfusion confirmed after clamp release.</li>
    </ul>
  </li>
  
  <li><strong>Primary Nerve Repair (Coaptation) if applicable</strong>
    <ul>
      <li>Neurolysis performed until healthy vaso nervosum and fascicles exposed.</li>
      <li>Sharp debridement with straight microscissors until healthy, bleeding, and bulging fascicles visible. May also be likened to a bugs eyes.</li>
      <li>Coaptation performed with two interrupted 9-0 nylon sutures, leaving a visible 0.1 mm light gap. May also be described as a grandmas kiss.</li>
      <li>A tension free repair should always be.</li>
      <li>Fibrin glue applied to reinforce the repair using a drop, drop method.</li>
      <li>Always say that the limb or digit was fully ranged through its motion to test that the suture line will not break. Do not however mention this if the joint was fused or kwired to immobilize.</li>
    </ul>
  </li>
  
  <li><strong>Nerve Graft (if applicable)</strong>
    <ul>
      <li>Document diameter and length of graft.</li>
      <li>Thaw nerve allograft, trim with microscissors, and coapt both ends with 9-0 nylon interrupted sutures.</li>
      <li>Apply fibrin glue proximally and distally.</li>
    </ul>
  </li>
  
  <li><strong>Synthetic Nerve Membrane (if applicable)</strong>
    <ul>
      <li>If used, describe membrane placement to minimize axonal sprouting and prevent neuroma.</li>
      <li>If applicable, include soaking in stem cell solution with brief citation supporting Schwann cell differentiation.</li>
      <li>Secure with 9-0 nylon sutures, then reinforce with fibrin glue.</li>
    </ul>
  </li>
  
  <li><strong>Intraoperative Nerve Stimulation (AKA ReGen, if applicable)</strong>
    <ul>
      <li>Electrode placed proximal to nerve repair at last known healthy nerve.</li>
      <li>Settings: 100 pulses/sec for 10 minutes at 2 mA.</li>
      <li>Document device used and total stimulation time.</li>
    </ul>
  </li>
  
  <li><strong>Nano Fat Stem Cell Grafting with Tulip if applicable</strong>
    <ul>
      <li>100 cc of tumescent fluid (saline, lidocaine, epinephrine) infiltrated into lower abdomen.</li>
      <li>Suction cannula is always advanced through the umbilicus.</li>
      <li>Fat harvested using Tulip cannula under manual suction pressure.</li>
      <li>Gravity separation performed; supernatant and infranatant discarded.</li>
      <li>Fat filtered through sequential Tulip filters to create nanofat.</li>
      <li>~10 cc reserved for injection.</li>
    </ul>
  </li>
  
  <li><strong>Bone Grafting with allograft if applicable</strong>
    <ul>
      <li>Fracture hematoma is cleared, then the void is packed with bone allograft. This could be added anywhere on the body that makes sense either after plating or in the middle of the plating. The packing must be tight.</li>
    </ul>
  </li>
</ol>

<hr>
<p><em>Note: This is a template for a New OR Operative Report. Please fill in all the bracketed sections with the appropriate patient information and surgical details. Ensure absolute compliance with each instruction. Maintain maximum clarity, precision, and anatomical detail in your documentation at all times. The procedures listed above have key points that MUST be mentioned. Sometimes surgeries that are not listed above will be performed - if the procedure list provided does not have corresponding instructions, please write the procedure yourself but with that same level of detail and minutia.</em></p>
    `;
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
    
    // If note type is changing to Progress and content is empty, load the SOAP template
    if (name === 'noteType' && value === 'Progress' && !note.content.trim()) {
      const soapTemplate = getSOAPTemplate();
      setNote(prev => ({ ...prev, [name]: value, content: soapTemplate }));
    } else if (name === 'noteType' && value === 'Progress' && note.content.trim()) {
      // If changing to Progress and there's existing content, ask user if they want to load template
      if (window.confirm('Would you like to load the SOAP template? This will replace your current content.')) {
        const soapTemplate = getSOAPTemplate();
        setNote(prev => ({ ...prev, [name]: value, content: soapTemplate }));
      } else {
        setNote(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'noteType' && value === 'Consultation' && !note.content.trim()) {
      // If note type is changing to Consultation and content is empty, load the Consult template
      const consultTemplate = getConsultTemplate();
      setNote(prev => ({ ...prev, [name]: value, content: consultTemplate }));
    } else if (name === 'noteType' && value === 'Consultation' && note.content.trim()) {
      // If changing to Consultation and there's existing content, ask user if they want to load template
      if (window.confirm('Would you like to load the Consult template? This will replace your current content.')) {
        const consultTemplate = getConsultTemplate();
        setNote(prev => ({ ...prev, [name]: value, content: consultTemplate }));
      } else {
        setNote(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'noteType' && value === 'New ER Operative Report' && !note.content.trim()) {
      // If note type is changing to New ER Operative Report and content is empty, load the ER Operative template
      const erOperativeTemplate = getEROperativeTemplate();
      setNote(prev => ({ ...prev, [name]: value, content: erOperativeTemplate }));
    } else if (name === 'noteType' && value === 'New ER Operative Report' && note.content.trim()) {
      // If changing to New ER Operative Report and there's existing content, ask user if they want to load template
      if (window.confirm('Would you like to load the ER Operative Report template? This will replace your current content.')) {
        const erOperativeTemplate = getEROperativeTemplate();
        setNote(prev => ({ ...prev, [name]: value, content: erOperativeTemplate }));
      } else {
        setNote(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'noteType' && value === 'New OR Operative Report' && !note.content.trim()) {
      // If note type is changing to New OR Operative Report and content is empty, load the OR Operative template
      const orOperativeTemplate = getOROperativeTemplate();
      setNote(prev => ({ ...prev, [name]: value, content: orOperativeTemplate }));
    } else if (name === 'noteType' && value === 'New OR Operative Report' && note.content.trim()) {
      // If changing to New OR Operative Report and there's existing content, ask user if they want to load template
      if (window.confirm('Would you like to load the OR Operative Report template? This will replace your current content.')) {
        const orOperativeTemplate = getOROperativeTemplate();
        setNote(prev => ({ ...prev, [name]: value, content: orOperativeTemplate }));
      } else {
        setNote(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setNote(prev => ({ ...prev, [name]: value }));
    }
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
    if (!note.title || !note.content || !note.patient || !note.noteType) {
      toast.error('Please fill in all required fields including Note Type');
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
              <option value="">Select Note Type</option>
              <option value="Progress">Progress Note</option>
              <option value="Consultation">Consultation Note</option>
              <option value="New ER Operative Report">New ER Operative Report</option>
              <option value="New OR Operative Report">New OR Operative Report</option>
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
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Note Content *</label>
            <div className="flex space-x-2">
              {note.noteType === 'Progress' && (
                <button
                  type="button"
                  onClick={() => setNote(prev => ({ ...prev, content: getSOAPTemplate() }))}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Load SOAP Template
                </button>
              )}
              {note.noteType === 'Consultation' && (
                <button
                  type="button"
                  onClick={() => setNote(prev => ({ ...prev, content: getConsultTemplate() }))}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Load Consult Template
                </button>
              )}
              {note.noteType === 'New ER Operative Report' && (
                <button
                  type="button"
                  onClick={() => setNote(prev => ({ ...prev, content: getEROperativeTemplate() }))}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Load ER Operative Template
                </button>
              )}
              {note.noteType === 'New OR Operative Report' && (
                <button
                  type="button"
                  onClick={() => setNote(prev => ({ ...prev, content: getOROperativeTemplate() }))}
                  className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Load OR Operative Template
                </button>
              )}
            </div>
          </div>
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