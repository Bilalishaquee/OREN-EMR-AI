// routes/headerFooter.js
import express from 'express';
const router = express.Router();
import multer  from 'multer';
import path from 'path';
import Template  from '../models/Template.js';
import { authenticateToken } from '../middleware/authMiddleware.js';



// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // folder to store images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// ✅ API: Upload or Update Header/Footer Images
router.post('/upload',authenticateToken, upload.fields([
  { name: 'headerImage', maxCount: 1 },
  { name: 'footerImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const  DrId  = req.user.id;
    console.log('Received DrId:', DrId);
    if (!DrId) {
      return res.status(400).json({ message: 'DrId is required' });
    }

    const headerPath = req.files['headerImage']
      ? req.files['headerImage'][0].path
      : null;
    const footerPath = req.files['footerImage']
      ? req.files['footerImage'][0].path
      : null;

  // ✅ Always create new record (don’t check findOne)
      const record = await Template.create({
        DrId,
        headerImage: headerPath,
        footerImage: footerPath,
      });

    res.status(200).json({
      message: 'Images uploaded successfully',
      data: record
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// ✅ API: Get Images by Doctor ID
router.get('/get-Templates',authenticateToken, async (req, res) => {
  try {
    const record = await Template.find({ DrId: req.user.id });
    if (!record) {
      return res.status(404).json({ message: 'No record found' });
    }
    res.status(200).json({ data: record });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

export default  router;
