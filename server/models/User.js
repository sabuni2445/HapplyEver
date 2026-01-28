import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  username: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String
  },
  selectedRole: {
    type: String,
    enum: ['admin', 'manager', 'protocol', 'attendee', 'vendor', 'user'],
    default: null
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  // Additional custom fields
  phoneNumber: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ clerkId: 1 });

export default mongoose.model('User', userSchema);










