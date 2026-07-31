const login = require("fca-unofficial");
const fs = require("fs");
const path = require("path");

// معرف المطور (Owner ID) - سيتم تحديثه لاحقاً بواسطة المستخدم
let ownerID = "61592435225481"; 

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
          const command = require(path.join(folderPath, file));
          if (command.config && command.onStart) {
            commands.set(command.config.name, command);
            console.log(`[COMMAND LOADER] Loaded command: ${command.config.name} from ${folder}`);
          } else {
            console.warn(`[COMMAND LOADER] Skipping file ${file}: Missing config or onStart function.`);
          }
        } catch (error) {
          console.error(`[COMMAND LOADER] Failed to load command ${file}:`, error);
        }
      }
    }
  }
  console.log(`[COMMAND LOADER] Total commands loaded: ${commands.size}`);
}

// تحميل الأوامر عند بدء التشغيل
loadCommands();

// مسار ملف appstate.json
const appstatePath = path.join(__dirname, "appstate.json");

// التحقق من وجود appstate.json
if (!fs.existsSync(appstatePath)) {
  console.error("[ERROR] appstate.json not found! Please create it with your Facebook appstate.");
  process.exit(1);
}

// قراءة appstate.json
const appstate = JSON.parse(fs.readFileSync(appstatePath, "utf8"));

login({ appState: appstate }, (err, api) => {
  if (err) {
    console.error("[LOGIN ERROR]", err);
    // محاولة إعادة الاتصال بعد فترة
    setTimeout(() => {
      console.log("[RECONNECT] Attempting to reconnect...");
      process.exit(1); // إعادة تشغيل العملية لمحاولة تسجيل الدخول مرة أخرى
    }, 5000);
    return;
  }

  console.log("تم تسجيل الدخول بنجاح! بوت Monster جاهز.");

  api.listenMqtt(async (err, event) => {
    if (err) {
      console.error("[MQTT ERROR]", err);
      // إذا كان الخطأ يتعلق بالاتصال، حاول إعادة الاتصال
      if (err.error === "Not logged in") {
        console.log("[RECONNECT] Session expired, attempting to relogin...");
        process.exit(1); // إعادة تشغيل العملية
      }
      return;
    }

    // معالجة الرسائل
    if (event.type === "message" || event.type === "message_reply") {
      const messageText = event.body ? event.body.toLowerCase() : "";
      const prefix = "!"; // يمكنك تغيير البادئة هنا

      if (messageText.startsWith(prefix)) {
        const args = messageText.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        const command = commands.get(commandName);

        if (command) {
          // التحقق من صلاحيات المطور للأوامر المقيدة
          if (command.config.role === 1 && event.senderID !== ownerID) {
            return api.sendMessage("عذراً، هذا الأمر مخصص للمطور فقط.", event.threadID, event.messageID);
          }

          try {
            await command.onStart({ api, event, args, message: api });
          } catch (cmdError) {
            console.error(`[COMMAND ERROR] Error executing command ${commandName}:`, cmdError);
            api.sendMessage(`حدث خطأ أثناء تنفيذ الأمر ${commandName}.`, event.threadID, event.messageID);
          }
        } else {
          // api.sendMessage("عذراً، هذا الأمر غير موجود.", event.threadID, event.messageID);
        }
      }
    }

    // معالجة أحداث تغيير اسم المجموعة (Anti-Change Name)
    if (event.type === "event" && event.logMessageType === "log:thread-name") {
      const threadID = event.threadID;
      if (global.groupNameIntervals && global.groupNameIntervals[threadID]) {
        // لا تفعل شيئاً، لأن الأمر \'مجموعة\' سيتولى إعادة الاسم
        console.log(`[ANTI-CHANGE NAME] Group name changed in thread ${threadID}, \'groupname\' command will revert it.`);
      } else {
        // إذا لم يكن هناك أمر \'مجموعة\' نشط، يمكن إضافة منطق هنا لإعادة الاسم الافتراضي أو تنبيه المطور
        console.log(`[ANTI-CHANGE NAME] Group name changed in thread ${threadID}, but no \'groupname\' command is active.`);
      }
    }

    // معالجة أحداث تغيير صورة المجموعة (Anti-Change Image) - مثال
    if (event.type === "event" && event.logMessageType === "log:thread-image") {
      // يمكنك هنا إضافة منطق لإعادة الصورة القديمة أو تنبيه المطور
      console.log(`[ANTI-CHANGE IMAGE] Group image changed in thread ${event.threadID}.`);
      // مثال: api.sendMessage("تم تغيير صورة المجموعة!", event.threadID);
    }

    // معالجة أحداث إخراج الأعضاء (Anti-Out) - مثال
    if (event.type === "event" && event.logMessageType === "log:unsubscribe") {
      const leftParticipantID = event.logMessageData.leftParticipantFbId;
      const authorID = event.author;
      // إذا كان المطور هو من أخرج نفسه، لا تفعل شيئاً
      if (leftParticipantID === ownerID) {
        console.log(`[ANTI-OUT] Owner ${ownerID} left thread ${event.threadID}.`);
        return;
      }
      // إذا كان المطور هو من أخرج شخصاً آخر، لا تفعل شيئاً
      if (authorID === ownerID) {
        console.log(`[ANTI-OUT] Owner ${ownerID} removed ${leftParticipantID} from thread ${event.threadID}.`);
        return;
      }
      // إذا تم إخراج شخص آخر، قم بإعادته (مثال)
      console.log(`[ANTI-OUT] Participant ${leftParticipantID} was removed by ${authorID} from thread ${event.threadID}. Attempting to re-add.`);
      // api.addParticipants(leftParticipantID, event.threadID, (err) => {
      //   if (err) console.error("[ANTI-OUT ERROR] Failed to re-add participant:", err);
      //   else api.sendMessage(`تمت إعادة ${leftParticipantID} إلى المجموعة.`, event.threadID);
      // });
    }

    // معالجة أحداث تغيير المشرفين (Anti-Change Admin) - مثال
    if (event.type === "event" && event.logMessageType === "log:thread-admins") {
      const newAdminIDs = event.logMessageData.ADMIN_IDS;
      const removedAdminIDs = event.logMessageData.REMOVED_ADMIN_IDS;
      const authorID = event.author;

      // إذا قام المطور بتغيير المشرفين، لا تفعل شيئاً
      if (authorID === ownerID) {
        console.log(`[ANTI-CHANGE ADMIN] Owner ${ownerID} changed admins in thread ${event.threadID}.`);
        return;
      }

      // إذا تم تغيير المشرفين من قبل شخص آخر غير المطور، يمكنك إضافة منطق هنا لإعادة الصلاحيات أو تنبيه المطور
      console.log(`[ANTI-CHANGE ADMIN] Admins changed by ${authorID} in thread ${event.threadID}.`);
      // مثال: api.sendMessage("تم تغيير المشرفين في المجموعة من قبل شخص غير المطور!", event.threadID);
    }
  });
});
