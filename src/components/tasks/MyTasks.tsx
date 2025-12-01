import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTask } from '../../contexts/TaskContext';
import { Check, AlertCircle, Calendar, User, UserCircle, CheckSquare } from 'lucide-react';
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
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-gray-900">My Tasks</h2>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-medium text-gray-700 shadow-sm"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="">All</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-500">Loading tasks...</p>
          </div>
        ) : myTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No {statusFilter || 'assigned'} tasks found.</p>
            <p className="text-sm text-gray-400 mt-1">Create a new task to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myTasks.map((task) => {
              const overdue = isOverdue(task.dueDate?.toString()) && task.status !== 'completed';
              return (
                <div 
                  key={task._id} 
                  className={`border rounded-xl p-5 transition-all duration-150 hover:shadow-md ${
                    overdue 
                      ? 'border-red-200 bg-gradient-to-r from-red-50 to-red-50/50' 
                      : task.status === 'completed'
                      ? 'border-green-200 bg-green-50/30'
                      : 'border-gray-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {task.title}
                        </h3>
                        {overdue && (
                          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" title="Overdue" />
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        : 'bg-green-100 text-green-800 border-green-200'
                    }`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center text-sm">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-500 mr-1">Patient:</span>
                      <Link 
                        to={`/patients/${task.patient?._id}`} 
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {task.patient?.firstName} {task.patient?.lastName}
                      </Link>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <UserCircle className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-500 mr-1">Assigned by:</span>
                      <span className="text-gray-900 font-medium">
                        {task.assignedBy.firstName} {task.assignedBy.lastName}
                      </span>
                    </div>
                    
                    {task.dueDate && (
                      <div className="flex items-center text-sm">
                        <Calendar className={`w-4 h-4 mr-2 ${overdue ? 'text-red-500' : 'text-gray-400'}`} />
                        <span className="text-gray-500 mr-1">Due:</span>
                        <span className={`font-medium ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatDate(task.dueDate.toString())}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    {task.status !== 'completed' ? (
                      <button
                        onClick={() => handleComplete(task._id)}
                        className="flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Mark Complete
                      </button>
                    ) : (
                      <span className="flex items-center px-4 py-2 bg-green-100 text-green-800 text-sm font-semibold rounded-lg border border-green-200">
                        <Check className="w-4 h-4 mr-2" />
                        Completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTasks;