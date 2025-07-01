import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTask } from '../../contexts/TaskContext';
import { FaCheck, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const MyTasks: React.FC = () => {
  const { myTasks, fetchMyTasks, markTaskComplete, loading } = useTask();
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  
  useEffect(() => {
    // Initial fetch of tasks assigned to current user
    fetchMyTasks(statusFilter);
  }, [statusFilter]); // Remove fetchMyTasks from dependency array to prevent infinite loop
  
  const handleComplete = async (id: string) => {
    try {
      await markTaskComplete(id);
      toast.success('Task marked as complete');
      // Refresh the task list
      fetchMyTasks(statusFilter);
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };
  
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDueDate = new Date(dueDate);
    return taskDueDate < today;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">My Tasks</h2>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="">All</option>
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="loader"></div>
        </div>
      ) : myTasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No {statusFilter || 'assigned'} tasks found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {myTasks.map((task) => (
            <div 
              key={task._id} 
              className={`border rounded-lg p-4 ${isOverdue(task.dueDate?.toString()) && task.status !== 'completed' ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    {task.title}
                    {isOverdue(task.dueDate?.toString()) && task.status !== 'completed' && (
                      <FaExclamationCircle className="ml-2 text-red-500" title="Overdue" />
                    )}
                  </h3>
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-600">{task.description}</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityClass(task.priority)}`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Patient:</span>{' '}
                  <Link to={`/patients/${task.patient._id}`} className="text-blue-600 hover:text-blue-800">
                    {task.patient.firstName} {task.patient.lastName}
                  </Link>
                </div>
                
                <div>
                  <span className="font-medium text-gray-500">Assigned by:</span>{' '}
                  <span>{task.assignedBy.firstName} {task.assignedBy.lastName}</span>
                </div>
                
                {task.dueDate && (
                  <div>
                    <span className="font-medium text-gray-500">Due:</span>{' '}
                    <span className={isOverdue(task.dueDate.toString()) && task.status !== 'completed' ? 'text-red-600 font-medium' : ''}>
                      {formatDate(task.dueDate.toString())}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-end">
                {task.status !== 'completed' ? (
                  <button
                    onClick={() => handleComplete(task._id)}
                    className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <FaCheck className="mr-1" /> Mark Complete
                  </button>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-md">
                    Completed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasks;