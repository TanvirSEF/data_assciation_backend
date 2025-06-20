const express = require("express");
const app = express();
const port = 3000;
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index", { title: "Home" });
});
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/profile", isLoggedIn, async (req, res) => {
  let user = await userModel.findById(req.user.userid).populate("posts");
  res.render("profile", { user });
});
app.get("/like/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  if (post.likes.indexOf(req.user.userid) === -1) {
    post.likes.push(req.user.userid);
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1);
  }
  await post.save();
  res.redirect("/profile");
});
app.get("/edit/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  res.render("edit", { post });
});
app.post("/update/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id });
  post.title = req.body.title;
  post.content = req.body.content;
  await post.save();
  res.redirect("/profile");
});
app.get("/delete/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id });
  let user = await userModel.findById(req.user.userid);
  user.posts.splice(user.posts.indexOf(post._id), 1);
  await user.save();
  await postModel.deleteOne({ _id: req.params.id });
  res.redirect("/profile");
});

app.post("/post", isLoggedIn, async (req, res) => {
  let user = await userModel.findById(req.user.userid);
  let { content, title } = req.body;
  let post = await postModel.create({
    user: user._id,
    content,
    title,
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});

app.post("/register", async (req, res) => {
  const { username, name, email, age, password } = req.body;
  let user = await userModel.findOne({ email });
  if (user) {
    return res.status(400).send("User already exists");
  }
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      if (err) {
        return res.status(500).send("Error hashing password");
      }
      let user = await userModel.create({
        username,
        name,
        email,
        age,
        password: hash,
      });
      let token = jwt.sign({ email: email, userid: user._id }, "secret");
      res.cookie("token", token);
      res.redirect("/profile");
    });
  });
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) {
    return res.status(400).send("Something Went Wrong!");
  }
  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, "secret");
      res.cookie("token", token);
      res.status(200).redirect("/profile");
    } else {
      res.redirect("/login");
    }
  });
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

function isLoggedIn(req, res, next) {
  if (req.cookies.token === "") {
    res.redirect("/login");
  } else {
    let data = jwt.verify(req.cookies.token, "secret");
    req.user = data;
    next();
  }
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
