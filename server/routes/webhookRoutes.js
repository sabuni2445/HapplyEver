import express from 'express';
import { Webhook } from 'svix';
import User from '../models/User.js';

const router = express.Router();

// Clerk webhook endpoint
router.post('/clerk', async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('⚠️ CLERK_WEBHOOK_SECRET is missing');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  // Get the Svix headers for verification
  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Error occurred -- no svix headers' });
  }

  // Get the raw body as string
  const payload = JSON.stringify(req.body);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return res.status(400).json({ error: 'Error occurred -- verification failed' });
  }

  // Handle the webhook
  const { type, data } = evt;

  try {
    switch (type) {
      case 'user.created':
        await handleUserCreated(data);
        break;
      case 'user.updated':
        await handleUserUpdated(data);
        break;
      case 'user.deleted':
        await handleUserDeleted(data);
        break;
      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
});

// Handle user creation
async function handleUserCreated(data) {
  try {
    const user = await User.create({
      clerkId: data.id,
      email: data.email_addresses[0]?.email_address || '',
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      username: data.username || '',
      imageUrl: data.image_url || '',
      phoneNumber: data.phone_numbers[0]?.phone_number || '',
      metadata: {
        clerkData: data
      }
    });
    console.log(`✅ User created in database: ${user.email}`);
  } catch (error) {
    if (error.code === 11000) {
      console.log(`⚠️ User already exists: ${data.id}`);
    } else {
      throw error;
    }
  }
}

// Handle user update
async function handleUserUpdated(data) {
  try {
    const user = await User.findOneAndUpdate(
      { clerkId: data.id },
      {
        email: data.email_addresses[0]?.email_address || '',
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        username: data.username || '',
        imageUrl: data.image_url || '',
        phoneNumber: data.phone_numbers[0]?.phone_number || '',
        'metadata.clerkData': data
      },
      { new: true, upsert: true }
    );
    console.log(`✅ User updated in database: ${user.email}`);
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}

// Handle user deletion
async function handleUserDeleted(data) {
  try {
    await User.findOneAndDelete({ clerkId: data.id });
    console.log(`✅ User deleted from database: ${data.id}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

export default router;










