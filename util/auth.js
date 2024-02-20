// import crypto from "node:crypto";
// import {Strategy as LocalStrategy} from "passport-local";
// import {PrismaClient} from "@prisma/client";

const {PrismaClient} = require("@prisma/client");
// const {Strategy as LocalStrategy} = require("passport-local")
const LocalStrategy = require("passport-local").Strategy

const crypto = require("node:crypto");


const N = Math.pow(2, 17);
const maxmem = 144 * 1024 * 1024;
const keyLen = 192;
const saltSize = 64;

/**
 * Salt用のランダムバイト列生成
 */
const generateSalt = () => crypto.randomBytes(saltSize);

/**
 * パスワードハッシュ値計算
 * @param {string} plain
 * @param {Buffer} salt
 */
const calcHash = (plain, salt) => {
    const normalized = plain.normalize();
    const hash = crypto.scryptSync(normalized, salt, keyLen, {N, maxmem});
    if (!hash) {
        throw Error("ハッシュ値計算エラー");
    }
    return hash;
};

/**
 * Passport.js を設定する
 */
const config = (passport) => {
    const prisma = new PrismaClient();
    passport.use(new LocalStrategy({
        usernameField: "email", passwordField: "pass"
    }, async ( email, password, done) => {
        try {
            const user = await prisma.users.findUnique({
                where: {email}
            });
            if (!user) {
                // ユーザがいない
                return done(null, false, {message: "invalid username and/or password."});
            }
            const hashed = calcHash(password, user.salt);
            if (!crypto.timingSafeEqual(user.password, hashed)) {
                // パスワード違う
                return done(null, false, {message: "invalid username and/or password.."});
            }
            // OK
            const isADorID = {isAdmin: user.isAdmin,id: Number(user.id)}; // isAdmin と user.id をisADorIDに入れてる
            return done(null, isADorID); // bigintが使えないからNumberに変える
                                                            // doneに書くとreq.userに情報が格納される
        } catch (e) {
            return done(e);
        }
    }));
    // セッションストアに保存
    passport.serializeUser((user, done) => {
        process.nextTick(() => {
            done(null, {id: user.id, name: user.name, isAdmin: user.isAdmin});
        });
    });
    // セッションストアから復元
    passport.deserializeUser((user, done) => {
        process.nextTick(() => {
            return done(null, user);
        });
    });
    return (req, res, next) => {
        next();
    }
};

// module.exports = config;
module.exports = {generateSalt, calcHash, config}