const express = require("express");
const {PrismaClient} = require("@prisma/client")
const {check, validationResult} = require("express-validator");

const router = express.Router();
const prisma = new PrismaClient();

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

module.exports = router;

