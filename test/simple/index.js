if (typeof print !== 'undefined')
    console.log = print

console.log("begin index.js")

// console.log(require.cache)

let mod1 = require("./mod1");

console.log(`mod1.x = ${mod1.x}`)

// console.log(require.cache)

// require("./mod3")

// console.log(require.cache)

console.log("end index.js")
