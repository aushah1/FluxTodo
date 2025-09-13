const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
const ejs = require("ejs");
const userModel = require("./models/user");
const todoModel = require("./models/todo");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const user = require("./models/user");
require("dotenv").config();
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ Connection error:", err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(cookieParser());

const isloggedin = (req, res, next) => {
  if (!req.cookies.token) {
    return res.redirect("/");
  } else {
    try {
      let data = jwt.verify(req.cookies.token, "shhh");
      req.user = data;
      next();
    } catch (err) {
      res.redirect("/");
    }
  }
};

app.get("/", (req, res) => {
  res.render("index");
});

app.post("/create", async (req, res) => {
  let { name, email, password } = req.body;
  let existinguser = await userModel.findOne({ email: email });
  if (existinguser) {
    res.send("User already exists");
  }
  bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(password, salt, async function (err, hash) {
      let user = await userModel.create({
        name,
        email,
        password: hash,
      });
      let token = jwt.sign({ _id: user._id, email: user.email }, "shhh");
      res.cookie("token", token);
      res.redirect(`/todo/${user._id}`);
    });
  });
});
app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email: email });
  if (!user) {
    res.send("User doesn't exist");
  }
  bcrypt.compare(password, user.password, (err, result) => {
    if (result == true) {
      let token = jwt.sign({ _id: user._id, email: user.email }, "shhh");
      res.cookie("token", token);
      res.redirect(`/todo/${user._id}`);
    } else {
      res.send("name or password incorrect");
    }
  });
});
app.get("/todo/:userid", isloggedin, async (req, res) => {
  let user = await userModel
    .findOne({ _id: req.params.userid })
    .populate("todos");

  if (!user) {
    return res.status(404).send("User not found");
  }

  res.render("todo", { user, todos: user.todos });
});
app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/");
});
app.post("/createtask", isloggedin, async (req, res) => {
  const todo = await todoModel.create({
    content: req.body.content,
    user: req.user._id,
  });
  let user = await userModel.findOne({ email: req.user.email });
  user.todos.push(todo._id);
  await user.save();
  res.redirect(`/todo/${req.user._id}`);
});
app.get("/deletetask/:todoid", isloggedin, async (req, res) => {
  await todoModel.findOneAndDelete({ _id: req.params.todoid });
  await userModel.findOneAndUpdate(
    { _id: req.user._id },
    {
      $pull: { todos: req.params.todoid },
    }
  );
  res.redirect(`/todo/${req.user._id}`);
});
app.post("/edittask/:todoid", isloggedin, async (req, res) => {
  await todoModel.findOneAndUpdate(
    { _id: req.params.todoid },
    { content: req.body.editedcontent }
  );
  res.redirect(`/todo/${req.user._id}`);
});
app.get("/done/:todoid", isloggedin, async (req, res) => {
  await todoModel.findOneAndUpdate(
    { _id: req.params.todoid },
    { iscompleted: true }
  );
  res.redirect(`/todo/${req.user._id}`);
});

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
