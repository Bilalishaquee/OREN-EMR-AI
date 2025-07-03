import React, { useState } from 'react';

const SimpleDebug: React.FC = () => {
  const [inputValue, setInputValue] = useState('Test input');

  return (
    <div className="p-8 bg-white shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-4">Simple Debug Component</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Test Input Field
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full"
          placeholder="Type something..."
        />
      </div>
      <div className="mt-2">
        <p>Current value: {inputValue}</p>
      </div>
    </div>
  );
};

export default SimpleDebug;