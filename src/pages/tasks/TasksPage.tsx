import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TaskList from '../../components/tasks/TaskList';
import MyTasks from '../../components/tasks/MyTasks';
import { FaPlus } from 'react-icons/fa';

const TasksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'my-tasks'>('my-tasks');
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Task Management</h1>
        <Link
          to="/tasks/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
        >
          <FaPlus className="mr-2" /> New Task
        </Link>
      </div>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'my-tasks' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              All Tasks
            </button>
          </nav>
        </div>
      </div>
      
      {activeTab === 'my-tasks' ? <MyTasks /> : <TaskList />}
    </div>
  );
};

export default TasksPage;