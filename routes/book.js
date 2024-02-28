const express = require("express");
const {PrismaClient} = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

const isAuthenticated = (req, res, next) => {
    // ログインの確認ロジックをここに実装する
    // 例: セッションやトークンの確認
    const isLoggedIn = req.isAuthenticated(); // 仮の実装

    if (isLoggedIn) {
        next(); // ログイン済みなら次へ進む
    } else {
        res.status(401).json({error: 'ログインが必要'}); // 未ログインならエラーを返す
    }
};

// 書籍一覧
router.get("/list", isAuthenticated, async (req, res, next) => {
    try {
        const page = req.query.page ? parseInt(req.query.page) : 1;
        const maxItemCount = 10;
        const skip = maxItemCount * (page - 1);


        const books = await prisma.books.findMany({
            orderBy: {
                publishDate: "desc"
            },
            skip,
            take: maxItemCount,
            include: {
                rental: {
                    where: {
                        returnDate: null
                    },
                    select: {
                        id: true
                    }
                }
            }
            // select: {
            //     id: true,
            //     title: true,
            //     author: true,
            //     rental: true
            // },
        });

        const allcount = await prisma.books.count()

        const maxPageCount = Math.ceil(allcount / maxItemCount);

        const responseData = {
            books: books.map(books => ({
                id: books.id,
                title: books.title,
                author: books.author,
                isRental: books.rental.length > 0
            })),
            maxPage: maxPageCount,
        };

        res.status(200).json(responseData);
    } catch (e) {
        res.status(500).json({message: "一覧取得失敗"});
        console.log(e);
    }
});

// 書籍詳細
router.get("/detail/:id", isAuthenticated, async (req, res, next) => {
    try {
        const bookId = req.params.id; // 書籍IDを取得

        // 書籍を取得
        const bookdetail = await prisma.books.findUnique({
            where: {
                id: parseInt(bookId),

            },
            include: {
                rental: {
                    include: {
                        users: true
                    }
                }
            },
        });

        // 書籍が存在しない場合は404を返す
        if (!bookdetail) {
            return res.status(404).json({ message: '指定された書籍が見つかりません' });
        }

        // レスポンスデータを整理
        const responseData = {
            id: bookdetail.id,
            isbn13: bookdetail.isbn13,
            title: bookdetail.title,
            author: bookdetail.author,
            publishDate: bookdetail.publishDate,
            rentalInfo: null
        };
        if (bookdetail.rental.length > 0) {
            const latestRental = bookdetail.rental[bookdetail.rental.length - 1];
            responseData.rentalInfo = {
                userName: latestRental.users.name,
                rentalDate: latestRental.rentalDate,
                returnDeadline: latestRental.returnDeadline
            };
        }
        res.status(200).json(responseData);
    } catch (error) {
        console.error('書籍詳細の取得中にエラーが発生しました:', error);
        res.status(500).json({ message: 'サーバーエラーが発生しました' });
    }
});

module.exports = router;