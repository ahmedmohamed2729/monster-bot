
module.exports = {
  config: {
    name: "كاتش",
    version: "1.0",
    author: "Manus AI",
    role: 0,
    shortDescription: "لعبة صيد الوحوش.",
    longDescription: "لعبة بسيطة لصيد الوحوش وجمع النقاط.",
    category: "ترفيه",
    guide: "كاتش",
  },
  onStart: async function ({ api, event, args, message }) {
    const monsters = ["👹", "👺", "🤡", "👻", "👽", "👾", "🤖"];
    const monster = monsters[Math.floor(Math.random() * monsters.length)];
    const points = Math.floor(Math.random() * 100) + 10;
    
    message.reply(`لقد اصطدت وحشاً! ${monster}\nحصلت على ${points} نقطة! 🏆`);
  },
};
