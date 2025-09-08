import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

interface Task {
  _id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: Date;
  assignedTo: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  assignedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
  relatedVisit?: string;
  relatedNote?: string;
  notificationSent: boolean;
  notificationRead: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskContextType {
  tasks: Task[];
  myTasks: Task[];
  loading: boolean;
  error: string | null;
  fetchTasks: (filters?: any) => Promise<void>;
  fetchMyTasks: (status?: string) => Promise<void>;
  getTaskById: (id: string) => Promise<Task | null>;
  createTask: (taskData: Partial<Task>) => Promise<Task | null>;
  updateTask: (id: string, taskData: Partial<Task>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  markTaskComplete: (id: string) => Promise<Task | null>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

interface TaskProviderProps {
  children: ReactNode;
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  const fetchTasks = useCallback(async (filters = {}) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value as string);
      });
      
      const response = await axios.get(
        `http://localhost:5000/api/tasks?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setTasks(response.data);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.message || 'Failed to fetch tasks');
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchMyTasks = useCallback(async (status?: string) => {
    if (!token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = status ? `?status=${status}` : '';
      const response = await axios.get(
        `http://localhost:5000/api/tasks/my-tasks${queryParams}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMyTasks(response.data);
    } catch (err: any) {
      console.error('Error fetching my tasks:', err);
      setError(err.response?.data?.message || 'Failed to fetch your tasks');
      toast.error('Failed to fetch your tasks');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const getTaskById = useCallback(async (id: string): Promise<Task | null> => {
    if (!token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `http://localhost:5000/api/tasks/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      return response.data;
    } catch (err: any) {
      console.error('Error fetching task:', err);
      setError(err.response?.data?.message || 'Failed to fetch task');
      toast.error('Failed to fetch task details');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createTask = useCallback(async (taskData: Partial<Task>): Promise<Task | null> => {
    if (!token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(
        'http://localhost:5000/api/tasks',
        taskData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update tasks list with the new task
      setTasks(prevTasks => [response.data, ...prevTasks]);
      
      // If the current user is assigned to this task, update myTasks too
      if (response.data.assignedTo._id === user?.id) {
        setMyTasks(prevTasks => [response.data, ...prevTasks]);
      }
      
      toast.success('Task created successfully');
      return response.data;
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.message || 'Failed to create task');
      toast.error('Failed to create task');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const updateTask = useCallback(async (id: string, taskData: Partial<Task>): Promise<Task | null> => {
    if (!token) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(
        `http://localhost:5000/api/tasks/${id}`,
        taskData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Update tasks list with the updated task
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === id ? response.data : task
        )
      );
      
      // Update myTasks if it exists there
      setMyTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === id ? response.data : task
        )
      );
      
      toast.success('Task updated successfully');
      return response.data;
    } catch (err: any) {
      console.error('Error updating task:', err);
      setError(err.response?.data?.message || 'Failed to update task');
      toast.error('Failed to update task');
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const markTaskComplete = useCallback(async (id: string): Promise<Task | null> => {
    return updateTask(id, { status: 'completed' });
  }, [updateTask]);

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    if (!token) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      await axios.delete(
        `http://localhost:5000/api/tasks/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Remove task from lists
      setTasks(prevTasks => prevTasks.filter(task => task._id !== id));
      setMyTasks(prevTasks => prevTasks.filter(task => task._id !== id));
      
      toast.success('Task deleted successfully');
      return true;
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.response?.data?.message || 'Failed to delete task');
      toast.error('Failed to delete task');
      return false;
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load tasks when the component mounts and token is available
  useEffect(() => {
    if (token) {
      fetchMyTasks();
    }
  }, [token]);

  const value = {
    tasks,
    myTasks,
    loading,
    error,
    fetchTasks,
    fetchMyTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    markTaskComplete
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};