import React from 'react';

interface BodyMapQuestionProps {
  item: {
    type: string;
    questionText: string;
    isRequired: boolean;
    bodyMapType?: 'full' | 'front' | 'back' | 'head' | 'hand' | 'foot';
    allowPatientMarkings?: boolean;
  };
  onChange: (updatedItem: any) => void;
}

const BodyMapQuestionEditor: React.FC<BodyMapQuestionProps> = ({ item, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      onChange({
        ...item,
        [name]: checked
      });
    } else {
      onChange({
        ...item,
        [name]: value
      });
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Body Map / Drawing</h2>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="questionText" className="block text-sm font-medium text-gray-700">
            Question
          </label>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isRequired"
              name="isRequired"
              checked={item.isRequired}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isRequired" className="ml-2 block text-sm text-gray-900">
              Is Required
            </label>
          </div>
        </div>
        <textarea
          id="questionText"
          name="questionText"
          value={item.questionText}
          onChange={handleChange}
          rows={3}
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
          placeholder="Type your question text here"
        />
      </div>
      
      <div className="mb-6">
        <label htmlFor="bodyMapType" className="block text-sm font-medium text-gray-700 mb-1">
          Body Map Type
        </label>
        <select
          id="bodyMapType"
          name="bodyMapType"
          value={item.bodyMapType || 'full'}
          onChange={handleChange}
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
        >
          <option value="full">Full Body (Front & Back)</option>
          <option value="front">Body Front</option>
          <option value="back">Body Back</option>
          <option value="head">Head</option>
          <option value="hand">Hand</option>
          <option value="foot">Foot</option>
        </select>
      </div>
      
      <div className="mb-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="allowPatientMarkings"
            name="allowPatientMarkings"
            checked={item.allowPatientMarkings !== false}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="allowPatientMarkings" className="ml-2 block text-sm text-gray-900">
            Allow patient to mark areas on the body map
          </label>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-md font-medium text-gray-900 mb-4">Preview</h3>
        <div className="border border-gray-200 rounded-md p-4">
          <p className="text-sm text-gray-900 mb-2">{item.questionText || 'Please mark areas on the body map'}</p>
          <div className="flex justify-center p-4 bg-gray-50 rounded-md">
            {renderBodyMapPreview(item.bodyMapType || 'full')}
          </div>
          {item.allowPatientMarkings !== false && (
            <div className="mt-2 flex justify-center space-x-2">
              <button className="px-2 py-1 text-xs rounded bg-red-100 text-red-800 hover:bg-red-200">Pain</button>
              <button className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800 hover:bg-blue-200">Numbness</button>
              <button className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Tingling</button>
              <button className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800 hover:bg-gray-200">Erase</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const renderBodyMapPreview = (type: string) => {
  // Simplified body map representations
  switch (type) {
    case 'full':
      return (
        <div className="flex space-x-4">
          <div className="w-32 h-64 bg-gray-200 rounded-md flex items-center justify-center">
            <span className="text-xs text-gray-500">Front View</span>
          </div>
          <div className="w-32 h-64 bg-gray-200 rounded-md flex items-center justify-center">
            <span className="text-xs text-gray-500">Back View</span>
          </div>
        </div>
      );
    case 'front':
      return (
        <div className="w-32 h-64 bg-gray-200 rounded-md flex items-center justify-center">
          <span className="text-xs text-gray-500">Front View</span>
        </div>
      );
    case 'back':
      return (
        <div className="w-32 h-64 bg-gray-200 rounded-md flex items-center justify-center">
          <span className="text-xs text-gray-500">Back View</span>
        </div>
      );
    case 'head':
      return (
        <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-xs text-gray-500">Head</span>
        </div>
      );
    case 'hand':
      return (
        <div className="w-32 h-40 bg-gray-200 rounded-md flex items-center justify-center">
          <span className="text-xs text-gray-500">Hand</span>
        </div>
      );
    case 'foot':
      return (
        <div className="w-32 h-40 bg-gray-200 rounded-md flex items-center justify-center">
          <span className="text-xs text-gray-500">Foot</span>
        </div>
      );
    default:
      return (
        <div className="w-32 h-64 bg-gray-200 rounded-md flex items-center justify-center">
          <span className="text-xs text-gray-500">Body Map</span>
        </div>
      );
  }
};

export default BodyMapQuestionEditor;