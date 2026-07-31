
const fs = require("fs");

module.exports = function (api) {
    const prefix = "!"; // يمكن تغيير البادئة هنا
    let ownerID = "YOUR_OWNER_ID"; // سيتم استبدالها لاحقاً بمعرف المطور
    const commands = new Map();

    // دالة لتحميل الأوامر من مسار معين
    function loadCommands(dir) {
        fs.readdirSync(dir).forEach(file => {
            if (file.endsWith(".js")) {
                const command = require(`${dir}/${file}`);
                commands.set(command.name, command);
                console.log(`تم تحميل الأمر: ${command.name} من ${dir}`);
            }
        });
    }

    // تحميل الأوامر العامة
    loadCommands(__dirname + "/commands");
    // تحميل أوامر المطور
    loadCommands(__dirname + "/commands/dev");

    // الاستماع للرسائل
    api.listen((err, message) => {
        if (err) return console.error(err);

        // تحديث ownerID إذا تم توفيره من قبل المستخدم لاحقاً
        // هذا الجزء سيتم تفعيله عندما يزود المستخدم الـ ownerID
        // if (message.senderID === ownerID && message.body.startsWith(`${prefix}setowner `)) {
        //     const newOwnerID = message.body.split(' ')[1];
        //     if (newOwnerID) {
        //         ownerID = newOwnerID;
        //         api.sendMessage(`تم تعيين المطور الجديد: ${ownerID}`, message.threadID);
        //     }
        //     return;
        // }

        if (message.body.startsWith(prefix)) {
            const args = message.body.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            const command = commands.get(commandName);

            if (!command) return api.sendMessage("هذا الأمر غير موجود.", message.threadID);

            // التحقق من صلاحيات المطور للأوامر الخاصة
            if (command.ownerOnly && message.senderID !== ownerID) {
                return api.sendMessage("أنت لست المطور لتنفيذ هذا الأمر.", message.threadID);
            }

            try {
                command.execute(api, message, args);
            } catch (error) {
                console.error("خطأ في تنفيذ الأمر:", error);
                api.sendMessage("حدث خطأ أثناء تنفيذ الأمر.", message.threadID);
            }
        }
    });

    // منطق حماية البوت والمجموعة (Anti-Ban, Anti-Out, Anti-Change Name, Anti-Change Admin)
    // هذا يتطلب تفاعلاً مع أحداث API المختلفة ومعالجة خاصة لكل منها.
    // سيتم إضافة المزيد من المنطق هنا لاحقاً بناءً على الأوامر المطلوبة.
    api.listenMqtt((err, event) => {
        if (err) return console.error(err);

        // مثال على حماية المجموعة من تغيير اسمها أو صورتها
        // هذا الجزء يحتاج إلى معرفة ownerID ليعمل بشكل صحيح
        // if (event.type === "change_thread_image" || event.type === "change_thread_name") {
        //     if (event.author !== ownerID) {
        //         api.sendMessage("لا يمكنك تغيير اسم أو صورة المجموعة.", event.threadID);
        //         // هنا يمكن إضافة منطق لإعادة الاسم أو الصورة الأصلية إذا كان البوت يمتلك صلاحيات كافية
        //     }
        // }

        // مثال على حماية المجموعة من طرد الأعضاء (Anti-Out)
        // if (event.type === "remove_user_from_group") {
        //     if (event.author !== ownerID && event.logMessageData.removedIDs.includes(api.getCurrentUserID())) {
        //         api.sendMessage("لا يمكنك طرد البوت!", event.threadID);
        //         // هنا يمكن إضافة منطق لإعادة البوت إلى المجموعة أو طرد من قام بطرده
        //     }
        // }

        // يمكن إضافة المزيد من المنطق هنا لأنواع الأحداث الأخرى مثل Anti-Change Admin
    });
};
