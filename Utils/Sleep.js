// Utils/sleep.js
module.exports = function(time) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, time * 1000);
    });
};
