const readline = require('readline');
const EventEmitter = require('events');

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true)
console.info('Press CTRL + C to end program')

const mock = new EventEmitter();
// Only for visual feedback
mock.on('change', (e) => console.log(e));



process.stdin.on('keypress', (str, key) => {
    switch (key.sequence) {

        case '\r':
            // Emit node event to simulate IO
            mock.emit('change', { channel: 13, value: true })
            break

        case '\u0003': process.exit()
        default: console.log(key)
    }
});