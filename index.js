const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true)
console.info('Press CTRL + C to end program')


const init = () => {
    console.warn("TODO: Recreate service")
}


process.stdin.on('keypress', (str, key) => {
    console.log(key)
    switch (key.sequence) {
        case '\u0003': process.exit();
        case '\r': init(); break;
        default: console.log(key);
    }
});