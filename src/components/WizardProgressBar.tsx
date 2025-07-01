import React from 'react';

interface WizardProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepTitles?: string[];
  onStepClick?: (step: number) => void;
  language?: 'english' | 'spanish';

const WizardProgressBar: React.FC<WizardProgressBarProps> = ({
  currentStep,
  totalSteps,
  stepTitles = [],
  onStepClick
}) => {
  const percentage = Math.round((currentStep / (totalSteps - 1)) * 100);

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-blue-600">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <span className="text-sm font-medium text-gray-500">
          {percentage}% Complete
        </span>
      </div>

      <div className="relative">
        {/* Progress bar background */}
        <div className="h-2 bg-gray-200 rounded-full">
          {/* Progress bar fill */}
          <div 
            className="h-2 bg-blue-600 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        {/* Step indicators */}
        <div className="flex justify-between absolute top-0 w-full transform -translate-y-1/2">
          {Array.from({ length: totalSteps }).map((_, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            
            return (
              <button
                key={index}
                onClick={() => onStepClick && onStepClick(index)}
                disabled={!onStepClick}
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 ${onStepClick ? 'cursor-pointer' : ''} ${
                  isCompleted
                    ? 'bg-blue-600 text-white'
                    : isCurrent
                    ? 'bg-white border-2 border-blue-600 text-blue-600'
                    : 'bg-white border border-gray-300 text-gray-400'
                }`}
                aria-label={`Go to step ${index + 1}${stepTitles[index] ? `: ${stepTitles[index]}` : ''}`}
                title={stepTitles[index] || `Step ${index + 1}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WizardProgressBar;