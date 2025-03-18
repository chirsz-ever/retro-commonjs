console.log("begin mod1.js")

// console.log(require.cache)

require("./sub/mod2")

// console.log(require.cache)

exports.x = 114

console.log("end mod1.js")
