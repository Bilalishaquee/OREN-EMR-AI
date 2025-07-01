import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormBuilder from '../../components/forms/FormBuilder/FormBuilder';
import axios from 'axios';
import { toast } from 'react-toastify';

const FormTemplateBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isNewPatientForm, setIsNewPatientForm] = useState(false);
  
  useEffect(() => {
    // Check if we're creating a new form and if it should be a new patient form
    const searchParams = new URLSearchParams(window.location.search);
    const isNewPatient = searchParams.get('newPatient') === 'true';
    
    if (isNewPatient && !id) {
      setIsNewPatientForm(true);
      createNewPatientForm();
    }
  }, [id]);
  
  const createNewPatientForm = async () => {
    setIsLoading(true);
    try {
      // Create a new form template with all the questions from the text file
      const response = await axios.post('/api/form-templates', {
        title: 'New Patient Intake Form',
        description: 'Standard intake form for new patients',
        isActive: true,
        isPublic: true,
        language: 'english',
        items: [
          {
            type: 'blank',
            questionText: 'Language Preference',
            isRequired: true,
            options: ['I am able to complete this form in English', 'Mejor puedo responder este formulario en español', 'I am unable to complete this form in English or Spanish however I have a reliable translator to help me complete this form in my preferred language']
          },
          {
            type: 'blank',
            questionText: 'Who referred you? Which hospital, clinic, urgent care and/or medical provider?',
            isRequired: true,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Who referred you? Which hospital, clinic, urgent care and/or medical provider? ¿Es usted un paciente nuevo o ya establecido en Hand, Nerve & Microsurgery PC?',
            isRequired: true,
            multipleLines: false
          },
          {
            type: 'demographics',
            questionText: 'Please enter your information.',
            isRequired: true,
            instructions: 'Please enter your personal information.',
            demographicFields: [
              { fieldName: 'First Name', fieldType: 'text', required: true },
              { fieldName: 'Middle Initials', fieldType: 'text', required: false },
              { fieldName: 'Last Name', fieldType: 'text', required: true },
              { fieldName: 'Date of Birth', fieldType: 'date', required: true },
              { fieldName: 'Gender', fieldType: 'dropdown', required: true, options: ['Female', 'Male', 'Non-Binary'] },
              { fieldName: 'Sex', fieldType: 'dropdown', required: true, options: ['Female', 'Male', 'Intersex'] },
              { fieldName: 'Marital Status', fieldType: 'dropdown', required: false, options: ['Single', 'Married', 'Domestic Partner', 'Separated', 'Divorced', 'Widowed'] },
              { fieldName: 'Street Address', fieldType: 'text', required: true },
              { fieldName: 'Apt/Unit #', fieldType: 'text', required: false },
              { fieldName: 'City', fieldType: 'text', required: true },
              { fieldName: 'State', fieldType: 'dropdown', required: true, options: ['AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY'] },
              { fieldName: 'Zip Code', fieldType: 'text', required: true },
              { fieldName: 'Mobile Phone', fieldType: 'text', required: true },
              { fieldName: 'Home Phone', fieldType: 'text', required: false },
              { fieldName: 'Work Phone', fieldType: 'text', required: false },
              { fieldName: 'Email', fieldType: 'text', required: true },
              { fieldName: 'Preferred contact method', fieldType: 'dropdown', required: true, options: ['Mobile Phone', 'Home Phone', 'Work Phone', 'Email'] }
            ]
          },
          {
            type: 'demographics',
            questionText: 'Please enter your information. Por favor, introduzca su información.',
            isRequired: true,
            instructions: 'Please enter your personal information. / Por favor, introduzca su información personal.',
            demographicFields: [
              { fieldName: 'First Name / Nombre', fieldType: 'text', required: true },
              { fieldName: 'Middle Initials / Iniciales del segundo nombre', fieldType: 'text', required: false },
              { fieldName: 'Last Name / Apellido', fieldType: 'text', required: true },
              { fieldName: 'Date of Birth / Fecha de nacimiento', fieldType: 'date', required: true },
              { fieldName: 'Gender / Género', fieldType: 'dropdown', required: true, options: ['Female / Femenino', 'Male / Masculino', 'Non-Binary / No binario'] },
              { fieldName: 'Sex / Sexo', fieldType: 'dropdown', required: true, options: ['Female / Femenino', 'Male / Masculino', 'Intersex / Intersexual'] },
              { fieldName: 'Marital Status / Estado civil', fieldType: 'dropdown', required: false, options: ['Single / Soltero', 'Married / Casado', 'Domestic Partner / Pareja de hecho', 'Separated / Separado', 'Divorced / Divorciado', 'Widowed / Viudo'] },
              { fieldName: 'Street Address / Dirección', fieldType: 'text', required: true },
              { fieldName: 'Apt/Unit # / Apto/Unidad #', fieldType: 'text', required: false },
              { fieldName: 'City / Ciudad', fieldType: 'text', required: true },
              { fieldName: 'State / Estado', fieldType: 'dropdown', required: true, options: ['AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY'] },
              { fieldName: 'Zip Code / Código postal', fieldType: 'text', required: true },
              { fieldName: 'Mobile Phone / Teléfono móvil', fieldType: 'text', required: true },
              { fieldName: 'Home Phone / Teléfono de casa', fieldType: 'text', required: false },
              { fieldName: 'Work Phone / Teléfono del trabajo', fieldType: 'text', required: false },
              { fieldName: 'Email / Correo electrónico', fieldType: 'text', required: true },
              { fieldName: 'Preferred contact method / Método de contacto preferido', fieldType: 'dropdown', required: true, options: ['Mobile Phone / Teléfono móvil', 'Home Phone / Teléfono de casa', 'Work Phone / Teléfono del trabajo', 'Email / Correo electrónico'] }
            ]
          },
          {
            type: 'blank',
            questionText: 'Do you have medical insurance?',
            isRequired: true,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Do you have medical insurance? ¿Tiene seguro médico?',
            isRequired: true,
            multipleLines: false
          },
          {
            type: 'primaryInsurance',
            questionText: 'Primary Insurance',
            isRequired: true,
            instructions: 'Please provide your primary insurance details.',
            insuranceFields: [
              { fieldName: 'Primary Insurance Company', fieldType: 'text', required: true },
              { fieldName: 'Member ID / Policy #', fieldType: 'text', required: true },
              { fieldName: 'Group Number', fieldType: 'text', required: false },
              { fieldName: 'Client Relationship to Insured', fieldType: 'dropdown', required: true, options: ['Self', 'Spouse', 'Child', 'Other'] },
              { fieldName: 'Insured Name', fieldType: 'text', required: false },
              { fieldName: 'Insured Phone #', fieldType: 'text', required: false },
              { fieldName: 'Insured Date of Birth', fieldType: 'date', required: false },
              { fieldName: 'Insured Sex', fieldType: 'dropdown', required: false, options: ['Female', 'Male'] },
              { fieldName: 'Insured Street Address', fieldType: 'text', required: false },
              { fieldName: 'Insured City', fieldType: 'text', required: false },
              { fieldName: 'Insured State', fieldType: 'dropdown', required: false, options: ['AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY'] },
              { fieldName: 'Zip Code', fieldType: 'text', required: false }
            ]
          },
          {
            type: 'primaryInsurance',
            questionText: 'Primary Insurance Seguro Primario',
            isRequired: true,
            instructions: 'Please provide your primary insurance details. / Por favor, proporcione los detalles de su seguro primario.',
            insuranceFields: [
              { fieldName: 'Primary Insurance Company / Compañía de seguro primario', fieldType: 'text', required: true },
              { fieldName: 'Member ID / Policy # / Número de miembro / Póliza #', fieldType: 'text', required: true },
              { fieldName: 'Group Number / Número de grupo', fieldType: 'text', required: false },
              { fieldName: 'Client Relationship to Insured / Relación del cliente con el asegurado', fieldType: 'dropdown', required: true, options: ['Self / Uno mismo', 'Spouse / Cónyuge', 'Child / Hijo', 'Other / Otro'] },
              { fieldName: 'Insured Name / Nombre del asegurado', fieldType: 'text', required: false },
              { fieldName: 'Insured Phone # / Teléfono del asegurado #', fieldType: 'text', required: false },
              { fieldName: 'Insured Date of Birth / Fecha de nacimiento del asegurado', fieldType: 'date', required: false },
              { fieldName: 'Insured Sex / Sexo del asegurado', fieldType: 'dropdown', required: false, options: ['Female / Femenino', 'Male / Masculino'] },
              { fieldName: 'Insured Street Address / Dirección del asegurado', fieldType: 'text', required: false },
              { fieldName: 'Insured City / Ciudad del asegurado', fieldType: 'text', required: false },
              { fieldName: 'Insured State / Estado del asegurado', fieldType: 'dropdown', required: false, options: ['AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DC', 'DE', 'FL', 'GA', 'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY'] },
              { fieldName: 'Zip Code / Código postal', fieldType: 'text', required: false }
            ]
          },
          {
            type: 'blank',
            questionText: 'Please capture a high-resolution image of the front side of your government issued identification card by positioning it on a level surface. Ensure the card occupies the majority of the camera\'s viewfinder to enhance readability.',
            isRequired: true,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Please capture a high-resolution image of the front side of your government issued identification card by positioning it on a level surface. Ensure the card occupies the majority of the camera\'s viewfinder to enhance readability. Por favor, tome una imagen en alta resolución de la parte frontal de su tarjeta de identificación emitida por el gobierno, colocándola en una superficie nivelada. Asegúrese de que la tarjeta ocupe la mayor parte del visor de la cámara para mejorar la legibilidad.',
            isRequired: true,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Please capture a high-resolution image of the front side and backside of your health insurance card by positioning it on a level surface. Ensure the card occupies the majority of the camera\'s viewfinder to enhance readability.',
            isRequired: true,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Please capture a high-resolution image of the front side and backside of your health insurance card by positioning it on a level surface. Ensure the card occupies the majority of the camera\'s viewfinder to enhance readability. Por favor, tome una imagen en alta resolución de ambos lados (frontal y posterior) de su tarjeta de seguro de salud, colocándola en una superficie nivelada. Asegúrese de que la tarjeta ocupe la mayor parte del visor de la cámara para mejorar la legibilidad.',
            isRequired: true,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Please capture a high-resolution image of your auto insurance card by positioning it on a level surface. Ensure the card occupies the majority of the camera\'s viewfinder to enhance readability. Por favor, tome una imagen en alta resolución de su tarjeta de seguro de automóvil, colocándola en una superficie nivelada. Asegúrese de que la tarjeta ocupe la mayor parte del visor de la cámara para mejorar la legibilidad.',
            isRequired: true,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Hand Dominance, Occupation, Hobbies',
            isRequired: false,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Hand Dominance, Occupation, Hobbies Dominancia Manual, Ocupación, Aficiones',
            isRequired: false,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Is this visit for an established problem or a new problem?',
            isRequired: true,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Is this visit for an established problem or a new problem? ¿Esta visita es por un problema establecido o un problema nuevo?',
            isRequired: true,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Visit Related Details',
            isRequired: false,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Visit Related Details Detalles Relacionados con la Visita',
            isRequired: false,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Previous Care',
            isRequired: false,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Previous Care Cuidados Previos',
            isRequired: false,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Please provide as much detail as possible about the incident surrounding the injury so that I can write as detailed a note as possible to help your case. Try to Include how it happened, where it happened, care received initially and ongoing, any relevant dates.',
            isRequired: true,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Please provide as much detail as possible about the incident surrounding the injury so that I can write as detailed a note as possible to help your case. Try to Include how it happened, where it happened, care received initially and ongoing, any relevant dates. Por favor, proporcione tanto detalle como sea posible sobre el incidente que rodea la lesión para que pueda escribir una nota lo más detallada posible para ayudar en su caso. Intente incluir cómo sucedió, dónde sucedió, atención recibida inicialmente y continuada, cualquier fecha relevante.',
            isRequired: true,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'How does it impact your quality of life?',
            isRequired: true,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'How does it impact your quality of life? ¿Cómo afecta esto a su calidad de vida?',
            isRequired: true,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Have you had any serious conditions, illnesses, injuries, and/or hospitalizations in the past? If \'yes\', please list approximate dates. If you have none write "not applicable".',
            isRequired: true,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Have you had any serious conditions, illnesses, injuries, and/or hospitalizations in the past? If \'yes\', please list approximate dates. If you have none write "not applicable". ¿Ha tenido alguna condición seria, enfermedad, lesión y/o hospitalización en el pasado? Si es \'sí\', por favor liste las fechas aproximadas. Si no tiene ninguno, escriba "no aplica".',
            isRequired: true,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Do you have any allergies (medicines, cosmetics, environmental, foods)? If \'yes\', please describe. If you have none write "no".',
            isRequired: true,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Do you have any allergies (medicines, cosmetics, environmental, foods)? If \'yes\', please describe. ¿Tiene alguna alergia (medicamentos, cosméticos, ambientales, alimentos)? Si es \'sí\', por favor describa. Si no tiene ninguno, escriba "no".',
            isRequired: true,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Cardiovascular Please check the boxes for any condition(s) you have experienced or are experiencing:',
            isRequired: false,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Cardiovascular Please check the boxes for any condition(s) you have experienced or are experiencing: Cardiovascular Por favor, marque las casillas de cualquier condición que haya experimentado o esté experimentando:',
            isRequired: false,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Respiratory Please check the boxes for any condition(s) you have experienced or are experiencing:',
            isRequired: false,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Respiratory / Respiratorio Please check the boxes for any condition(s) you have experienced or are experiencing: Por favor, marque las casillas de cualquier condición que haya experimentado o esté experimentando:',
            isRequired: false,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Communicable Diseases Please check the boxes for any condition(s) you have experienced or are experiencing:',
            isRequired: false,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Communicable Diseases / Enfermedades transmisibles Please check the boxes for any condition(s) you have experienced or are experiencing: Por favor, marque las casillas de cualquier condición que haya experimentado o esté experimentando:',
            isRequired: false,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Diabetes',
            isRequired: false,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Diabetes',
            isRequired: false,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Please list any previous surgical procedures and any details/hardware (i.e. prosthesis, wires, internal pins/fixators). If no then press no.',
            isRequired: true,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Please list any previous surgical procedures and any details/hardware (i.e. prosthesis, wires, internal pins/fixators). Por favor, liste cualquier procedimiento quirúrgico previo y cualquier detalle/hardware (por ejemplo, prótesis, alambres, clavos/pinzas internos). Si no tiene, escriba "no".',
            isRequired: true,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Habits and Lifestyle',
            isRequired: false,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Habits and Lifestyle Hábitos y Estilo de Vida',
            isRequired: false,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Please list all current medications (prescription, over-the-counter, vitamins, herbs, homeopathics) and specify the date your started using it and dosage.',
            isRequired: true,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Please list all current medications (prescription, over-the-counter, vitamins, herbs, homeopathics) and specify the date your started using it and dosage. Por favor, liste todos los medicamentos actuales (prescripción, sin receta, vitaminas, hierbas, homeopáticos) y especifique la fecha en que comenzó a usarlo y la dosis.',
            isRequired: true,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Supplements:',
            isRequired: false,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Supplements: Suplementos:',
            isRequired: false,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Please upload any relevant medical reports or documentation that will aid in the assessment and management of your condition. This may include, but is not limited to, imaging studies such as X-rays, MRI, or CT scans; nerve conduction studies; and clear, high-resolution photographs of your injury. Additionally, please feel free to include any other information or documentation that you believe may be pertinent to your case. Providing comprehensive and detailed information will enable us to gain a better understanding of your condition and facilitate the delivery of the highest quality care tailored to your needs.',
            isRequired: false,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'Please upload any relevant medical reports or documentation that will aid in the assessment and management of your condition. This may include, but is not limited to, imaging studies such as X-rays, MRI, or CT scans; nerve conduction studies; and clear, high-resolution photographs of your injury. Additionally, please feel free to include any other information or documentation that you believe may be pertinent to your case. Providing comprehensive and detailed information will enable us to gain a better understanding of your condition and facilitate the delivery of the highest quality care tailored to your needs. Por favor, suba cualquier informe médico relevante o documentación que ayudará en la evaluación y manejo de su condición. Esto puede incluir, pero no se limita a, estudios de imagen como rayos X, MRI o tomografías computarizadas; estudios de conducción nerviosa; y fotografías claras y en alta resolución de su lesión. Adicionalmente, no dude en incluir cualquier otra información o documentación que crea que pueda ser pertinente a su caso. Proporcionar información completa y detallada nos permitirá obtener una mejor comprensión de su condición y facilitar la entrega de la atención de la más alta calidad adaptada a sus necesidades.',
            isRequired: false,
            multipleLines: true
          },
          {
            type: 'blank',
            questionText: 'HIPAA Waiver and Communication Release Form (section)',
            isRequired: false,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Communication Preferences in reference to the previous section on HIPAA Please indicate how you would like to receive communications from our office regarding your medical care, appointments, test results, or billing information. You may select one or more options:',
            isRequired: true,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Exención de HIPAA y Formulario de Consentimiento de Comunicación (section)',
            isRequired: false,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Preferencias de Comunicación en referencia a la sección anterior sobre HIPAA Indique cómo prefiere recibir comunicaciones de nuestra oficina con respecto a su atención médica, citas, resultados de exámenes o información de facturación. Puede seleccionar una o más opciones:',
            isRequired: true,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'INSURANCE AND SELF PAY (section)',
            isRequired: false,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'INSURANCE AND SELF PAY / SEGURO Y PAGO POR CUENTA PROPIA (section)',
            isRequired: false,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Flexible Healthcare Financing (section)',
            isRequired: false,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Flexible Healthcare Financing Spanish (section)',
            isRequired: false,
            multipleLines: false
          },
          {
            type: 'blank',
            questionText: 'Signature',
            isRequired: true,
            multipleLines: false
          }
        ]
      });
      
      // Navigate to the edit page for the newly created form
      navigate(`/forms/templates/${response.data.template._id}/edit`);
    } catch (error) {
      console.error('Error creating new patient form:', error);
      toast.error('Failed to create new patient form template');
      navigate('/forms/templates/new');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return <FormBuilder />;
};

export default FormTemplateBuilder;