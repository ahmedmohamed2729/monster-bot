
module.exports = {
  config: {
    name: "hello",
    version: "1.0",
    author: "Manus AI",
    role: 0,
    shortDescription: "يرد بتحية بسيطة",
    longDescription: "يرد بتحية بسيطة للمستخدم.",
    category: "عام",
    guide: "hello",
  },
  onStart: async function ({ api, event, args, message }) {
    message.sendMessage("أهلاً بك يا وحش!", event.threadID);
  },
};
