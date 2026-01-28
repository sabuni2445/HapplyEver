import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// Get user by Clerk ID
router.get('/clerk/:clerkId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync user from Clerk (called from frontend)
router.post('/sync', async (req, res) => {
  try {
    const { clerkId, email, firstName, lastName, username, imageUrl } = req.body;

    if (!clerkId || !email) {
      return res.status(400).json({ error: 'clerkId and email are required' });
    }

    // Upsert user (create if doesn't exist, update if exists)
    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        clerkId,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        username: username || '',
        imageUrl: imageUrl || ''
      },
      { new: true, upsert: true }
    );

    res.json({ 
      success: true, 
      user,
      message: user.isNew ? 'User created' : 'User updated' 
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user role
router.patch('/:clerkId/role', async (req, res) => {
  try {
    const { selectedRole } = req.body;
    
    const user = await User.findOneAndUpdate(
      { clerkId: req.params.clerkId },
      { selectedRole, profileCompleted: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.patch('/:clerkId/profile', async (req, res) => {
  try {
    const updates = req.body;
    
    const user = await User.findOneAndUpdate(
      { clerkId: req.params.clerkId },
      { ...updates, profileCompleted: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;










