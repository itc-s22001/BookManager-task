const express = require('express');
const passport = require("passport")
const {check, validationResult} = require("express-validator")
const {generateSalt, calcHash} = require("../util/auth");
const {PrismaClient} = require("@prisma/client");


const router = express.Router();
const prisma = new PrismaClient();

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.send('respond with a resource');
});

// 新規登録
router.post("/register", [
  check("name").notEmpty({ignore_whitespace: true}),
  check("email").notEmpty({ignore_whitespace: true}),
  check("pass").notEmpty({ignore_whitespace: true})
], async (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    res.status(400).json({message: "username, email and/or password is empty"});
    return
  }
  const {name, email, pass} = req.body;
  const salt = generateSalt();
  const hashed = calcHash(pass, salt);
  try {
    await prisma.users.create({
      data: {
        name,
        email,
        password: hashed,
        salt
      }
    });
    res.status(200).json({message: "created"});
  } catch (e) {
    switch (e.code) {
      case "P2002":
        res.status(400).json({message: "username is already registered"});
        break;
      default:
        console.log(e);
        res.status(500).json({message: "unknown error"});
    }
  }
});



// ログイン
router.post("/login", passport.authenticate("local", {
  failWithError: true
}), (req, res, next) => {
  res.status(200).json({message: "ログインOK",isAdmin: req.user});
});

module.exports = router;
