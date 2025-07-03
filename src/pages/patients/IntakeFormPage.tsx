import React from 'react';
import DynamicIntakeForm from '../../components/patients/DynamicIntakeForm';

const IntakeFormPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <DynamicIntakeForm />
    </div>
  );
};

export default IntakeFormPage;