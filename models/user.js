const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    todos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Todo" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
