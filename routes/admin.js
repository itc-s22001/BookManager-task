const express = require("express");
const {PrismaClient} = require("@prisma/client")
const {check, validationResult} = require("express-validator");

const router = express.Router();
const prisma = new PrismaClient();

// 書籍情報登録
router.post("/book/create", [
    check('publishDate').isISO8601(),
], async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({ message: "Invalid publishDate format", errors: errors.array() });
        return;
    }

    const {isbn13, title, author, publishDate} = req.body;
    try {
        await prisma.books.create({
            data: {
                isbn13: Number(isbn13),
                title,
                author,
                publishDate: new Date(publishDate)
            }
        });
        res.status(201).json({message: "OK"});
    } catch (e) {
        console.log(e);
        res.status(400).json({message: "NG"});
    }
});

// 書籍情報更新
router.put("/book/update",async (req, res, next) => {
    const {bookId,isbn13, title, author, publishDate} = req.body;

    try {
        await prisma.books.update({
            where: {id: bookId},
            data: {
                isbn13: (isbn13),
                title,
                author,
                publishDate
            }
        });
        res.status(200).json({message: "OK"});
    } catch (e) {
        console.log(e)
        res.status(400).json({message: "NG"});
    }
});

module.exports = router;

