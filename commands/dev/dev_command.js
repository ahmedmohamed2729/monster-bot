
module.exports = {
  config: {
    name: "devtest",
    version: "1.0",
    author: "Manus AI",
    role: 1, // Developer only
    shortDescription: "اختبار المطور.",
    longDescription: "أمر لاختبار صلاحيات المطور.",
    category: "اداري",
    guide: "devtest",
  },
  onStart: async function ({ api, event, args, message }) {
    message.sendMessage("أهلاً بك يا مطوري، البوت يعمل بشكل ممتاز!", event.threadID);
  },
};
