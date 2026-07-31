const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

function keepAlive() {
    app.get("/", (req, res) => {
        res.send("Monster Bot is running 24/7 on Rawily!");
    });

    app.listen(port, () => {
        console.log(`[SERVER] الخادم يعمل على المنفذ: ${port} - جاهز لاستضافة Rawily`);
    });
}

module.exports = keepAlive;
