const express = require("express");
const {PrismaClient} = require("@prisma/client")
const {check, validationResult} = require("express-validator");
const {all} = require("express/lib/application");
const {data} = require("express-session/session/cookie");

const router = express.Router();
const prisma = new PrismaClient();

const Admin = (req, res, next) => {
    const {isAdmin} = req.user
    // ここに管理者権限の確認ロジックを実装
    const isAdminUser = isAdmin; // 仮の実装
    if (isAdminUser) {
        next(); // 管理者なら次へ進む
    } else {
        res.status(403).json({error: '管理者権限が必要'}); // 管理者でないならエラーを返す
    }
};

// 書籍情報登録
router.post("/book/create", [
    check('publishDate').isISO8601(),
], Admin, async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({message: "Invalid publishDate format", errors: errors.array()});
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
router.put("/book/update", Admin, async (req, res, next) => {
    const {bookId, isbn13, title, author, publishDate} = req.body;

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

// 全ユーザの貸出中書籍一覧
router.get("/rental/current", Admin, async (req, res, next) => {
    try {
        const allUserRental = await prisma.rental.findMany({
            where: {
                returnDate: null // 未返却のもののみ
            },
            select: {
                id: true,
                returnDate: true,
                rentalDate: true,
                returnDeadline: true,
                users: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                books: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
        });
        const  rentalBooks = allUserRental.map(rental => ({
            rentalId: rental.id,
            userId: rental.users.id,
            userName: rental.users.name,
            bookId: rental.books.id,
            bookName: rental.books.title, // booksモデルのタイトルを参照
            rentalDate: rental.rentalDate,
            returnDeadline: rental.returnDeadline
        }));
        res.status(200).json({rentalBooks});
    } catch (e) {
        res.status(500).json({message: "全ユーザの貸出中書籍一覧失敗"});
        console.log(e);
    }
});

// 特定ユーザの貸出中書籍一覧
router.get("/rental/current/:uid", Admin, async (req, res, next) => {
    try {
        const userId = +req.params.uid;

        const selectUserRental = await prisma.rental.findMany({
            where: {
                userId: userId,
                returnDate: null
            },
            select: {
                id: true,
                bookId: true,
                rentalDate: true,
                returnDeadline: true,
                // users: {
                //     select: {
                //         id: true,
                //         name: true
                //     }
                // },
                books: {
                    select: {
                        title: true
                    }
                }
            }
        });
        const user = await prisma.users.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                name: true
            }
        })
        const  rentalBooks = selectUserRental.map(rental => ({
            rentalId: rental.id,
            bookId: rental.bookId,
            bookName: rental.books.title, // booksモデルのタイトルを参照
            rentalDate: rental.rentalDate,
            returnDeadline: rental.returnDeadline
        }));
        res.status(200).json({
            userId: user.id,
            userName: user.name,
            rentalBooks
        })
        // res.status(200).json({
        //     userId: selectUserRental.users.id,
        //     userName: selectUserRental.users.name,
        //     rentalBooks,
        // });
    } catch (e) {
        res.status(500).json({message: "失敗"});
        console.log(e)
    }
});

module.exports = router;

