const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/miniproject");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  age: {
    type: Number,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const user = mongoose.model("user", userSchema);

module.exports = user;
