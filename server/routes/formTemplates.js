import express from 'express';
import FormTemplate from '../models/FormTemplate.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all form templates (with optional filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { isActive, isPublic, createdBy, search } = req.query;
    
    // Build filter
    const filter = {};
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (isPublic !== undefined) {
      filter.isPublic = isPublic === 'true';
    }
    
    if (createdBy) {
      filter.createdBy = createdBy;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // If user is a doctor, only show their templates and public ones
    if (req.user.role === 'doctor') {
      filter.$or = [
        { createdBy: req.user.id },
        { isPublic: true }
      ];
    }
    
    const templates = await FormTemplate.find(filter)
      .populate('createdBy', 'firstName lastName')
      .sort({ updatedAt: -1 });
    
    res.json(templates);
  } catch (error) {
    console.error('Error fetching form templates:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific form template by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await FormTemplate.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');
    
    if (!template) {
      return res.status(404).json({ message: 'Form template not found' });
    }
    
    // Check if user has access to this template
    if (req.user.role !== 'admin' && 
        template.createdBy.toString() !== req.user.id && 
        !template.isPublic) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(template);
  } catch (error) {
    console.error('Error fetching form template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new form template
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, isPublic, language, items } = req.body;
    
    const newTemplate = new FormTemplate({
      title,
      description,
      createdBy: req.user.id,
      isPublic: isPublic || false,
      language: language || 'english',
      items: items || [],
      isActive: true
    });
    
    await newTemplate.save();
    
    res.status(201).json({
      message: 'Form template created successfully',
      template: newTemplate
    });
  } catch (error) {
    console.error('Error creating form template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a form template
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, description, isActive, isPublic, language, items } = req.body;
    
    // Find the template
    const template = await FormTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Form template not found' });
    }
    
    // Check if user has permission to update
    if (req.user.role !== 'admin' && template.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Update fields
    if (title) template.title = title;
    if (description !== undefined) template.description = description;
    if (isActive !== undefined) template.isActive = isActive;
    if (isPublic !== undefined) template.isPublic = isPublic;
    if (language) template.language = language;
    if (items) template.items = items;
    
    await template.save();
    
    res.json({
      message: 'Form template updated successfully',
      template
    });
  } catch (error) {
    console.error('Error updating form template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a form template
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const template = await FormTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Form template not found' });
    }
    
    // Check if user has permission to delete
    if (req.user.role !== 'admin' && template.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await FormTemplate.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Form template deleted successfully' });
  } catch (error) {
    console.error('Error deleting form template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Duplicate a form template
router.post('/:id/duplicate', authenticateToken, async (req, res) => {
  try {
    const template = await FormTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ message: 'Form template not found' });
    }
    
    // Check if user has permission to view this template
    if (req.user.role !== 'admin' && 
        template.createdBy.toString() !== req.user.id && 
        !template.isPublic) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Create a new template based on the existing one
    const newTemplate = new FormTemplate({
      title: `${template.title} (Copy)`,
      description: template.description,
      createdBy: req.user.id,
      isPublic: false, // Default to private for duplicates
      language: template.language,
      items: template.items
    });
    
    await newTemplate.save();
    
    res.status(201).json({
      message: 'Form template duplicated successfully',
      template: newTemplate
    });
  } catch (error) {
    console.error('Error duplicating form template:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;