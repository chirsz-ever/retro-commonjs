console.log('globalThis.fetch:', globalThis.fetch);
if (typeof window === 'undefined') {
    console.log('window: undefined');
} else {
    console.log('window.fetch:', window.fetch);
}
console.log('Function("return fetch"):', Function("return fetch")());
console.log('eval("fetch"):', (0, eval)('fetch'));

try {
    globalThis[Symbol.unscopables] = {
        fetch: true
    }
    console.log('unscopables fetch:', fetch);
} catch (e) {
    console.log('unscopables fetch:', e.name, e.message);
}

// only this works without lockdown
try {
    const fetch = (_ => 0).constructor('return fetch')();
    console.log('constructor fetch:', fetch);
} catch (e) {
    console.log('constructor fetch:', e.name, e.message);
}
