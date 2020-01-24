const readline = require('readline');
const EventEmitter = require('events');
const { fromEvent } = require('rxjs');
const { scan } = require('rxjs/operators');

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true)
console.info('Press CTRL + C to end program')
const keypress = fromEvent(process.stdin, 'keypress')


const mock = new EventEmitter();
// Only for visual feedback
mock.on('change', (e) => console.log(e));

const openValve = () => {
    console.error('OPEN VALVE');
    return false
}

const closeValve = () => {
    console.error('CLOSE VALVE');
    return false
}



const s = () => {
    let c = 0
    const listener = fromEvent(mock, 'change')

    return listener.pipe(
        scan(({pulses}, {channel}) => {
            return {channel, pulses: pulses? pulses +1 : 1}
        })
    )
}

keypress.subscribe(([event, key]) => {
    switch (event) {

        case '\r':
            // Emit node event to simulate IO with delay
            mock.emit('change', { channel: 13, value: true })
            break

        case 'c':
            closeValve()
            break

        case 'v':
            closeValve()
            break

        case 's':
            // Start to listen events and acumulate
            openValve()
            const flow = s()
            flow.subscribe(({ channel, pulses }) => {
                console.warn(channel, pulses)
                if(pulses >= 10) {
                    closeValve()
                }
            })
            break

        case '\u0003': process.exit()
        default: console.log(JSON.stringify(key))
    }
});

