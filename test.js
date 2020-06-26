const { Observable, fromEvent, Subject, interval, timer } = require('rxjs');
const { first, skip, debounce, map, finalize, filter, take, throttle, switchMap, multicast } = require('rxjs/operators');
const events = require('events')
const readline = require('readline')
const gpio = require('rpi-gpio')
const gpioPromise = require('rpi-gpio').promise

const rfidController = require('./old/rfidController')
const PourProvider = require('./PourProvider')
const { mockEvent, mockGpioPromise } = require('./mock')

readline.emitKeypressEvents(process.stdin)
process.stdin.setRawMode(true)
const keypress = fromEvent(process.stdin, 'keypress')
console.info('Press CTRL + C to end program')

const conf = {
    flowPulseFactor: 0.146,
    timeoutTime: 5000,
    debounceTime: 8000,
}
const provider = new PourProvider(
    () => fromEvent(gpio, 'change'),
    gpioPromise,
    conf
)

const calibragem = async ({ id }) => {
    let pulses = 0
    const flowMeter = provider.gpioListener().pipe(
        map(([pin, value], i) => {
            // console.log(value, i)
            pulses++
            const volume = Math.trunc(pulses * conf.flowPulseFactor)
            return { id, pin, value, pulses, volume, i, segundo: (new Date()).getSeconds(), t: + new Date() }
        }),
        throttle(() => interval(1000)),
    )

    const op = flowMeter.pipe(
        take(10)
    ).subscribe(
        ({ id, pin, value, pulses,segundo, volume, t, i }) => {
            console.log({ id, volume, segundo, i, t })
        },
        err => console.log('FALHA NO FLUXOMETRO', err),
        (p) => console.log('-------------------------', process.exit())
    )
}

let ctrl = true
let TEST = 16

try {
    keypress.subscribe(async ([event, key]) => {
        switch (event) {

            case ' ':
                await provider.setup()
                calibragem({ id: 0 })
                    .then(() => console.log('calibrando! - - - - - - - -'))
                    .catch((err) => console.error('ERRO > > >', err))
                break;

            case '\u0003': // CTRL C termina aplicação
                // CTRL + C to exit
                process.exit()

            default: console.log(`Options:
[ ]: POUR 10 s
`, JSON.stringify(key))
        }
    });
} catch (e) {
    console.log(e)
    process.exit()
}
