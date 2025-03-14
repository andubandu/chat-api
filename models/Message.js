const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  message: String,
  attachment: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Message', messageSchema);
