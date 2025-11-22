import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaSave, FaArrowLeft, FaSpinner, FaTrash, FaRobot, FaEdit, FaDownload, FaFileImage } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import ConsultationNoteDisplay from '../../components/notes/ConsultationNoteDisplay';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ChromePicker } from 'react-color';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
  headerImage?: string;
  footerImage?: string;
}

interface SOAPFormData {
  patientName: string;
  patientDOB: string;
  location: string;
  dateOfService: string;
  mrn: string;
  subjectiveKeyPoints: string;
  physicalExamFindings: string;
  planKeyPoints: string;
  subjective: string;
  objective: string;
  xRays: string;
  assessment: string;
  plan: string;
}

const NoteForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { token } = useAuth();
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
    isAiGenerated: false,
    headerImage: '',
    footerImage: '',
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
  const [consultationNoteData, setConsultationNoteData] = useState<any>(null);
  const [showJsonView, setShowJsonView] = useState<boolean>(false);
  const [showSOAPForm, setShowSOAPForm] = useState<boolean>(false);
  const [soapFormData, setSoapFormData] = useState<SOAPFormData>({
    patientName: '',
    patientDOB: '',
    location: '',
    dateOfService: new Date().toLocaleDateString(),
    mrn: '',
    subjectiveKeyPoints: '',
    physicalExamFindings: '',
    planKeyPoints: '',
    subjective: '',
    objective: '',
    xRays: '',
    assessment: '',
    plan: '',
  });
  // Add these new state variables near the existing useState declarations
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [footerFile, setFooterFile] = useState<File | null>(null);
  const [existingTemplates, setExistingTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [useExistingTemplate, setUseExistingTemplate] = useState<boolean>(false);

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['link', 'image', 'clean'],
    ],
  };

  const getSOAPTemplate = (formData: SOAPFormData) => {
    return `
<h2>SOAP Note - Progress Note</h2>
<p><strong>Patient Information:</strong></p>
<ul>
  <li><strong>Patient Name:</strong> ${formData.patientName || '[To be filled from patient selection]'}</li>
  <li><strong>Patient Date of Birth:</strong> ${formData.patientDOB || '[To be filled from patient data]'}</li>
  <li><strong>Location:</strong> ${formData.location || '[To be pulled from appointment settings]'}</li>
  <li><strong>Date of Service:</strong> ${formData.dateOfService}</li>
  <li><strong>MRN:</strong> ${formData.mrn || '[Internal MRN not hospital MRN]'}</li>
</ul>
<h3>Corresponding Form</h3>
<ul>
  <li><strong>Key points about the subjective:</strong> ${formData.subjectiveKeyPoints || '[To be filled]'}</li>
  <li><strong>Key physical exam findings:</strong> ${formData.physicalExamFindings || '[To be filled]'}</li>
  <li><strong>Plan:</strong> ${formData.planKeyPoints || '[To be filled]'}</li>
</ul>
<h3>SOAP Note</h3>
<h4>Subjective:</h4>
<p>${formData.subjective || '[The subjective portion should be written in paragraph format and must include...]'}</p>
<h4>Objective:</h4>
<p>${formData.objective || '[A standard exam that would be expected given the information provided...]'}</p>
<h4>X-Rays:</h4>
<p>${formData.xRays || '[For any patient whose diagnosis includes a fracture...]'}</p>
<h4>Assessment:</h4>
<p>${formData.assessment || '[Provide a comprehensive summary of the patient\'s medical condition...]'}</p>
<h4>Plan:</h4>
<p>${formData.plan || '[For anything that is not applicable put "not applicable"...]'}</p>
<hr>
<p><em>Note: This is a template for a SOAP note. Please fill in all the bracketed sections with the appropriate patient information and clinical details.</em></p>
    `;
  };

  // Consultation Note Template
  const getConsultTemplate = (selectedPatient?: Patient) => {
    const patientName = selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '';
    const patientDOB = selectedPatient && selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : '';
    const currentDate = new Date().toLocaleDateString();
    
    return `<h2>Consultation Note</h2>

<p><strong>I expect that the following will be carried over directly from the intake form or EMR:</strong></p>
<ul>
  <li><strong>Patient Name:</strong> ${patientName || '[To be filled from patient selection]'}</li>
  <li><strong>Patient Date of Birth:</strong> ${patientDOB || '[To be filled from patient data]'}</li>
  <li><strong>Location:</strong> should be pulled from the appointment settings</li>
  <li><strong>Date of Service:</strong> should be pulled from the appointment settings</li>
</ul>

<h3>Corresponding Form</h3>
<ul>
  <li><strong>MRN:</strong> [To be filled]</li>
  <li><strong>Assessment:</strong> [To be filled]</li>
  <li><strong>Plan:</strong> [To be filled]</li>
  <li><strong>Medications:</strong> None, Ordered Antibiotics, Discontinue antibiotics, other_____</li>
  <li><strong>Therapy:</strong> None, Ordered, Continue, Discontinue, Offered and Declined</li>
  <li><strong>Outside Imaging or Nerve Study:</strong> None, Prescription Provided for ______</li>
  <li><strong>Splint:</strong> Options should be provided, ordered, discontinued or continued
    <ul>
      <li><strong>Type:</strong> ________</li>
    </ul>
  </li>
  <li><strong>Injections:</strong> None (Default), Fluoroscopy guided, not fluoroscopy guided
    <ul>
      <li><strong>Location:</strong> [To be filled]</li>
      <li><strong>Medication:</strong> Kenalog, Kenalog</li>
    </ul>
  </li>
  <li><strong>Work/School Status:</strong> No Restrictions, One handed duty, 5Lbs restriction, 10lbs restriction, 15lbs Restriction, 20lbs restriction, no gym class</li>
  <li><strong>Specific Comments:</strong> [To be filled]</li>
</ul>

<h3>Consult Note Generation Prompt</h3>
<p>You are an expert surgeon specializing in hand surgery, peripheral nerve surgery, and microsurgery. Your target audience for this consult note includes insurance auditors, judges, or juries, where fine details are critical.</p>

<h4>Key Instructions:</h4>
<p><strong>Tone and Detail:</strong></p>
<p>All responses must be overly detailed. Every piece of information provided in the prompt is essential; no details should be removed. If any details are missing or unclear, you must add or clarify them. Please pull detail from the intake forms, visit forms, and any uploaded images or PDFs. For Any images or PDF of reports please analyze the text and focus on the interpretation or results section if present.</p>

<h4>Appointment Details:</h4>
<ul>
  <li><strong>Patient Name:</strong> ${patientName}</li>
  <li><strong>Date of Birth:</strong> ${patientDOB}</li>
  <li><strong>Date of Service:</strong> [should be pulled from the appointment settings]</li>
  <li><strong>Location:</strong> [should be pulled from the appointment settings]</li>
  <li><strong>Place of Service:</strong> [To be filled]</li>
  <li><strong>MRN:</strong> [To be filled]</li>
</ul>

<h4>Chief Complaint:</h4>
<p>Short description of why the consult is conducted</p>

<h4>HPI:</h4>
<p>This is a subjective portion should always be written in paragraph format. It must include:</p>
<ul>
  <li>The patient's age and gender.</li>
  <li>The time elapsed since any injury (e.g., "7 days after the patient fell and broke her wrist").</li>
  <li>Any prehospital care received, how the arrived at the hospital (eg. Ambulance or if they were driven.)</li>
  <li>Any care received in the hospital before I arrived.</li>
  <li>The patients medical history, surgical history and allergies should be included in this section.</li>
  <li>Any pain or sensory complaints the patient has should be included here as well.</li>
  <li>The specific laterality of the injury should always be mentioned</li>
  <li>The specific body part should be mentioned when known and possible for example wrist, or thumb or metacarpal. The more specific the better. The laterality should always be mentioned.</li>
  <li>If there are studies/reports uploaded such as, labs, imaging, nerve studies please include these here.</li>
</ul>

<h4>Objective:</h4>
<p>A standard exam that would be expected given the information provided. For heart and lungs I often don't oscultate. So describe in terms of things that could be seen without listening. For example Heart: Regular rate and rhythm (that can be checked by palpating the radial artery), Lungs: Regular respiratory rate and pattern no respiratory distress. All other things do as normal.</p>

<h4>Assessment:</h4>
<ul>
  <li>Provide a comprehensive summary of the patient's medical condition in sentence format.</li>
  <li>Follow this with a numbered list of diagnoses, each with the correct ICD-10 codes.</li>
</ul>

<h4>Plan:</h4>
<p>For anything that is not applicable put not applicable</p>
<p>Structure the plan as a numbered list and sub lists.</p>
<p>Divide the plan into services provided during today's visit.</p>
<ul>
  <li><strong>Prescriptions Provided:</strong> Therapy, splint, antibiotics, imaging or other.</li>
  <li><strong>Dressing or Splint care:</strong> [To be filled]</li>
  <li><strong>Activity:</strong> Showering weight limits</li>
  <li><strong>Work or school status:</strong> [To be filled]</li>
  <li><strong>Follow up:</strong> [To be filled]</li>
</ul>`;
  };

  const getEROperativeTemplate = (selectedPatient?: Patient) => {
    const patientName = selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '';
    const patientDOB = selectedPatient && selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : '';
    const currentDate = new Date().toLocaleDateString();
    
    return `<h2>ER Operative Report</h2>

<p><strong>I expect that the following will be carried over directly from the intake form or EMR:</strong></p>
<ul>
  <li><strong>Patient Name:</strong> ${patientName || '[To be filled from patient selection]'}</li>
  <li><strong>Patient Date of Birth:</strong> ${patientDOB || '[To be filled from patient data]'}</li>
  <li><strong>Location:</strong> should be pulled from the appointment settings</li>
  <li><strong>Date of Service:</strong> should be pulled from the appointment settings</li>
</ul>

<h3>Corresponding Form</h3>
<ul>
  <li><strong>MRN:</strong> [To be filled]</li>
  <li><strong>Surgeon:</strong> [To be filled]</li>
  <li><strong>Implants:</strong> [To be filled]</li>
  <li><strong>Wound Class:</strong> (Contaminated, Dirty) this should be a dropdown</li>
  <li><strong>Preoperative Diagnosis:</strong> [To be filled]</li>
  <li><strong>Postoperative Diagnosis:</strong> If left blank should be the same as above</li>
  <li><strong>Procedure List:</strong> [To be filled]</li>
  <li><strong>Specific notes about the surgery:</strong> [To be filled]</li>
</ul>

<h3>Operative Report Prompt Instructions</h3>
<p><strong>Role:</strong></p>
<p>You are an expert surgeon specializing in hand surgery, peripheral nerve surgery, and microsurgery. Your target audience includes insurance auditors, judges, and juries who require overly detailed, the documentation must be interpreted as precise and intentional. In cases with intraoperatively complications or adverse events they should be discussed in such a way that it was unavoidable, or inevitable due to the initial injury or the anatomy, or the patients actions. Add any missing details as needed.</p>

<h4>Formatting Requirements:</h4>
<p>Every operative report must follow this standardized template:</p>

<h4>Operative Dictation:</h4>
<ul>
  <li><strong>Patient Name:</strong> ${patientName || '[To be filled]'}</li>
  <li><strong>Patient Date of Birth:</strong> ${patientDOB || '[To be filled]'}</li>
  <li><strong>Location:</strong> (Which hospital)</li>
  <li><strong>Place of Service:</strong> Emergency Room</li>
  <li><strong>MRN:</strong> [To be filled]</li>
  <li><strong>Date of Service:</strong> [should be pulled from the appointment settings]</li>
  <li><strong>Surgeon:</strong> Oren Michaeli, DO</li>
  <li><strong>Assistant Surgeon (if applicable):</strong> If not specified then there was none.</li>
  <li><strong>Anesthesia Type:</strong> Local (unless sedation is used from reduction of dislocations)</li>
  <li><strong>Estimated Blood Loss:</strong> Less than 10 ml (unless otherwise stated)</li>
  <li><strong>Implants:</strong> (List any applicable: Nerve grafts, Nerve wraps, K-wires, integra)</li>
  <li><strong>Wound Class:</strong> (Contaminated, Dirty)</li>
</ul>

<h4>Preoperative Diagnosis:</h4>
<p>Provide numbered list.</p>

<h4>Postoperative Diagnosis:</h4>
<p>Provide numbered list, including exact diagnosis, followed by the ICD-10 codes, and then official ICD-10 descriptions in parentheses.</p>

<h4>Procedures Performed:</h4>
<p>Provide numbered list, specifying the detailed procedure description, followed by the associated CPT codes, and then the official CPT code descriptions.</p>

<h4>Indication for Assistant (if applicable):</h4>
<p>Usually omit this section unless an assistant was specified.</p>
<p>Usually if there is one it's a resident and the indication was that it is a teaching facility.</p>

<h4>Indication for Surgery:</h4>
<p>Each procedure must be individually justified with a direct link to the diagnosis.</p>
<p>Describe negative repercussions of not performing the procedure and potential benefits or time sensitivity if applicable.</p>

<h4>Procedure Details:</h4>
<p>Each numbered procedure must described separately, in independent paragraphs.</p>
<p>Avoid repetitive phrasing; each step must appear uniquely critical in order to justify high billing fees. If it is discussed briefly it gives the impression it is insignificant and insurance companies and arbitrators wont allow for high billing.</p>
<p>Begin with patient positioning, irrigation then sterile prep and partially draped. Prep is usually betadine unless express otherwise.</p>
<p>Use vivid, precise anatomical language; imagine detailing the procedure to someone visualizing it step-by-step without prior visibility. The direction structures are retracted should be discussed as well as the instruments used to dissect and retract (Use terms like ulnar/ly, radial/ly, distally and proximally). Someone reading this operative report should be able to reproduce this operation as if it were a manual.</p>
<p>In every operative case involving an open wound, describe thorough irrigation of the surgical site.</p>

<h4>Specific Procedure Descriptions depending on the procedure list provided. These details must be included although it is ok to paraphrase or expand on it. Always repeat multiple times the specific laterality and body part example left small finger or right wrist.</h4>

<ol>
  <li><strong>Sterile Preparation</strong>
    <p>Contaminated or Dirty cases (if applicable):</p>
    <p>The extremity was prepared using a betadine-based solution in accordance with contaminated or infected wound protocols unless otherwise stated.</p>
  </li>
  <li><strong>A1 Pully release</strong>
    <p>When discussing this step always say that the A1 pully was sharply cut under direct visualization ensuring the protection of neighboring neurovascular bundles. Always mention that the flexor tendon was not injured during the release.</p>
  </li>
  <li><strong>Flexor Tendon washout</strong>
    <p>This have a bruner incision with the incision over the distal phalanx and the palm this will be accompanied by an A1 release (see above for how to describe that). After that happens describe making a knick in the tendon sheath revealing cloudy fluid unless otherwise specified and the advancement of an 18 gauge Angiocatheter from proximal to distal into the sheath and irrigated with 200cc of saline with the effluent being clear. These will always be loosely closed to allow for drainage.</p>
  </li>
  <li><strong>Digital Block</strong>
    <p>Always 3ml of 1% lidocaine without epinephrine to the volar base of the finger to anesthetize the volar ulnar and radial digital nerve and 2ml to the dorsal base of the finger to anesthetize the dorsal digital sensory nerves.</p>
  </li>
  <li><strong>Nailbed Repair</strong>
    <p>Start with devitalized nailbed is sharply excised with a tenotomy scissor. The nailbed ends are then approximated using a 5-0 chromic suture at 2mm intervals with a horizontal mattress suture. The aluminum from the suture packaging is cut to the shape of a nail plate and placed under the eponychium and paronychium to allow for healing and splint of the wound.</p>
  </li>
  <li><strong>Nail Plate Removal</strong>
    <p>This is always done with a freer elevator advanced below the nailplate to elevate it off the nailbed and above the nail plate to separate from the eponychium.</p>
  </li>
  <li><strong>Light wound debridement</strong>
    <p>Describe using a surgical scissor to remove 1-2 grams of devitalized and contaminated skin and fatty tissue needed to decrease infection risk and allow for proper healing.</p>
  </li>
  <li><strong>Tendon debridement</strong>
    <p>Describe the poor condition of the tendon edges and the need to debride to healthy tissue to decrease infection and facilitate repair.</p>
  </li>
  <li><strong>Bone debridement or open fracture debridement</strong>
    <p>If the distal end is amputated from the fracture state that a rongour was used and 1-2mm of bone was removed. If it is an open fracture due to a finger tip and it is accompanied by a nailbed repair say it was debrided with the sharp end of a scissor but don't specify the exact amount just say it was needed to remove contaminants and allow a thorough washout.</p>
  </li>
  <li><strong>Rotational flap of the nail bed</strong>
    <p>Must mention elevating of the nail bed off the nail plate and mobilizing the nail bed mention needing to make a back cut to facilitate the mobility and advancing it over the defect to cover the distal phalanx periosteum. Then describe suturing it to the adjacent nail bed tissue with a 5-0 chromic suture.</p>
  </li>
  <li><strong>Finger arthrotomy</strong>
    <p>A longitudinal incision made over the dorsum of the (MCP of PIP or DIP or IP) joint. Care taken to avoid injury to the extensor mechanism. The joint capsule is incised, if infected say and immediately, cloudy fluid was expressed. Cultures were taken for aerobic, anaerobic, and fungal organisms. These will be left to heal by secondary intention Unless otherwise stated earlier in the prompt.</p>
  </li>
  <li><strong>Full Thickness skin graft</strong>
    <p>This will always be accompanied by the procedure "Advancement flap and primary closure of right medial forearm defect" which should be listed separately. This is how that should be described. 7cc of lidocaine with epinephrine is injected for its hemostatic and anesthetic affect and given 10 min to work. A full-thickness skin graft was harvested using a #15 scalpel blade, from the medial forearm. All adipose tissue sharply debrided. This graft was sutured onto the finger (specify which finger) defect using 4-0 chromic sutures.</p>
    <p>Due to significant tension on the medial forearm defect which was approximately 3cm X 3cm (approximately 28cm squared), dissections were performed along medial and lateral subcutaneous planes to elevate vascularized skin flaps. Following adequate mobilization of these flaps, a deep dermal approximation was carried out using 3-0 Vicryl sutures. Skin closure was then completed with a 5-0 subcuticular suture, reinforced with Steri-Strips.</p>
  </li>
  <li><strong>Extensor Tendon Repair</strong>
    <p>For the repair of the extensor digitorum communis tendon, I employed a 4-0 PDS suture. The repair technique consisted of two central figure-of-eight stitches complemented by two peripheral horizontal mattress sutures, ensuring a robust and durable repair. The suture bites were taken 1cm back from the torn ends of the tendon, creating a secure, eight-strand repair configuration.</p>
  </li>
  <li><strong>Primary Nerve Repair (Coaptation) if applicable</strong>
    <p>Neurolysis performed until healthy vaso-nervosum and fascicles exposed.</p>
    <p>Sharp debridement with straight microscissors until healthy, bleeding, and bulging fascicles visible. May also be likened to a bugs eyes.</p>
    <p>Coaptation performed with two interrupted 9-0 nylon sutures, leaving a visible 0.1 mm light gap. May also be described as a grandmas kiss.</p>
    <p>A tension free repair should always be.</p>
    <p>Always say that the limb or digit was fully ranged through its motion to test that the suture line will not break. Do not however mention this if the joint was fused or kwired to immobilize.</p>
  </li>
  <li><strong>Synthetic Nerve Membrane (if applicable)</strong>
    <p>If used, describe membrane placement to minimize axonal sprouting and prevent neuroma.</p>
    <p>If applicable, include soaking in stem cell solution with brief citation supporting Schwann cell differentiation.</p>
    <p>Secure with 9-0 nylon sutures, then reinforce with fibrin glue.</p>
  </li>
</ol>

<h4>Final Note</h4>
<p>Ensure absolute compliance with each instruction. Maintain maximum clarity, precision, and anatomical detail in your documentation at all times. The procedures listed above have key points that MUST be mentioned. Sometimes I will do surgeries that are not listed above if the procedure list that is provided does not have a corresponding instructions please write the procedure yourself but with that same level of detail and minutia.</p>`;
  };

  const getOROperativeTemplate = (selectedPatient?: Patient) => {
    const patientName = selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '';
    const patientDOB = selectedPatient && selectedPatient.dateOfBirth ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : '';
    const currentDate = new Date().toLocaleDateString();
    
    return `<h2>OR Operative Report</h2>

<p><strong>I expect that the following will be carried over directly from the intake form or EMR:</strong></p>
<ul>
  <li><strong>Patient Name:</strong> ${patientName || '[To be filled from patient selection]'}</li>
  <li><strong>Patient Date of Birth:</strong> ${patientDOB || '[To be filled from patient data]'}</li>
  <li><strong>Location:</strong> should be pulled from the appointment settings</li>
  <li><strong>Date of Service:</strong> should be pulled from the appointment settings</li>
</ul>

<h3>Corresponding Form</h3>
<ul>
  <li><strong>MRN:</strong> [To be filled]</li>
  <li><strong>Surgeon:</strong> [To be filled]</li>
  <li><strong>Assistant Surgeon:</strong> [To be filled]</li>
  <li><strong>Anesthesia Type:</strong> [To be filled]</li>
  <li><strong>Implants:</strong> [To be filled]</li>
  <li><strong>Wound Class:</strong> (Clean, Contaminated, Dirty) this should be a dropdown</li>
  <li><strong>Preoperative Diagnosis:</strong> [To be filled]</li>
  <li><strong>Postoperative Diagnosis:</strong> If left blank should be the same as above</li>
  <li><strong>Procedure List:</strong> [To be filled]</li>
  <li><strong>Specific notes about the surgery:</strong> [To be filled]</li>
</ul>

<h3>Operative Report Prompt Instructions</h3>
<p><strong>Role:</strong></p>
<p>You are an expert surgeon specializing in hand surgery, peripheral nerve surgery, and microsurgery. Your target audience includes insurance auditors, judges, and juries who require overly detailed, the documentation must be interpreted as precise and intentional. In cases with intraoperatively complications or adverse events they should be discussed in such a way that it was unavoidable, or inevitable due to the initial injury or the anatomy, or the patients actions. Add any missing details as needed. Everything to follow is a general rule but any special notes above superseded anything below.</p>

<h4>Formatting Requirements:</h4>
<p>Every operative report must follow this standardized template:</p>

<h4>Operative Dictation:</h4>
<ul>
  <li><strong>Patient Name:</strong> ${patientName || '[To be filled]'}</li>
  <li><strong>Patient Date of Birth:</strong> ${patientDOB || '[To be filled]'}</li>
  <li><strong>Location:</strong> (Which hospital)</li>
  <li><strong>Place of Service:</strong> (Emergency - Inpatient, Emergency - Outpatient, Elective - Inpatient, Elective - Outpatient)</li>
  <li><strong>MRN:</strong> [To be filled]</li>
  <li><strong>Date of Service:</strong> [should be pulled from the appointment settings]</li>
  <li><strong>Surgeon:</strong> Oren Michaeli, DO</li>
  <li><strong>Assistant Surgeon (if applicable):</strong> [To be filled]</li>
  <li><strong>Anesthesia Type:</strong> [To be filled]</li>
  <li><strong>Estimated Blood Loss:</strong> Less than 10 ml (unless otherwise stated)</li>
  <li><strong>Implants:</strong> (List any applicable: plates, screws, anchors, suture tape, tightropes, nerve grafts, nerve wraps, K-wires, intramedullary nails, bone allografts)</li>
  <li><strong>Wound Class:</strong> (Clean, Contaminated, Dirty)</li>
</ul>

<h4>Preoperative Diagnosis:</h4>
<p>Provide numbered list.</p>

<h4>Postoperative Diagnosis:</h4>
<p>Provide numbered list, including exact diagnosis, followed by the ICD-10 codes, and then official ICD-10 descriptions in parentheses.</p>

<h4>Procedures Performed:</h4>
<p>Provide numbered list, specifying the detailed procedure description, followed by the associated CPT codes, and then the official CPT code descriptions.</p>

<h4>Indication for Assistant (if applicable):</h4>
<p>Clearly justify necessity of the assistant. If the information has been provided to you for the specific assistant please include the specialty, the board certification, years in practice and any other unique qualifiers. Also highlight why this procedure requires more than one experienced surgeon.</p>

<h4>Indication for Surgery:</h4>
<p>Each procedure must be individually justified with a direct link to the diagnosis.</p>
<p>Describe negative repercussions of not performing the procedure and potential benefits or time sensitivity if applicable.</p>

<h4>Procedure Details:</h4>
<p>Each numbered procedure must be described separately, in independent paragraphs.</p>
<p>Avoid repetitive phrasing; each step must appear uniquely critical in order to justify high billing fees. If it is discussed briefly it gives the impression it is insignificant and insurance companies and arbitrators wont allow for high billing.</p>
<p>Begin with patient positioning, sterile preparation, placement of a protective barrier, tourniquet (if used), and performing a preoperative timeout. including confirmation of antibiotics, DVT prophylaxis, and laterality prior to tourniquet inflation or skin incision.</p>
<p>For Procedures in the emergency room only state that the extremity was irrigated then prepped and partially draped.</p>
<p>Conclude with verification of counts, confirmation of perfusion of the extremity or digit, and the patient's complication-free emergence from anesthesia (if general anesthesia was used).</p>
<p>Use vivid, precise anatomical language; imagine detailing the procedure to someone visualizing it step-by-step without prior visibility. The direction structures are retracted should be discussed as well as the instruments used to dissect and retract (Use terms like ulnar/ly, radial/ly, distally and proximally). Someone reading this operative report should be able to reproduce this operation as if it were a manual.</p>
<p>In every operative case involving an open wound, describe thorough irrigation of the surgical site.</p>

<h4>Specific Procedure Descriptions depending on the procedure list provided. These details must be included although it is ok to paraphrase or expand on it.</h4>

<ol>
  <li><strong>Sterile Preparation</strong>
    <p>Clean cases (if applicable):</p>
    <p>Initially, the arm was meticulously scrubbed using a surgical-grade sponge, followed by drying with a sterile towel to ensure the absence of residual moisture. This procedure was diligently repeated. Subsequently, the [specify laterality and extremity] received a double application of a chlorhexidine preparation stick. A sterile surgical drape was applied, followed by a final chlorhexidine application within the sterile field.</p>
    <p>Contaminated or Dirty cases (if applicable):</p>
    <p>The extremity was prepared using a betadine-based solution in accordance with contaminated or infected wound protocols.</p>
  </li>
  <li><strong>Volar Plating of Distal Radius (If applicable)</strong>
    <p>Prior to incision inspect the fracture under fluoroscopic guidance and attempt preliminary reduction.</p>
    <p>A modified Henry approach was used. The FCR was palpated and a 10 cm incision made using a 15 blade. The FCR sheath was incised with a 15 blade, and a push-cut technique used proximally and distally with tenotomy scissors. A Ragnell retractor retracted the FCR ulnarly. The base and floor of the tendon sheath were opened with a tenotomy. The FPL was freed with finger-sweep dissection. The pronator quadratus was then cut with a bipolar and a combination of blunt dissection with a raytech and a key elevator was used to expose the fracture.</p>
    <p>A freer elevator was used to open the fracture; hematoma was evacuated.</p>
    <p>DRUJ stability was assessed with the elbow at 90° in both pronation and supination if there was an associated ulnar styloid fracture.</p>
    <p>The volar plate was fixed distally first with screws to leverage and reduce the distal fragments.</p>
    <p>Proximal screws were placed to complete longitudinal stabilization.</p>
    <p>Fluoroscopy confirmed proper screw placement, no intra-articular penetration, and satisfactory construct alignment.</p>
    <p>If specified that it was an arthroscopically assisted distal radius volar plating please describe as follows.</p>
    <p>If anatomic alignment remained suboptimal (e.g., >2mm displacement), arthroscopic intervention may be employed to enhance precision. The arthroscope was introduced dorsally, adjacent to Lister's tubercle, through the inter-compartmental space without disrupting tendon sheaths. Extensive irrigation was performed to improve joint visibility.</p>
    <p>A 6R portal was created with a small incision radial to the ECU, dissecting to the capsule. A probe introduced through this portal allowed adjustment of the fragments to a 0mm step-off.</p>
    <p>After achieving alignment, the plate was first fixed distally, leveraging the distal fragment against the volar plate for anatomic tilt. Proximal screws were subsequently placed to secure longitudinal stability.</p>
    <p>Screw placement and construct integrity were verified both arthroscopically and fluoroscopically, ensuring no intra-articular penetration and confirming optimal stabilization and wrist functionality.</p>
  </li>
  <li><strong>Ulnar Styloid Fixation (if applicable)</strong>
    <p>2 cm incision made between ECU and FCU. The ulnar sensory nerve was identified and protected.</p>
    <p>TFCC instability was addressed using a specialized hook plate to secure soft tissues to the ulnar styloid.</p>
    <p>Screws were placed proximally to avoid intra-articular impingement and ensure DRUJ support. In some instances I will place a screw diagonally through the styloid into the neck/ shaft. Only include this detail if it is mentioned above.</p>
  </li>
  <li><strong>Intramedullary Nailing of Metacarpal (if applicable)</strong>
    <p>A 1.4 mm K-wire was inserted at the dorsal third of the metacarpal head and advanced into the medullary canal.</p>
    <p>Fracture reduced manually; fluoroscopic alignment confirmed.</p>
    <p>A 0.3 mm skin incision allowed passage of a cannulated drill/reamer system.</p>
    <p>After canal preparation, Skeletal Dynamics intramedullary nail was inserted over a guidewire and buried beneath the articular cartilage.</p>
    <p>Must include the size of the screw</p>
    <p>Must specify the digit number 1st-5th, with 1st being the thumb and 5th being the small finger. Also must mention the laterality.</p>
    <p>If multiple fingers are involved each should be discussed separately.</p>
  </li>
  <li><strong>Blood Vessel Anastomosis (if applicable)</strong>
    <p>Hematoma and adhesions were removed. The arterial ends were mobilized.</p>
    <p>Adventitia was sharply removed with straight micro-scissors.</p>
    <p>Vessel ends debrided until healthy tissue was visible.</p>
    <p>Ends bathed in a heparin, lidocaine, and papaverine solution.</p>
    <p>Microscopic vessel dilators expanded the lumen incrementally.</p>
    <p>Vessel approximated using clamps and anastomosed with 8-0 nylon sutures under magnification.</p>
    <p>Perfusion confirmed after clamp release.</p>
  </li>
  <li><strong>Primary Nerve Repair (Coaptation) if applicable</strong>
    <p>Neurolysis performed until healthy vaso nervosum and fascicles exposed.</p>
    <p>Sharp debridement with straight microscissors until healthy, bleeding, and bulging fascicles visible. May also be likened to a bugs eyes.</p>
    <p>Coaptation performed with two interrupted 9-0 nylon sutures, leaving a visible 0.1 mm light gap. May also be described as a grandmas kiss.</p>
    <p>A tension free repair should always be.</p>
    <p>Fibrin glue applied to reinforce the repair using a drop, drop method.</p>
    <p>Always say that the limb or digit was fully ranged through its motion to test that the suture line will not break. Do not however mention this if the joint was fused or kwired to immobilize.</p>
  </li>
  <li><strong>Nerve Graft (if applicable)</strong>
    <p>Document diameter and length of graft.</p>
    <p>Thaw nerve allograft, trim with microscissors, and coapt both ends with 9-0 nylon interrupted sutures.</p>
    <p>Apply fibrin glue proximally and distally.</p>
  </li>
  <li><strong>Synthetic Nerve Membrane (if applicable)</strong>
    <p>If used, describe membrane placement to minimize axonal sprouting and prevent neuroma.</p>
    <p>If applicable, include soaking in stem cell solution with brief citation supporting Schwann cell differentiation.</p>
    <p>Secure with 9-0 nylon sutures, then reinforce with fibrin glue.</p>
  </li>
  <li><strong>Intraoperative Nerve Stimulation (AKA ReGen, if applicable)</strong>
    <p>Electrode placed proximal to nerve repair at last known healthy nerve.</p>
    <p>Settings: 100 pulses/sec for 10 minutes at 2 mA.</p>
    <p>Document device used and total stimulation time.</p>
  </li>
  <li><strong>Nano Fat Stem Cell Grafting with Tulip if applicable</strong>
    <p>100 cc of tumescent fluid (saline, lidocaine, epinephrine) infiltrated into lower abdomen.</p>
    <p>Suction cannula is always advanced through the umbilicus.</p>
    <p>Fat harvested using Tulip cannula under manual suction pressure.</p>
    <p>Gravity separation performed; supernatant and infranatant discarded.</p>
    <p>Fat filtered through sequential Tulip filters to create nanofat.</p>
    <p>~10 cc reserved for injection.</p>
  </li>
  <li><strong>Bone Grafting with allograft if applicable</strong>
    <p>Fracture hematoma is cleared, then the void is packed with bone allograft. This could be added anywhere on the body that makes sense either after plating or in the middle of the plating. The packing must be tight.</p>
  </li>
</ol>

<h4>Final Note</h4>
<p>Ensure absolute compliance with each instruction. Maintain maximum clarity, precision, and anatomical detail in your documentation at all times.</p>

<p><strong>Place of Service:</strong> (Emergency - Inpatient, Emergency - Outpatient, Elective - Inpatient, Elective - Outpatient) this should be a drop down.</p>`;
  };

  const processContentToHTML = (text: string): string => {
    if (!text) return text;
    let html = text
      .split('\n\n')
      .map(paragraph => {
        let p = paragraph.trim();
        if (p.startsWith('- ')) {
          p = p.replace(/^- /gm, '<li>');
          return `<ul><li>${p.slice(2)}</li></ul>`;
        }
        return `<p>${p.replace(/\n/g, '<br />')}</p>`;
      })
      .join('');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return html;

  };

  // Update the existing handleHeaderImageChange function
  const handleHeaderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeaderFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setNote(prev => ({ ...prev, headerImage: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Update the existing handleFooterImageChange function
  const handleFooterImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFooterFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        setNote(prev => ({ ...prev, footerImage: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const patientsResponse = await axios.get('http://localhost:5000/api/patients?limit=1000', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (patientsResponse.data && Array.isArray(patientsResponse.data.patients)) {
          setPatients(patientsResponse.data.patients);
        } else {
          setPatients([]);
        }
        if (isEditMode && id) {
          const noteResponse = await axios.get(`http://localhost:5000/api/notes/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const noteData = noteResponse.data;
          
          // Handle patient - could be populated object or just ID
          const patientId = noteData.patient?._id || noteData.patient || '';
          
          // Handle visit - could be populated object or just ID
          const visitId = noteData.visit?._id || noteData.visit || null;
          
          setNote({
            _id: noteData._id,
            title: noteData.title || '',
            content: processContentToHTML(noteData.content || ''),
            noteType: noteData.noteType || '',
            colorCode: noteData.colorCode || '#FFFFFF',
            patient: patientId,
            visit: visitId,
            diagnosisCodes: noteData.diagnosisCodes || [],
            treatmentCodes: noteData.treatmentCodes || [],
            attachments: noteData.attachments || [],
            isAiGenerated: noteData.isAiGenerated || false,
            headerImage: noteData.headerImage || '',
            footerImage: noteData.footerImage || '',
          });
          
          // Fetch visits for the patient
          if (patientId) {
            try {
              const visitsResponse = await axios.get(`http://localhost:5000/api/visits/patient/${patientId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setVisits(visitsResponse.data || []);
            } catch (visitError) {
              console.error('Error fetching visits:', visitError);
              setVisits([]);
            }
          }
        }
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditMode, token]);

  const handlePatientChange = async (patientId: string) => {
    const selectedPatient = patients.find(p => p._id === patientId);
    
    setNote(prev => {
      const updatedNote = { ...prev, patient: patientId, visit: null };
      
      // If note type is Consultation and patient is selected, update the template with patient data
      if (prev.noteType === 'Consultation' && selectedPatient) {
        const updatedTemplate = getConsultTemplate(selectedPatient);
        updatedNote.content = updatedTemplate;
      }
      // If note type is ER Operative Report and patient is selected, update the template with patient data
      else if (prev.noteType === 'New ER Operative Report' && selectedPatient) {
        const updatedTemplate = getEROperativeTemplate(selectedPatient);
        updatedNote.content = updatedTemplate;
      }
      // If note type is OR Operative Report and patient is selected, update the template with patient data
      else if (prev.noteType === 'New OR Operative Report' && selectedPatient) {
        const updatedTemplate = getOROperativeTemplate(selectedPatient);
        updatedNote.content = updatedTemplate;
      }
      
      return updatedNote;
    });
    
    if (patientId) {
      try {
        const visitsResponse = await axios.get(`http://localhost:5000/api/visits/patient/${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVisits(visitsResponse.data);
      } catch (error: any) {
        console.error('Error fetching patient visits:', error);
        toast.error('Failed to load patient visits');
      }
    } else {
      setVisits([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Validate color code format if it's the colorCode field
    if (name === 'colorCode') {
      // Allow hex color format (#RRGGBB or #RGB)
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (value === '' || hexColorRegex.test(value)) {
        setNote(prev => ({ ...prev, [name]: value || '#FFFFFF' }));
      }
      return;
    }
    
    const selectedPatient = patients.find(p => p._id === note.patient);
    if (name === 'noteType' && value === 'Progress' && !note.content.trim()) {
      const soapTemplate = getSOAPTemplate({
        ...soapFormData,
        patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '',
        patientDOB: selectedPatient ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : '',
      });
      setNote(prev => ({ ...prev, [name]: value, content: soapTemplate }));
    } else if (name === 'noteType' && value === 'Progress' && note.content.trim()) {
      if (window.confirm('Would you like to load the SOAP template? This will replace your current content.')) {
        const soapTemplate = getSOAPTemplate({
          ...soapFormData,
          patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '',
          patientDOB: selectedPatient ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : '',
        });
        setNote(prev => ({ ...prev, [name]: value, content: soapTemplate }));
      } else {
        setNote(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'noteType' && value === 'Consultation' && !note.content.trim()) {
      const consultTemplate = getConsultTemplate(selectedPatient);
      setNote(prev => ({ ...prev, [name]: value, content: consultTemplate }));
    } else if (name === 'noteType' && value === 'Consultation' && note.content.trim()) {
      if (window.confirm('Would you like to load the Consult template? This will replace your current content.')) {
        const consultTemplate = getConsultTemplate(selectedPatient);
        setNote(prev => ({ ...prev, [name]: value, content: consultTemplate }));
      } else {
        setNote(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'noteType' && value === 'New ER Operative Report' && !note.content.trim()) {
      const erOperativeTemplate = getEROperativeTemplate(selectedPatient);
      setNote(prev => ({ ...prev, [name]: value, content: erOperativeTemplate }));
    } else if (name === 'noteType' && value === 'New ER Operative Report' && note.content.trim()) {
      if (window.confirm('Would you like to load the ER Operative Report template? This will replace your current content.')) {
        const erOperativeTemplate = getEROperativeTemplate(selectedPatient);
        setNote(prev => ({ ...prev, [name]: value, content: erOperativeTemplate }));
      } else {
        setNote(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'noteType' && value === 'New OR Operative Report' && !note.content.trim()) {
      const orOperativeTemplate = getOROperativeTemplate(selectedPatient);
      setNote(prev => ({ ...prev, [name]: value, content: orOperativeTemplate }));
    } else if (name === 'noteType' && value === 'New OR Operative Report' && note.content.trim()) {
      if (window.confirm('Would you like to load the OR Operative Report template? This will replace your current content.')) {
        const orOperativeTemplate = getOROperativeTemplate(selectedPatient);
        setNote(prev => ({ ...prev, [name]: value, content: orOperativeTemplate }));
      } else {
        setNote(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setNote(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleContentChange = (content: string) => {
    setNote(prev => ({ ...prev, content }));
  };

  const handleColorChange = (color: any) => {
    setNote(prev => ({ ...prev, colorCode: color.hex || '#FFFFFF' }));
  };

  const handleSOAPFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSoapFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSOAPFormSubmit = () => {
    const selectedPatient = patients.find(p => p._id === note.patient);
    const updatedTemplate = getSOAPTemplate({
      ...soapFormData,
      patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : soapFormData.patientName,
      patientDOB: selectedPatient ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : soapFormData.patientDOB,
    });
    setNote(prev => ({ ...prev, content: updatedTemplate }));
    setShowSOAPForm(false);
  };



  // Existing search, file handling, and save functions (unchanged)
  const searchDiagnosisCodes = async () => {
    if (!diagnosisSearch.trim()) return;
    setSearchingDiagnosis(true);
    try {
      setTimeout(() => {
        const mockResults = [
          { code: 'M54.5', description: 'Low back pain' },
          { code: 'M54.2', description: 'Cervicalgia (neck pain)' },
          { code: 'M25.511', description: 'Pain in right shoulder' },
          { code: 'M25.512', description: 'Pain in left shoulder' },
          { code: 'M79.604', description: 'Pain in right leg' },
          { code: 'M79.605', description: 'Pain in left leg' },
        ].filter(
          item =>
            item.code.toLowerCase().includes(diagnosisSearch.toLowerCase()) ||
            item.description.toLowerCase().includes(diagnosisSearch.toLowerCase()),
        );
        setDiagnosisResults(mockResults);
        setSearchingDiagnosis(false);
      }, 500);
    } catch (error: any) {
      console.error('Error searching diagnosis codes:', error);
      setSearchingDiagnosis(false);
    }
  };

  const searchTreatmentCodes = async () => {
    if (!treatmentSearch.trim()) return;
    setSearchingTreatment(true);
    try {
      setTimeout(() => {
        const mockResults = [
          { code: '97110', description: 'Therapeutic exercises' },
          { code: '97112', description: 'Neuromuscular reeducation' },
          { code: '97140', description: 'Manual therapy techniques' },
          { code: '97530', description: 'Therapeutic activities' },
          { code: '98940', description: 'Chiropractic manipulation (1-2 regions)' },
          { code: '98941', description: 'Chiropractic manipulation (3-4 regions)' },
        ].filter(
          item =>
            item.code.toLowerCase().includes(treatmentSearch.toLowerCase()) ||
            item.description.toLowerCase().includes(treatmentSearch.toLowerCase()),
        );
        setTreatmentResults(mockResults);
        setSearchingTreatment(false);
      }, 500);
    } catch (error: any) {
      console.error('Error searching treatment codes:', error);
      setSearchingTreatment(false);
    }
  };

  const addDiagnosisCode = (code: DiagnosisCode) => {
    if (!note.diagnosisCodes.some(c => c.code === code.code)) {
      setNote(prev => ({
        ...prev,
        diagnosisCodes: [...prev.diagnosisCodes, code],
      }));
    }
    setDiagnosisSearch('');
    setDiagnosisResults([]);
  };

  const addTreatmentCode = (code: TreatmentCode) => {
    if (!note.treatmentCodes.some(c => c.code === code.code)) {
      setNote(prev => ({
        ...prev,
        treatmentCodes: [...prev.treatmentCodes, code],
      }));
    }
    setTreatmentSearch('');
    setTreatmentResults([]);
  };

  const removeDiagnosisCode = (code: string) => {
    setNote(prev => ({
      ...prev,
      diagnosisCodes: prev.diagnosisCodes.filter(c => c.code !== code),
    }));
  };

  const removeTreatmentCode = (code: string) => {
    setNote(prev => ({
      ...prev,
      treatmentCodes: prev.treatmentCodes.filter(c => c.code !== code),
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFilesToUpload(prev => [...prev, ...newFiles]);
    }
  };

  const removeSelectedFile = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const markAttachmentForRemoval = (attachmentId: string) => {
    setFilesToRemove(prev => [...prev, attachmentId]);
    setNote(prev => ({
      ...prev,
      attachments: prev.attachments.filter(a => a._id !== attachmentId),
    }));
  };

  const generateNote = async () => {
    if (!note.patient || !note.noteType) {
      toast.error('Please select a patient and note type before generating');
      return;
    }
    setGeneratingNote(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/notes/generate',
        {
          patientId: note.patient,
          visitId: note.visit,
          noteType: note.noteType,
          promptData: promptData,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.data.success && response.data.note) {
        toast.success('Note generated successfully');
        const generatedNote = response.data.note;
        if (note.noteType === 'Consultation') {
          try {
            setConsultationNoteData(null);
          } catch (error) {
            console.error('Error parsing consultation note data:', error);
          }
        }
        setNote(prev => ({
          ...prev,
          _id: generatedNote._id,
          title: generatedNote.title,
          content: processContentToHTML(generatedNote.content),
          noteType: generatedNote.noteType,
          colorCode: generatedNote.colorCode || '#FFFFFF',
          patient: generatedNote.patient._id || generatedNote.patient,
          visit: generatedNote.visit ? generatedNote.visit._id : null,
          diagnosisCodes: generatedNote.diagnosisCodes || [],
          treatmentCodes: generatedNote.treatmentCodes || [],
          attachments: generatedNote.attachments || [],
          isAiGenerated: generatedNote.isAiGenerated || true,
        }));
        setPromptData('');
      } else {
        toast.error('Failed to generate note: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Error generating note:', error);
      toast.error('Failed to generate note: ' + (error.response?.data.message || error.message));
    } finally {
      setGeneratingNote(false);
    }
  };

  // const downloadPDF = () => {

  //   const doc = new jsPDF();

  //   let yOffset = 10;

  //   // Add header image if exists
  //   if (note.headerImage) {
  //     doc.addImage(note.headerImage, 'PNG', 10, yOffset, 190, 30); // Centered, adjust size as needed
  //     yOffset += 40;
  //   }

  //   // Add note content
  //   doc.html(note.content, {
  //     callback: function (pdfDoc) {
  //       // Add footer image if exists
  //       if (note.footerImage) {
  //         const pageHeight = pdfDoc.internal.pageSize.height;
  //         pdfDoc.addImage(note.footerImage, 'PNG', 10, pageHeight - 40, 190, 30); // Centered at bottom
  //       }
  //       pdfDoc.save(`${note.title || 'Note'}.pdf`);
  //     },
  //     x: 10,
  //     y: yOffset,
  //     width: 190,
  //     windowWidth: 800,
  //   });
  // };

  // Replace the existing downloadPDF function with this async version


  const downloadPDF = async () => {
    try {
      // Get DrId from auth context, localStorage, or API call (adjust as needed)

      // Upload images to template API if new files are selected
      if (!useExistingTemplate && (headerFile || footerFile)) {
        const uploadFormData = new FormData();

        if (headerFile) {
          uploadFormData.append('headerImage', headerFile);
        }
        if (footerFile) {
          uploadFormData.append('footerImage', footerFile);
        }

        const uploadResponse = await axios.post('http://localhost:5000/api/templates/upload', uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });

        setHeaderFile(null);
        setFooterFile(null);
        toast.success('Header and footer images stored in template successfully');
      } else if (useExistingTemplate) {
        // No upload needed; existing images are already set in note state for PDF
        toast.info('Using existing template images');
      } else {
        toast.warning('No header/footer images selected');
        return;  // Early return if neither
      }

      // Proceed with existing PDF generation (unchanged)
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '595px'; // A4 width in pt (approx 210mm)
      tempDiv.style.padding = '0 20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '10pt';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.color = '#000';
      tempDiv.innerHTML = note.content;
      document.body.appendChild(tempDiv);

      const doc = new jsPDF('p', 'pt', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const marginSide = 20;
      const headerHeight = 60;
      const footerHeight = 60;
      const contentWidth = pageWidth - 2 * marginSide;
      const usableHeight = pageHeight - headerHeight - footerHeight;

      html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })
        .then((canvas) => {
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = contentWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          let heightLeft = imgHeight;
          let position = 0;
          let page = 1;

          while (heightLeft > 0) {
            if (page > 1) doc.addPage();

            // Add Header
            if (note.headerImage) {
              doc.addImage(note.headerImage, 'PNG', 0, 0, pageWidth, headerHeight);
            }

            // Calculate Y crop (for multi-page splitting)
            const sourceY = position * (canvas.height / imgHeight);
            const pageCanvas = document.createElement('canvas');
            const pageCtx = pageCanvas.getContext('2d');
            const pageCanvasHeight = Math.min(
              (usableHeight * canvas.height) / imgHeight,
              canvas.height - sourceY
            );
            pageCanvas.width = canvas.width;
            pageCanvas.height = pageCanvasHeight;
            pageCtx?.drawImage(
              canvas,
              0,
              sourceY,
              canvas.width,
              pageCanvasHeight,
              0,
              0,
              canvas.width,
              pageCanvasHeight
            );

            const pageImgData = pageCanvas.toDataURL('image/png');
            const pageImgHeight = (pageCanvasHeight * imgWidth) / canvas.width;

            // Add content image for this page (below header, above footer)
            doc.addImage(pageImgData, 'PNG', marginSide, headerHeight, imgWidth, pageImgHeight);

            // Add Footer
            if (note.footerImage) {
              doc.addImage(note.footerImage, 'PNG', 0, pageHeight - footerHeight, pageWidth, footerHeight);
            }

            heightLeft -= usableHeight;
            position += usableHeight;
            page++;
          }

          document.body.removeChild(tempDiv);
          doc.save(`${note.title || 'Note'}.pdf`);
        })
        .catch((error) => {
          console.error('Error generating PDF:', error);
          toast.error('Failed to generate PDF');
        });
    } catch (error: any) {
      console.error('Error uploading images or generating PDF:', error);
      toast.error(`Failed: ${error.response?.data?.message || error.message}`);
    }
  };
  // Update the existing useEffect for fetching data: Add template fetch after patients/visits load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // ... existing patients and note fetch code ...


        console.log('Fetching existing template for DrId:', token);
        if (token) {
          try {
            const templateResponse = await axios.get(`http://localhost:5000/api/templates/get-Templates`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (templateResponse.data && Array.isArray(templateResponse.data.data)) {
              setExistingTemplates(templateResponse.data.data);
              // Optional: Auto-select first if none selected
              if (templateResponse.data.data.length > 0 && !selectedTemplateId) {
                setSelectedTemplateId(templateResponse.data.data[0]._id);
              }
            }
          } catch (templateError: any) {
            console.error('Error fetching existing template:', templateError);
            toast.error('Failed to load existing template');
          }
        }
      } catch (error: any) {
        // ... existing error handling ...
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isEditMode, token]);  // No change to dependencies


  const saveNote = async () => {
    if (!note.title || !note.content || !note.patient || !note.noteType) {
      toast.error('Please fill in all required fields including Note Type');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', note.title);
      formData.append('content', note.content);
      formData.append('noteType', note.noteType);
      formData.append('colorCode', note.colorCode || '#FFFFFF');
      formData.append('patientId', note.patient.toString());
      if (note.visit) {
        formData.append('visitId', note.visit.toString());
      }
      if (note.diagnosisCodes.length > 0) {
        formData.append('diagnosisCodes', JSON.stringify(note.diagnosisCodes));
      }
      if (note.treatmentCodes.length > 0) {
        formData.append('treatmentCodes', JSON.stringify(note.treatmentCodes));
      }
      filesToUpload.forEach(file => {
        formData.append('attachments', file);
      });
      if (filesToRemove.length > 0) {
        formData.append('removeAttachments', JSON.stringify(filesToRemove));
      }
      formData.append('isAiGenerated', note.isAiGenerated.toString());
      formData.append('headerImage', note.headerImage || '');
      formData.append('footerImage', note.footerImage || '');
      if (!token) {
        console.error('Authentication token is missing');
        toast.error('Authentication error. Please log in again.');
        return;
      }
      if (isEditMode && id) {
        await axios.put(`http://localhost:5000/api/notes/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success('Note updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/notes', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success('Note created successfully');
      }
      navigate('/notes');
    } catch (error: any) {
      console.error('Error saving note:', error);
      toast.error(`Failed to save note: ${error.response?.data.message || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Add this new handler function near other handlers (e.g., after handleFooterImageChange)
  // Called when user clicks "Use Existing Template"
 // Replace entire function:
 const getImageUrl = (path: string): string => {
  if (!path) return '';
  const normalizedPath = path.replace(/\\/g, '/');
  return `http://localhost:5000/${normalizedPath}`;
};
const handleUseExisting = async () => {
  const selectedTemplate = existingTemplates.find(t => t._id === selectedTemplateId);
  if (selectedTemplate && selectedTemplate.headerImage && selectedTemplate.footerImage) {
    // Fetch images as base64 for PDF (since paths are server-side)
    try {
      const headerBase64 = await fetchImageAsBase64(getImageUrl(selectedTemplate.headerImage));
      const footerBase64 = await fetchImageAsBase64(getImageUrl(selectedTemplate.footerImage));
      setNote(prev => ({ ...prev, headerImage: headerBase64, footerImage: footerBase64 }));
      setUseExistingTemplate(true);
      setHeaderFile(null);
      setFooterFile(null);
      toast.success('Switched to selected template');
    } catch (error) {
      toast.error('Failed to load template images');
    }
  } else {
    toast.warning('No valid template selected');
  }
};

// Add this new helper function (near getImageUrl):
const fetchImageAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

  // Optional: Add a toggle to switch back to custom uploads
  const handleUseCustom = () => {
    setNote(prev => ({ ...prev, headerImage: '', footerImage: '' }));
    setUseExistingTemplate(false);
    toast.info('Switched to custom uploads');
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
          <button onClick={() => navigate('/notes')} className="mr-4 p-2 rounded-full hover:bg-gray-200">
            <FaArrowLeft />
          </button>
          <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Note' : 'Create New Note'}</h1>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={generateNote}
            disabled={!note.patient || !note.noteType || generatingNote}
            className={`flex items-center px-4 py-2 rounded-md ${generatingNote || !note.patient || !note.noteType
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-purple-500 text-white hover:bg-purple-600'
              }`}
          >
            {generatingNote ? <FaSpinner className="animate-spin mr-2" /> : <FaRobot className="mr-2" />}
            Generate with AI
          </button>

          <button
            onClick={downloadPDF}
            disabled={!note.content.trim() || (!useExistingTemplate && !headerFile && !footerFile && !note.headerImage && !note.footerImage)}
            className={`${!note.content.trim() || (!useExistingTemplate && !headerFile && !footerFile && !note.headerImage && !note.footerImage) ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'} flex items-center px-4 py-2 rounded-md`}
          >
            <FaDownload className="mr-2" />
            Download PDF
          </button>

          <button
            onClick={saveNote}
            disabled={saving}
            className={`flex items-center px-4 py-2 bg-blue-500 text-white rounded-md ${saving ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-600'
              }`}
          >
            {saving ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
            Save Note
          </button>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
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
              onChange={e => handlePatientChange(e.target.value)}
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
                <option value="" disabled>
                  No patients available
                </option>
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
              {visits &&
                visits.map(visit => (
                  <option key={visit._id} value={visit._id}>
                    {visit.visitType.charAt(0).toUpperCase() + visit.visitType.slice(1)} Visit -{' '}
                    {new Date(visit.date).toLocaleDateString()}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color Code</label>
            <div className="flex items-center relative">
              <div
                className="w-10 h-10 border-2 border-gray-300 rounded-md mr-2 cursor-pointer hover:border-blue-500 transition-colors"
                style={{ backgroundColor: note.colorCode || '#FFFFFF' }}
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Click to open color picker"
              />
              <input
                type="text"
                name="colorCode"
                value={note.colorCode || '#FFFFFF'}
                onChange={handleChange}
                className="w-32 p-2 border rounded-md"
                placeholder="#FFFFFF"
              />
              {showColorPicker && (
                <div className="absolute z-50" style={{ top: '100%', left: 0, marginTop: '8px' }}>
                  <div 
                    className="fixed inset-0" 
                    onClick={() => setShowColorPicker(false)}
                    style={{ zIndex: 40 }}
                  />
                  <div style={{ position: 'relative', zIndex: 50 }}>
                    <ChromePicker 
                      color={note.colorCode || '#FFFFFF'} 
                      onChange={handleColorChange}
                      onChangeComplete={(color) => {
                        setNote(prev => ({ ...prev, colorCode: color.hex || '#FFFFFF' }));
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Note Content *</label>
            <div className="flex space-x-2">
              {note.noteType === 'Progress' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const selectedPatient = patients.find(p => p._id === note.patient);
                      setNote(prev => ({
                        ...prev,
                        content: getSOAPTemplate({
                          ...soapFormData,
                          patientName: selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : '',
                          patientDOB: selectedPatient ? new Date(selectedPatient.dateOfBirth).toLocaleDateString() : '',
                        }),
                      }));
                    }}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Load SOAP Template
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSOAPForm(true)}
                    className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    <FaEdit className="inline mr-1" /> Corresponding Form
                  </button>
                </>
              )}
              {note.noteType === 'Consultation' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const selectedPatient = patients.find(p => p._id === note.patient);
                      setNote(prev => ({ ...prev, content: getConsultTemplate(selectedPatient) }));
                    }}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Load Consult Template
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowJsonView(!showJsonView)}
                    className={`px-3 py-1 text-sm rounded ${showJsonView ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white hover:bg-purple-600'
                      }`}
                  >
                    {showJsonView ? 'Show Editor' : 'Show Structured View'}
                  </button>
                </>
              )}
              {note.noteType === 'New ER Operative Report' && (
                <button
                  type="button"
                  onClick={() => {
                    const selectedPatient = patients.find(p => p._id === note.patient);
                    setNote(prev => ({ ...prev, content: getEROperativeTemplate(selectedPatient) }));
                  }}
                  className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Load ER Operative Template
                </button>
              )}
              {note.noteType === 'New OR Operative Report' && (
                <button
                  type="button"
                  onClick={() => {
                    const selectedPatient = patients.find(p => p._id === note.patient);
                    setNote(prev => ({ ...prev, content: getOROperativeTemplate(selectedPatient) }));
                  }}
                  className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600"
                >
                  Load OR Operative Template
                </button>
              )}
            </div>
          </div>
          {note.noteType === 'Consultation' && showJsonView && consultationNoteData ? (
            <div className="border rounded-md p-4 bg-gray-50">
              <ConsultationNoteDisplay noteData={consultationNoteData} />
            </div>
          ) : (
            <ReactQuill
              theme="snow"
              value={note.content}
              onChange={handleContentChange}
              modules={quillModules}
              className="h-64 mb-12"
            />
          )}
        </div>
        {showSOAPForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 ">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Edit SOAP Note</h2>
              <div className="space-y-4">
                <div className='hidden'>
                  <label className="block text-sm font-medium text-gray-700 mb-1 ">Patient Name</label>
                  <input
                    type="text"
                    name="patientName"
                    value={soapFormData.patientName}
                    onChange={handleSOAPFormChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="Patient Name"
                  />
                </div>
                <div className='hidden'>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Date of Birth</label>
                  <input
                    type="text"
                    name="patientDOB"
                    value={soapFormData.patientDOB}
                    onChange={handleSOAPFormChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="Patient DOB"
                  />
                </div>
                <div className='hidden'>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={soapFormData.location}
                    onChange={handleSOAPFormChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="Location"
                  />
                </div>
                <div className='hidden'>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Service</label>
                  <input
                    type="text"
                    name="dateOfService"
                    value={soapFormData.dateOfService}
                    onChange={handleSOAPFormChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="Date of Service"
                  />
                </div>
                <div className='hidden'>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MRN</label>
                  <input
                    type="text"
                    name="mrn"
                    value={soapFormData.mrn}
                    onChange={handleSOAPFormChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="MRN"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subjective Key Points</label>
                  <textarea
                    name="subjectiveKeyPoints"
                    value={soapFormData.subjectiveKeyPoints}
                    onChange={handleSOAPFormChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="Key points about the subjective"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Physical Exam Findings</label>
                  <textarea
                    name="physicalExamFindings"
                    value={soapFormData.physicalExamFindings}
                    onChange={handleSOAPFormChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="Key physical exam findings"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan Key Points</label>
                  <textarea
                    name="planKeyPoints"
                    value={soapFormData.planKeyPoints}
                    onChange={handleSOAPFormChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="Plan"
                  />
                </div>
                <div className='hidden'>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subjective</label>
                  <textarea
                    name="subjective"
                    value={soapFormData.subjective}
                    onChange={handleSOAPFormChange}
                    className="w-full p-2 border rounded-md h-24"
                    placeholder="Subjective details"
                  />
                </div>
                <div className='hidden'>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Objective</label>
                  <textarea
                    name="objective"
                    value={soapFormData.objective}
                    onChange={handleSOAPFormChange}
                    className="w-full p-2 border rounded-md h-24"
                    placeholder="Objective details"
                  />
                </div>
                <div className='hidden'>
                  <label className="block text-sm font-medium text-gray-700 mb-1">X-Rays</label>
                  <textarea
                    name="xRays"
                    value={soapFormData.xRays}
                    onChange={handleSOAPFormChange}
                    className="w-full p-2 border rounded-md h-24"
                    placeholder="X-Ray findings"
                  />
                </div>
                <div className='hidden'>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assessment</label>
                  <textarea
                    name="assessment"
                    value={soapFormData.assessment}
                    onChange={handleSOAPFormChange}
                    className="w-full p-2 border rounded-md h-24"
                    placeholder="Assessment details"
                  />
                </div>
                <div className='hidden'>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <textarea
                    name="plan"
                    value={soapFormData.plan}
                    onChange={handleSOAPFormChange}
                    className="w-full p-2 border rounded-md h-24"
                    placeholder="Plan details"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={() => setShowSOAPForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSOAPFormSubmit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Update Note
                </button>
              </div>
            </div>
          </div>
        )}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis Codes</label>
            <div className="flex">
              <input
                type="text"
                value={diagnosisSearch}
                onChange={e => setDiagnosisSearch(e.target.value)}
                placeholder="Search diagnosis codes..."
                className="w-full p-2 border rounded-l-md"
              />
              <button
                onClick={searchDiagnosisCodes}
                disabled={searchingDiagnosis || !diagnosisSearch.trim()}
                className={`px-4 py-2 rounded-r-md ${searchingDiagnosis || !diagnosisSearch.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
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
                onChange={e => setTreatmentSearch(e.target.value)}
                placeholder="Search treatment codes..."
                className="w-full p-2 border rounded-l-md"
              />
              <button
                onClick={searchTreatmentCodes}
                disabled={searchingTreatment || !treatmentSearch.trim()}
                className={`px-4 py-2 rounded-r-md ${searchingTreatment || !treatmentSearch.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
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
          {filesToUpload.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Files to Upload:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {filesToUpload.map((file, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <div className="truncate">
                      <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
                    </div>
                    <button onClick={() => removeSelectedFile(index)} className="text-red-500 hover:text-red-700">
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {note.attachments.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Existing Attachments:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {note.attachments.map(attachment => (
                  <div key={attachment._id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <div className="truncate">
                      <span className="font-medium">{attachment.originalname}</span> (
                      {(attachment.size / 1024).toFixed(1)} KB)
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
        </div> */}
        {existingTemplates.length > 0 && (
          <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <FaFileImage className="mr-2 text-blue-500" />
              Select Existing Template ({existingTemplates.length} available)
            </h3>

            {/* Dropdown for selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Choose Template:</label>
              <select
                value={selectedTemplateId || ''}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">-- Select a Template --</option>
                {existingTemplates.map((template) => (
                  <option key={template._id} value={template._id}>
                    Template {template._id.slice(-6)} - Header: {template.headerImage.split('\\').pop()?.split('-').pop() || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview of Selected */}
            {selectedTemplateId && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">Header Preview</p>
                    <div className="relative bg-white p-2 rounded-lg shadow-md border">
                      <img
                        src={getImageUrl(existingTemplates.find(t => t._id === selectedTemplateId)?.headerImage || '')}
                        alt="Header Preview"
                        className="w-full h-24 object-contain rounded border"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-header.png'; }}  // Optional fallback
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 mb-2">Footer Preview</p>
                    <div className="relative bg-white p-2 rounded-lg shadow-md border">
                      <img
                        src={getImageUrl(existingTemplates.find(t => t._id === selectedTemplateId)?.footerImage || '')}
                        alt="Footer Preview"
                        className="w-full h-24 object-contain rounded border"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder-footer.png'; }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleUseExisting}
                disabled={!selectedTemplateId || useExistingTemplate}
                className={`px-6 py-2 rounded-md font-medium transition ${!selectedTemplateId || useExistingTemplate
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {useExistingTemplate ? 'Using Selected' : 'Use Selected Template'}
              </button>
              {useExistingTemplate && (
                <button
                  onClick={handleUseCustom}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md font-medium hover:bg-gray-600 transition"
                >
                  Switch to Custom
                </button>
              )}
            </div>

            {useExistingTemplate && selectedTemplateId && (
              <p className="mt-3 text-sm text-green-600 text-center italic">
                ✓ Template {selectedTemplateId.slice(-6)} selected for PDF
              </p>
            )}
          </div>
        )}
        <div className="flex flex-row items-center gap-6 mb-6">
          {/* Header Image Upload */}
          <div className="flex items-center gap-3 border rounded-lg p-3 w-full md:w-1/2 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 w-28">Header Image:</label>
            <div className="flex items-center gap-3 flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleHeaderImageChange}
                className="hidden"
                id="headerUpload"
              />
              {!note.headerImage ? (
                <label
                  htmlFor="headerUpload"
                  className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Upload
                </label>
              ) : (
                <div className="flex items-center gap-3">
                  <img
                    src={note.headerImage}
                    alt="Header Preview"
                    className="w-20 h-20 object-cover rounded shadow"
                  />
                   <button
                     onClick={() =>
                       setNote((prev) => ({ ...prev, headerImage: '' }))
                     }
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer Image Upload */}
          <div className="flex items-center gap-3 border rounded-lg p-3 w-full md:w-1/2 bg-gray-50">
            <label className="block text-sm font-medium text-gray-700 w-28">Footer Image:</label>
            <div className="flex items-center gap-3 flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleFooterImageChange}
                className="hidden"
                id="footerUpload"
              />
              {!note.footerImage ? (
                <label
                  htmlFor="footerUpload"
                  className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Upload
                </label>
              ) : (
                <div className="flex items-center gap-3">
                  <img
                    src={note.footerImage}
                    alt="Footer Preview"
                    className="w-20 h-20 object-cover rounded shadow"
                  />
                   <button
                     onClick={() =>
                       setNote((prev) => ({ ...prev, footerImage: '' }))
                     }
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* {!isEditMode && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Information for AI Generation
            </label>
            <textarea
              value={promptData}
              onChange={e => setPromptData(e.target.value)}
              placeholder="Add any additional information you'd like to include in the AI-generated note..."
              className="w-full p-2 border rounded-md h-24"
            />
            <p className="text-sm text-gray-500 mt-1">
              This information will be used when generating a note with AI. It will not be saved unless you generate a
              note.
            </p>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default NoteForm;