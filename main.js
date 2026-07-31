
const fs = require("fs");

module.exports = function (api) {
    const prefix = "!"; 
    let ownerID = "61592435225481"; 
    const commands = new Map();

    function loadCommands(dir) {
        if (!fs.existsSync(dir)) return;
        fs.readdirSync(dir).forEach(file => {
            if (file.endsWith(".js")) {
                try {
                    const command = require(`${dir}/${file}`);
                    if (command.name) {
                        commands.set(command.name, command);
                        console.log(`✅ تم تحميل الأمر: ${command.name}`);
                    }
                } catch (e) {
                    console.error(`❌ فشل تحميل الأمر من ${file}:`, e);
                }
            }
        });
    }

    loadCommands(__dirname + "/commands");
    loadCommands(__dirname + "/commands/dev");

    api.listenMqtt((err, event) => {
        if (err) return console.error("خطأ في الاستماع:", err);

        switch (event.type) {
            case "message":
            case "message_reply":
                handleMessage(event);
                break;
            case "event":
                handleEvent(event);
                break;
        }
    });

    function handleMessage(message) {
        if (!message.body || !message.body.startsWith(prefix)) return;

        const args = message.body.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = commands.get(commandName);

        if (!command) return;

        if (command.ownerOnly && message.senderID !== ownerID) {
            return api.sendMessage("⚠️ هذا الأمر مخصص للمطور فقط.", message.threadID);
        }

        try {
            command.execute(api, message, args);
        } catch (error) {
            console.error(`خطأ في تنفيذ ${commandName}:`, error);
            api.sendMessage("❌ حدث خطأ أثناء تنفيذ هذا الأمر.", message.threadID);
        }
    }

    function handleEvent(event) {
        // يمكن إضافة منطق حماية المجموعة هنا
        console.log("حدث جديد:", event.logMessageType);
    }
};
