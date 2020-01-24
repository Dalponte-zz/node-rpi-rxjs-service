const { fromEvent } = require('rxjs');
const readline = require('readline')
const EventEmitter = require('events')
const rpi = require('./rpiService')

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true)
console.info('Press CTRL + C to end program')
const keypress = fromEvent(process.stdin, 'keypress')

const mock = new EventEmitter();
// Only for visual feedback
mock.on('change', (e) => console.log(e));
const genericCallBack = (r) => console.warn(' == Callback == ', r)

keypress.subscribe(([event, key]) => {
    switch (event) {

        case '\r':
            // Emit node event to simulate IO with delay
            mock.emit('change', { value: true })
            break

        case '1':
            rpi.openValve( genericCallBack)
            break

        case '2':
            rpi.closeValve(genericCallBack)
            break

        case 's':
            // Start to listen events and acumulate
            rpi.openValve( () => console.log('open'))
            const flow = rpi.listenChannel({target: mock})
            flow.subscribe(({channel, pulses }) => {
                console.warn(channel, pulses)
                if (pulses >= 10) {
                    rpi.closeValve( () => console.log('close'))
                }
            })
            break

        case '\u0003': process.exit()
        default: console.log(JSON.stringify(key))
    }
});

