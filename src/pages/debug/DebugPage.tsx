import React from 'react';
import DebugMultipleChoice from '../../components/debug/DebugMultipleChoice';
import SimpleDebug from '../../components/debug/SimpleDebug';

const DebugPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Page</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Simple Debug Component</h2>
        <SimpleDebug />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Multiple Choice Debug Component</h2>
        <DebugMultipleChoice />
      </div>
    </div>
  );
};

export default DebugPage;