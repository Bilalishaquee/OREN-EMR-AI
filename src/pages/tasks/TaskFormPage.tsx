import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

// Use lazy loading for the TaskForm component
const TaskForm = lazy(() => import('../../components/tasks/TaskForm'));

// Skeleton loader component
const TaskFormSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
    
    <div className="space-y-6">
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
      
      {/* Description skeleton */}
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-24 bg-gray-200 rounded w-full"></div>
      </div>
      
      {/* Form fields skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
      
      {/* Buttons skeleton */}
      <div className="flex justify-end space-x-4 mt-8">
        <div className="h-10 bg-gray-200 rounded w-24"></div>
        <div className="h-10 bg-blue-200 rounded w-24"></div>
      </div>
    </div>
  </div>
);

const TaskFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const [isReady, setIsReady] = useState(false);
  
  // Simulate immediate readiness to show skeleton
  useEffect(() => {
    setIsReady(true);
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          to="/tasks"
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" /> Back to Tasks
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Edit Task' : 'Create New Task'}
        </h1>
      </div>
      
      {isReady && (
        <Suspense fallback={<TaskFormSkeleton />}>
          <TaskForm />
        </Suspense>
      )}
    </div>
  );
};

export default TaskFormPage;