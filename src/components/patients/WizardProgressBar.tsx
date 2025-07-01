import React from 'react';

interface WizardProgressBarProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  language?: 'english' | 'spanish';
}

const WizardProgressBar: React.FC<WizardProgressBarProps> = ({ 
  steps, 
  currentStep,
  onStepClick,
  language = 'english'
}) => {
  const progressPercentage = ((currentStep) / (steps.length - 1)) * 100;
  
  return (
    <div className="mb-8">
      {/* Progress percentage */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-blue-600">
          {language === 'spanish' ? 'Paso' : 'Step'} {currentStep + 1} {language === 'spanish' ? 'de' : 'of'} {steps.length}
        </span>
        <span className="text-sm font-medium text-gray-500">
          {Math.round(progressPercentage)}% {language === 'spanish' ? 'Completado' : 'Complete'}
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="relative pt-1">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
          <div 
            style={{ width: `${progressPercentage}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-300 ease-in-out"
          ></div>
        </div>
      </div>
      
      {/* Step indicators */}
      <div className="hidden md:flex justify-between">
        {steps.map((step, index) => {
          // Determine if this step is active, completed, or upcoming
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const isClickable = onStepClick && (isCompleted || index === currentStep);
          
          return (
            <div 
              key={index} 
              className={`flex flex-col items-center ${isClickable ? 'cursor-pointer' : ''}`}
              onClick={() => isClickable && onStepClick(index)}
            >
              <div 
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full 
                  ${isActive ? 'bg-blue-600 text-white' : ''}
                  ${isCompleted ? 'bg-green-500 text-white' : ''}
                  ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                  transition-all duration-200
                `}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              <span 
                className={`mt-2 text-xs ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'} max-w-[80px] text-center truncate`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WizardProgressBar;