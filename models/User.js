const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  profilePicture: { 
    type: String, 
    default: 'https://res.cloudinary.com/dmyrg759k/image/upload/v1741884391/default-avatar-icon-of-social-media-user-vector_m82mma.jpg' 
  }
});

module.exports = mongoose.model('User', userSchema);
