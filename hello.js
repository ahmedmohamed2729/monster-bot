
module.exports = {
    name: "hello",
    description: "يرد بتحية بسيطة",
    ownerOnly: false,
    execute(api, message, args) {
        api.sendMessage("أهلاً بك يا وحش!", message.threadID);
    },
};
