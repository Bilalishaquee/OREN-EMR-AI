import React from 'react';
import { LucideIcon } from 'lucide-react';

interface QuestionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  color?: string;
  bgColor?: string;
  hoverColor?: string;
  textColor?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
}

const QuestionButton: React.FC<QuestionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  color = '#3B82F6',
  bgColor = 'bg-blue-50',
  hoverColor = 'hover:bg-blue-100',
  textColor = 'text-blue-700',
  size = 'md',
  variant = 'solid'
}) => {
  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2.5 text-base'
  };

  // Variant classes
  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return `bg-white border-2 ${textColor} hover:bg-opacity-10 ${hoverColor}`;
      case 'ghost':
        return `bg-transparent ${textColor} hover:bg-opacity-10 ${hoverColor}`;
      case 'solid':
      default:
        return `text-white shadow-sm ${bgColor.replace('bg-', 'bg-')} ${hoverColor.replace('hover:bg-', 'hover:bg-')}`;
    }
  };

  // For solid variant, create a gradient background
  const getStyle = () => {
    if (variant === 'solid') {
      // Extract color name and intensity from the bgColor
      const colorName = bgColor.replace('bg-', '').split('-')[0];
      return {
        background: `linear-gradient(to right, var(--tw-${colorName}-500), var(--tw-${colorName}-600))`,
        borderLeft: `4px solid ${color}`
      };
    } else if (variant === 'outline') {
      return {
        borderColor: color,
        borderLeft: `4px solid ${color}`
      };
    }
    return {};
  };

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center
        rounded-md
        transition-all duration-200 ease-in-out
        ${sizeClasses[size]}
        ${getVariantClasses()}
        hover:shadow-md
        transform hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50
      `}
      style={getStyle()}
    >
      <Icon className="mr-2 h-4 w-4" style={{ color: variant === 'solid' ? 'white' : color }} />
      {label}
    </button>
  );
};

export default QuestionButton;