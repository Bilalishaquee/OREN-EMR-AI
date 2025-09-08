import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTask } from '../../contexts/TaskContext';
import { FaEdit, FaTrash, FaCheck, FaExclamationCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTaskById, markTaskComplete, deleteTask, loading } = useTask();
  const [task, setTask] = useState<any>(null);
  
  useEffect(() => {
    const fetchTask = async () => {
      if (id) {
        try {
          const taskData = await getTaskById(id);
          setTask(taskData);
        } catch (error) {
          console.error('Error fetching task:', error);
          toast.error('Failed to load task details');
          navigate('/tasks');
        }
      }
    };
    
    fetchTask();
  }, [id, getTaskById, navigate]);
  
  const handleComplete = async () => {
    if (!id) return;
    
    try {
      await markTaskComplete(id);
      toast.success('Task marked as complete');
      // Refresh task data
      const updatedTask = await getTaskById(id);
      setTask(updatedTask);
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };
  
  const handleDelete = async () => {
    if (!id) return;
    
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
        toast.success('Task deleted successfully');
        navigate('/tasks');
      } catch (error) {
        console.error('Error deleting task:', error);
        toast.error('Failed to delete task');
      }
    }
  };
  
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDueDate = new Date(dueDate);
    return taskDueDate < today;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loader"></div>
      </div>
    );
  }
  
  if (!task) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Task not found.</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-semibold flex items-center">
            {task.title}
            {isOverdue(task.dueDate?.toString()) && task.status !== 'completed' && (
              <FaExclamationCircle className="ml-2 text-red-500" title="Overdue" />
            )}
          </h2>
          <div className="mt-2 flex space-x-3">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusClass(task.status)}`}>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </span>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityClass(task.priority)}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Link
            to={`/tasks/edit/${task._id}`}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
          >
            <FaEdit className="mr-1" /> Edit
          </Link>
          
          {task.status !== 'completed' && (
            <button
              onClick={handleComplete}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
            >
              <FaCheck className="mr-1" /> Complete
            </button>
          )}
          
          <button
            onClick={handleDelete}
            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
          >
            <FaTrash className="mr-1" /> Delete
          </button>
        </div>
      </div>
      
      {task.description && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Description</h3>
          <p className="text-gray-700 whitespace-pre-line">{task.description}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Task Details</h3>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-500">Created:</span>{' '}
              <span>{formatDate(task.createdAt)}</span>
            </div>
            
            {task.dueDate && (
              <div>
                <span className="font-medium text-gray-500">Due Date:</span>{' '}
                <span className={isOverdue(task.dueDate.toString()) && task.status !== 'completed' ? 'text-red-600 font-medium' : ''}>
                  {formatDate(task.dueDate)}
                </span>
              </div>
            )}
            
            {task.completedAt && (
              <div>
                <span className="font-medium text-gray-500">Completed:</span>{' '}
                <span>{formatDate(task.completedAt)}</span>
              </div>
            )}
            
            <div>
              <span className="font-medium text-gray-500">Last Updated:</span>{' '}
              <span>{formatDate(task.updatedAt)}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">People</h3>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-500">Assigned To:</span>{' '}
              <span>{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-500">Assigned By:</span>{' '}
              <span>{task.assignedBy.firstName} {task.assignedBy.lastName}</span>
            </div>
            
            <div>
              <span className="font-medium text-gray-500">Patient:</span>{' '}
              <Link to={`/patients/${task.patient._id}`} className="text-blue-600 hover:text-blue-800">
                {task.patient.firstName} {task.patient.lastName}
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {task.visit && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Related Visit</h3>
          <Link 
            to={`/visits/${task.visit._id}`} 
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="font-medium">{new Date(task.visit.date).toLocaleDateString()}</div>
            <div className="text-sm text-gray-500 mt-1">{task.visit.reason}</div>
          </Link>
        </div>
      )}
      
      {task.note && (
        <div>
          <h3 className="text-lg font-medium mb-3">Related Note</h3>
          <Link 
            to={`/notes/${task.note._id}`} 
            className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <div className="font-medium">{task.note.title}</div>
            <div className="text-sm text-gray-500 mt-1">
              {new Date(task.note.createdAt).toLocaleDateString()}
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;