const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

router.get('/', auth, async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }).populate('author', 'username email profilePicture');
    res.json(messages);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, upload.single('attachment'), async (req, res) => {
  const { message } = req.body;
  let attachmentUrl = null;

  if (req.file) {
    try {
      const result = await cloudinary.uploader.upload(req.file.path);
      attachmentUrl = result.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Failed to delete local file:', unlinkErr);
      });
      return res.status(500).json({ error: 'Failed to upload attachment to Cloudinary', details: err.message });
    }

    // Delete the file from the local uploads directory
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr) console.error('Failed to delete local file:', unlinkErr);
    });
  }

  try {
    const newMessage = new Message({ 
      message, 
      attachment: attachmentUrl, 
      author: req.user.userId 
    });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Error saving message:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a message
router.put('/:id', auth, upload.single('attachment'), async (req, res) => {
  const { message } = req.body;
  let attachmentUrl = null;

  if (req.file) {
    try {
      const result = await cloudinary.uploader.upload(req.file.path);
      attachmentUrl = result.secure_url;
    } catch (err) {
      console.error('Cloudinary upload error:', err);
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Failed to delete local file:', unlinkErr);
      });
      return res.status(500).json({ error: 'Failed to upload attachment to Cloudinary', details: err.message });
    }

    // Delete the file from the local uploads directory
    fs.unlink(req.file.path, (unlinkErr) => {
      if (unlinkErr) console.error('Failed to delete local file:', unlinkErr);
    });
  }

  try {
    const messageToUpdate = await Message.findById(req.params.id);
    if (!messageToUpdate) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (messageToUpdate.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You do not have permission to update this message' });
    }

    messageToUpdate.message = message;
    if (attachmentUrl) {
      messageToUpdate.attachment = attachmentUrl;
    }
    await messageToUpdate.save();
    res.json(messageToUpdate);
  } catch (err) {
    console.error('Error updating message:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a message
router.delete('/:id', auth, async (req, res) => {
  try {
    const messageToDelete = await Message.findById(req.params.id);
    if (!messageToDelete) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (messageToDelete.author.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You do not have permission to delete this message' });
    }

    await Message.deleteOne({ _id: req.params.id });
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('Error deleting message:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
