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
  check("password").notEmpty({ignore_whitespace: true})
],  async (req, res, next) => {
  if (!validationResult(req).isEmpty()) {
    res.status(400).json({message: "username, email and/or password is empty"});
    return
  }
  const {name, email, password} = req.body;
  const salt = generateSalt();
  const hashed = calcHash(password, salt);
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
        res.status(409).json({message: "NG"});
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
  try {
    res.status(200).json({message: "ログインOK", isAdmin: req.user.isAdmin});
  } catch (e) {
    res.status(401).json({message: "ログイン失敗"});
  }
});

// ログイン状態チェック
router.get("/check", (req, res, next) => {
  if (!req.user) {
    // 未ログインなら、Error オブジェクトを作って、ステータスを設定してスロー
    const err = new Error;
    res.status(401).json({message: "NG"});
    throw err;
  }
  const isAdmin = req.user.isAdmin;

  if (isAdmin) {
    res.status(200).json({message: "OK", isAdmin: true});
  } else {
    res.status(200).json({message: "OK"});
  }

  // // 未ログインなら、Error オブジェクトを作って、ステータスを設定してスロー
  // if (req.user) {
  //   res.status(401).json({message: "NG"});
  // }
  // res.status(200).json({message: "OK", isAdmin: req.user.isAdmin});
});

// ログアウト
router.get("/logout", (req, res, next) =>  {
  req.logout((err) => {
    res.status(200).json({message: "OK"});
  });
});

module.exports = router;
