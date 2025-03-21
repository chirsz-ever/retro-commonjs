const test_code = (prompt, code_cbk) => {
    try {
        console.log(prompt, code_cbk());
    } catch (e) {
        console.log(prompt, e.name, e.message);
    }
}

test_code('globalThis.fetch:', () => globalThis.fetch);
test_code('window.fetch:', () => window.fetch);
test_code('Function("return fetch"):', () => Function("return fetch")());
test_code('eval("fetch"):', () => (0, eval)('fetch'));

test_code('unscopables fetch:', () => {
    globalThis[Symbol.unscopables] = {
        fetch: true
    }
    return fetch;
});

// only this works without lockdown
test_code('(_ => 0).constructor("return fetch")():', () => (_ => 0).constructor('return fetch')());
