import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TaskList from '../../components/tasks/TaskList';
import MyTasks from '../../components/tasks/MyTasks';
import { CheckSquare, Plus } from 'lucide-react';

const TasksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'my-tasks'>('my-tasks');
  
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
              <CheckSquare className="w-8 h-8 mr-3 text-blue-600" />
              Task Management
            </h1>
            <p className="text-sm text-gray-500">Organize and track your tasks efficiently</p>
          </div>
          <Link
            to="/tasks/new"
            className="flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Task
          </Link>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'my-tasks' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Tasks
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'all' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
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