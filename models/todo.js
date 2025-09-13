const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    content: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    iscompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Todo", todoSchema);
