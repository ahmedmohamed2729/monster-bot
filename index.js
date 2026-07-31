
const login = require("fca-unofficial");
const fs = require("fs");
const keepAlive = require("./server.js");

// تشغيل خادم الـ Express للبقاء نشطاً على Rawily
keepAlive();

const appstatePath = "./appstate.json";

function startBot() {
    console.log("جاري محاولة تسجيل الدخول...");
    
    if (!fs.existsSync(appstatePath)) {
        console.error("خطأ: ملف appstate.json غير موجود!");
        return;
    }

    const appState = JSON.parse(fs.readFileSync(appstatePath, "utf8"));

    login({ appState }, (err, api) => {
        if (err) {
            console.error("خطأ في تسجيل الدخول:", err);
            setTimeout(startBot, 60 * 1000); 
            return;
        }

        api.setOptions({ 
            listenEvents: true, 
            selfListen: true,
            forceLogin: true,
            online: true
        });

        console.log("تم تسجيل الدخول بنجاح! بوت Monster جاهز.");

        // تحميل ملف الإدارة الرئيسي
        require("./main.js")(api);
    });
}

startBot();
