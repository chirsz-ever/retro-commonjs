exports.index_done = false;

console.log(__filename, "this:", this)

const a = require("./a.js");

exports.index_done = true;

console.log("exports === a.i:", exports === a.i)
