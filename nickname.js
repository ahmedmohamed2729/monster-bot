const fs = require("fs");

module.exports = {
  config: {
    name: "كنية",
    version: "1.0",
    author: "Manus AI",
    role: 1, // 1 for developer only
    shortDescription: "يغير كنيات جميع أعضاء المجموعة.",
    longDescription: "يستخدم لتغيير كنيات جميع أعضاء المجموعة مع تأخير 2 ثانية بين كل تغيير.",
    category: "اداري",
    guide: "كنية <الكنية_الجديدة>\nمثال: كنية مونستر",
  },
  onStart: async function ({ api, event, args, message }) {
    const threadID = event.threadID;
    const newNickname = args.join(" ");

    if (!newNickname) {
      return message.reply("الرجاء استخدام: كنية <الكنية_الجديدة>\nمثال: كنية مونستر");
    }

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const participants = threadInfo.participantIDs;

      message.reply(`بدء تغيير كنيات ${participants.length} أعضاء إلى "${newNickname}". قد يستغرق هذا بعض الوقت.`);

      for (const participantID of participants) {
        await api.changeNickname(newNickname, threadID, participantID);
        console.log(`[NICKNAME] Changed nickname for ${participantID} to: ${newNickname} in thread: ${threadID}`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds delay
      }
      message.reply("تم تغيير كنيات جميع الأعضاء بنجاح.");
    } catch (error) {
      console.error(`[NICKNAME ERROR] Failed to change nicknames in thread ${threadID}:`, error);
      message.reply("حدث خطأ أثناء محاولة تغيير الكنيات.");
    }
  },
};
