const fs = require('fs');

module.exports = {
  config: {
    name: 'مجموعة',
    version: '1.0',
    author: 'Manus AI',
    role: 1, // 1 for developer only
    shortDescription: 'يغير اسم المجموعة بشكل دوري ويحميها من التغيير.',
    longDescription: 'يستخدم لحماية اسم المجموعة من التغيير. يقوم بتغيير اسم المجموعة إلى الاسم المحدد كل فترة زمنية معينة.',
    category: 'اداري',
    guide: 'مجموعة <الوقت بالثواني> <الاسم>\nمثال: مجموعة 10 اسم_المجموعة_الجديد',
  },
  onStart: async function ({ api, event, args, message }) {
    const threadID = event.threadID;
    const [timeStr, ...nameParts] = args;
    const intervalTime = parseInt(timeStr) * 1000; // Convert seconds to milliseconds
    const newName = nameParts.join(' ');

    if (!intervalTime || isNaN(intervalTime) || !newName) {
      return message.reply('الرجاء استخدام: مجموعة <الوقت بالثواني> <الاسم>\nمثال: مجموعة 10 اسم_المجموعة_الجديد');
    }

    // Store the interval in a global map or database to manage it
    if (!global.groupNameIntervals) {
      global.groupNameIntervals = {};
    }

    // Clear any existing interval for this thread
    if (global.groupNameIntervals[threadID]) {
      clearInterval(global.groupNameIntervals[threadID]);
      delete global.groupNameIntervals[threadID];
    }

    global.groupNameIntervals[threadID] = setInterval(async () => {
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        if (threadInfo.threadName !== newName) {
          await api.changeThreadName(newName, threadID);
          console.log(`[GROUP NAME] Changed group name to: ${newName} in thread: ${threadID}`);
        }
      } catch (error) {
        console.error(`[GROUP NAME ERROR] Failed to change group name in thread ${threadID}:`, error);
      }
    }, intervalTime);

    message.reply(`تم تفعيل حماية اسم المجموعة. سيتم تغيير اسم المجموعة إلى "${newName}" كل ${timeStr} ثانية.`);
  },
};
