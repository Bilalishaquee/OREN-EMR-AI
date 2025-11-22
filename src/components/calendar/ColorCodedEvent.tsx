import React from 'react';
import { Link } from 'react-router-dom';
import { CiSquareCheck } from "react-icons/ci";

interface ColorCodedEventProps {
  appointment: {
    _id: string;
    patient: {
      _id: string;
      firstName: string;
      lastName: string;
      colorCode?: string;
    };
    date: string;
    time: {
      start: string;
      end: string;
    };
    type: string;
    status: string;
  };
  isSelected?: boolean;
}

const ColorCodedEvent: React.FC<ColorCodedEventProps> = ({ appointment, isSelected }) => {
  // Default color if patient doesn't have a color code
  const defaultColor = '#ffffff';
  
  // Get the patient's color code or use default
  const colorCode = appointment.patient?.colorCode || defaultColor;
  
  // Determine text color based on background color brightness
  const getBrightness = (hexColor: string): number => {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Convert hex to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate brightness (perceived luminance)
    return (r * 299 + g * 587 + b * 114) / 1000;
  };
  
  const brightness = getBrightness(colorCode);
  const textColor = brightness > 128 ? '#000000' : '#ffffff';
  
  // Format time for display
  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  return (
    <Link 
      to={`/appointments/${appointment._id}`}
      className={`block rounded-md p-2 mb-1 transition-all ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        backgroundColor: colorCode,
        color: textColor,
        borderLeft: `4px solid ${colorCode}`,
      }}
    >
      <div className="font-medium">
        {appointment.patient?.firstName} {appointment.patient?.lastName}
      </div>
      <div className="text-xs">
        {formatTime(appointment.time.start)} - {formatTime(appointment.time.end)}
      </div>
      <div className="text-xs capitalize">
        {appointment.type}
      </div>
     <div
  className={`
    rounded-md w-fit px-2 py-1 text-xs flex items-center my-2
    ${
      appointment?.paymentStatus === "Paid"
        ? "border-2 border-green-600 text-green-600 bg-green-300"
        : appointment?.paymentStatus === "Billed"
        ? "border-2 border-blue-600 text-blue-600 bg-blue-300"
        : appointment?.paymentStatus === "Pending"
        ? "border-2 border-yellow-600 text-yellow-600 bg-yellow-300"
        : "border-2 border-gray-600 text-gray-600 bg-gray-300"
    }
  `}
>
  {appointment?.paymentStatus || "No status"}
</div>

    </Link>
  );
};

export default ColorCodedEvent;