const mongoose = require('mongoose');

const groupMessageQueueSchema = new mongoose.Schema({
  username: { type: String, required: true },
  groupName: { type: String, required: true },
  messages: [{ type: Object }],
});

const GroupMessageQueue = mongoose.model('GroupMessageQueue', groupMessageQueueSchema);

module.exports = GroupMessageQueue;
