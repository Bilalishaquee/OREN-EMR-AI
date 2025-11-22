import React, { ReactNode } from 'react';

interface WizardFormStepProps {
  title: string;
  children: ReactNode;
  isActive: boolean;
  spanishTitle?: string;
  language?: 'english' | 'spanish';
}

const WizardFormStep: React.FC<WizardFormStepProps> = ({ 
  title, 
  children, 
  isActive,
  spanishTitle,
  language = 'english'
}) => {
  if (!isActive) return null;
  
  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {language === 'spanish' ? (spanishTitle || title) : title}
        </h2>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

export default WizardFormStep;