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
      // Create a new form template with default new patient form structure
      const response = await axios.post('/api/form-templates', {
        title: 'New Patient Intake Form',
        description: 'Standard intake form for new patients',
        isActive: true,
        isPublic: true,
        language: 'english',
        items: [
          {
            type: 'demographics',
            questionText: 'Patient Information',
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
            type: 'primaryInsurance',
            questionText: 'Primary Insurance Information',
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
            type: 'secondaryInsurance',
            questionText: 'Secondary Insurance Information (if applicable)',
            isRequired: false,
            instructions: 'Please provide your secondary insurance details if you have any.',
            insuranceFields: [
              { fieldName: 'Secondary Insurance Company', fieldType: 'text', required: false },
              { fieldName: 'Member ID / Policy #', fieldType: 'text', required: false },
              { fieldName: 'Group Number', fieldType: 'text', required: false },
              { fieldName: 'Client Relationship to Insured', fieldType: 'dropdown', required: false, options: ['Self', 'Spouse', 'Child', 'Other'] },
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
            type: 'allergies',
            questionText: 'Please enter the details of any allergies',
            isRequired: false,
            matrix: {
              rowHeader: 'Allergies',
              columnHeaders: ['Allergic To', 'Allergy Type', 'Reaction', 'Severity', 'Date of Onset', 'End Date'],
              columnTypes: ['text', 'dropdown', 'dropdown', 'dropdown', 'text', 'text'],
              rows: ['1', '2', '3'],
              dropdownOptions: [
                [], // No options for 'Allergic To' (text field)
                ['Food', 'Medication', 'Environmental', 'Other'], // Options for 'Allergy Type'
                ['Rash', 'Hives', 'Swelling', 'Anaphylaxis', 'GI Issues', 'Respiratory', 'Other'], // Options for 'Reaction'
                ['Mild', 'Moderate', 'Severe', 'Life-threatening'], // Options for 'Severity'
                [], // No options for 'Date of Onset' (text field)
                []  // No options for 'End Date' (text field)
              ],
              displayTextBox: true
            }
          },
          {
            type: 'blank',
            questionText: 'Do you have any additional medical conditions we should be aware of?',
            isRequired: false,
            placeholder: 'Please describe any other medical conditions',
            multipleLines: true
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