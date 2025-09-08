import React from 'react';
import { Link } from 'react-router-dom';
import TaskDetail from '../../components/tasks/TaskDetail';
import { FaArrowLeft } from 'react-icons/fa';

const TaskDetailPage: React.FC = () => {
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
      
      <TaskDetail />
    </div>
  );
};

export default TaskDetailPage;