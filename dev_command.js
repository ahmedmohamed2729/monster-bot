
module.exports = {
    name: "devtest",
    description: "أمر تجريبي للمطورين فقط.",
    ownerOnly: true,
    execute(api, message, args) {
        api.sendMessage("هذا أمر خاص بالمطور فقط!", message.threadID);
    },
};
