import React from 'react';

interface WizardFormStepProps {
  title: string;
  spanishTitle?: string;
  isActive: boolean;
  children: React.ReactNode;
}

const WizardFormStep: React.FC<WizardFormStepProps> = ({
  title,
  spanishTitle,
  isActive,
  children
}) => {
  if (!isActive) return null;

  return (
    <div className="animate-fadeIn transition-all duration-300 ease-in-out">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        {spanishTitle && (
          <p className="text-sm text-gray-500 italic mt-1">{spanishTitle}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
};

export default WizardFormStep;