
const fs = require("fs");
const path = require("path");

// معرف المطور (Owner ID)
const ownerID = "61592435225481"; 

// قائمة الأوامر
const commands = new Map();

// تحميل الأوامر من مجلد commands/
function loadCommands() {
    commands.clear();
    const commandFolders = ["commands", "commands/dev"];

    for (const folder of commandFolders) {
        const folderPath = path.join(__dirname, folder);
        if (fs.existsSync(folderPath)) {
            const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));
            for (const file of commandFiles) {
                try {
                    // Delete cache to allow reloading
                    const fullPath = path.join(folderPath, file);
                    delete require.cache[require.resolve(fullPath)];
                    const command = require(fullPath);
                    
                    if (command.config && command.onStart) {
                        commands.set(command.config.name.toLowerCase(), command);
                        console.log(`[COMMAND LOADER] Loaded command: ${command.config.name} from ${folder}`);
                    } else if (command.name && command.execute) {
                        // Compatibility for old structure
                        commands.set(command.name.toLowerCase(), {
                            config: { name: command.name, role: command.ownerOnly ? 1 : 0 },
                            onStart: async function({ api, event, args }) {
                                return command.execute(api, event, args);
                            }
                        });
                        console.log(`[COMMAND LOADER] Loaded old-style command: ${command.name} from ${folder}`);
                    }
                } catch (error) {
                    console.error(`[COMMAND LOADER] Failed to load command ${file}:`, error);
                }
            }
        }
    }
    console.log(`[COMMAND LOADER] Total commands loaded: ${commands.size}`);
}

module.exports = function(api) {
    loadCommands();

    api.listenMqtt(async (err, event) => {
        if (err) {
            console.error("[MQTT ERROR]", err);
            return;
        }

        if (event.type === "message" || event.type === "message_reply") {
            const messageText = event.body ? event.body.trim() : "";
            const prefix = "!"; 

            if (messageText.startsWith(prefix)) {
                const args = messageText.slice(prefix.length).trim().split(/ +/);
                const commandName = args.shift().toLowerCase();
                const command = commands.get(commandName);

                if (command) {
                    // التحقق من صلاحيات المطور
                    if (command.config.role === 1 && event.senderID !== ownerID) {
                        return api.sendMessage("عذراً، هذا الأمر مخصص للمطور فقط.", event.threadID, event.messageID);
                    }

                    try {
                        await command.onStart({ api, event, args, message: api });
                    } catch (cmdError) {
                        console.error(`[COMMAND ERROR] Error executing command ${commandName}:`, cmdError);
                        api.sendMessage(`حدث خطأ أثناء تنفيذ الأمر ${commandName}.`, event.threadID, event.messageID);
                    }
                }
            }
        }

        // Anti-Change Name Logic
        if (event.type === "event" && event.logMessageType === "log:thread-name") {
            const threadID = event.threadID;
            if (global.groupNameIntervals && global.groupNameIntervals[threadID]) {
                console.log(`[ANTI-CHANGE NAME] Reverting name in thread ${threadID}`);
            }
        }
    });
};
