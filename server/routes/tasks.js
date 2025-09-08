import express from 'express';
import mongoose from 'mongoose';
import { authenticateToken } from '../middleware/authMiddleware.js';
import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

const router = express.Router();

// Get all tasks (with filtering options)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      assignedTo, 
      patient,
      dueDate,
      search
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    // Filter by status if provided
    if (status) filter.status = status;
    
    // Filter by priority if provided
    if (priority) filter.priority = priority;
    
    // Filter by assignedTo if provided
    if (assignedTo) filter.assignedTo = assignedTo;
    
    // Filter by patient if provided
    if (patient) filter.patient = patient;
    
    // Filter by due date if provided
    if (dueDate) {
      const date = new Date(dueDate);
      filter.dueDate = { $lte: date };
    }
    
    // Search in title or description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get tasks with populated references
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'firstName lastName username')
      .populate('assignedBy', 'firstName lastName username')
      .populate('patient', 'firstName lastName dateOfBirth')
      .sort({ createdAt: -1 });
    
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
});

// Get tasks assigned to the current user
router.get('/my-tasks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    
    const filter = { assignedTo: userId };
    if (status) filter.status = status;
    
    const tasks = await Task.find(filter)
      .populate('assignedBy', 'firstName lastName username')
      .populate('patient', 'firstName lastName dateOfBirth')
      .sort({ priority: -1, dueDate: 1 });
    
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
});

// Get a specific task by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName username')
      .populate('assignedBy', 'firstName lastName username')
      .populate('patient', 'firstName lastName dateOfBirth')
      .populate('relatedVisit')
      .populate('relatedNote');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(200).json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: 'Failed to fetch task', error: error.message });
  }
});

// Create a new task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      priority, 
      dueDate, 
      assignedTo, 
      patient,
      relatedVisit,
      relatedNote
    } = req.body;
    
    // Validate required fields
    if (!title || !assignedTo || !patient) {
      return res.status(400).json({ message: 'Title, assignedTo, and patient are required fields' });
    }
    
    // Check if assigned user exists
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(400).json({ message: 'Assigned user not found' });
    }
    
    // Create new task with sanitized data
    const newTask = new Task({
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      assignedBy: req.user.id,
      patient,
      // Only include non-empty values for ObjectId fields
      ...(relatedVisit ? { relatedVisit } : {}),
      ...(relatedNote ? { relatedNote } : {})
    });
    
    const savedTask = await newTask.save();
    
    // Create notification for the assigned user
    const notification = new Notification({
      user: assignedTo,
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${title}`,
      type: 'task',
      priority: priority || 'medium',
      relatedTask: savedTask._id,
      relatedPatient: patient,
      link: `/tasks/${savedTask._id}`
    });
    
    await notification.save();
    
    // Return the saved task with populated fields
    const populatedTask = await Task.findById(savedTask._id)
      .populate('assignedTo', 'firstName lastName username')
      .populate('assignedBy', 'firstName lastName username')
      .populate('patient', 'firstName lastName dateOfBirth');
    
    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
});

// Update a task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      priority, 
      status, 
      dueDate, 
      assignedTo,
      relatedVisit,
      relatedNote
    } = req.body;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user is authorized to update the task
    // Allow task update by: the assigner, the assignee, or an admin
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (task.assignedBy.toString() !== userId && 
        task.assignedTo.toString() !== userId && 
        userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }
    
    // Check if assignedTo is being changed
    const isAssigneeChanged = assignedTo && task.assignedTo.toString() !== assignedTo;
    
    // Check if status is being changed to completed
    const isCompleted = status === 'completed' && task.status !== 'completed';
    
    // Update task fields
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (status) task.status = status;
    if (dueDate) task.dueDate = dueDate;
    if (assignedTo) task.assignedTo = assignedTo;
    
    // Handle relatedVisit and relatedNote fields
    if (relatedVisit === '') {
      // If empty string, remove the field
      task.relatedVisit = undefined;
    } else if (relatedVisit) {
      // Only update if a non-empty value is provided
      task.relatedVisit = relatedVisit;
    }
    
    if (relatedNote === '') {
      // If empty string, remove the field
      task.relatedNote = undefined;
    } else if (relatedNote) {
      // Only update if a non-empty value is provided
      task.relatedNote = relatedNote;
    }
    
    // If task is completed, set completedAt timestamp
    if (isCompleted) {
      task.completedAt = Date.now();
    }
    
    const updatedTask = await task.save();
    
    // Create notification if assignee is changed
    if (isAssigneeChanged) {
      const notification = new Notification({
        user: assignedTo,
        title: 'Task Assigned to You',
        message: `You have been assigned a task: ${task.title}`,
        type: 'task',
        priority: task.priority,
        relatedTask: task._id,
        relatedPatient: task.patient,
        link: `/tasks/${task._id}`
      });
      
      await notification.save();
    }
    
    // Create notification for task completion
    if (isCompleted) {
      // Notify the person who assigned the task
      const notification = new Notification({
        user: task.assignedBy,
        title: 'Task Completed',
        message: `Task "${task.title}" has been marked as completed`,
        type: 'task',
        priority: 'low',
        relatedTask: task._id,
        relatedPatient: task.patient,
        link: `/tasks/${task._id}`
      });
      
      await notification.save();
    }
    
    // Return the updated task with populated fields
    const populatedTask = await Task.findById(updatedTask._id)
      .populate('assignedTo', 'firstName lastName username')
      .populate('assignedBy', 'firstName lastName username')
      .populate('patient', 'firstName lastName dateOfBirth');
    
    res.status(200).json(populatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
});

// Delete a task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user is authorized to delete the task
    // Only allow deletion by the assigner or an admin
    const userId = req.user.id;
    const userRole = req.user.role;
    
    if (task.assignedBy.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }
    
    // Delete related notifications
    await Notification.deleteMany({ relatedTask: task._id });
    
    // Delete the task
    await Task.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
});

export default router;