const { Observable, fromEvent, Subject, interval, timer } = require('rxjs');
const { first, skip, debounce, map, finalize, filter, throttle, switchMap, multicast } = require('rxjs/operators');
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

const consumption = {
    "meta": null,
    "id": 1067,
    "limitAmount": 100,
    "createdAt": "2020-05-25T13:24:45.269532+00:00",
    "consumption_order": {}
}

const mockFlowmeter = () => interval(10).pipe(
    // delay(15000), // TIMEOUT
    filter((t) => {
        // return true // Default
        return t < 300 // || t > 500 // DEBOUNCE
    }),
    map(() => [13, true])
)

const provider = new PourProvider(
    () => fromEvent(gpio, 'change'),
    gpioPromise,
    {
        flowPulseFactor: 0.146,
        timeoutTime: 5000,
        debounceTime: 8000,
    }
)

const ipcMain = new events.EventEmitter()
ipcMain.on('AUTHENTICATED', provider.consumptionHandler)

let ctrl = true
let TEST = 16

try {
    keypress.subscribe(async ([event, key]) => {
        switch (event) {
            case 'a':
                provider.setup().then(async () => {
                    ipcMain.emit('AUTHENTICATED', mockEvent, consumption)
                })
                break

            case '\'':
                await provider.setup()
                break
            case '1':
                await provider.start()
                break
            case '2':
                await provider.stop()
                break
            case '\\':
                await provider.clean()
                break

            case ' ':
                console.log('LISTEN: ', TEST)
                await gpioPromise.setup(TEST, gpioPromise.DIR_IN, gpioPromise.EDGE_BOTH)
                fromEvent(gpio, 'change').subscribe(i => console.log(i))
                break

            case 'z':
                await gpioPromise.setup(TEST, gpioPromise.DIR_HIGH)
                break
            case 'x':
                await gpioPromise.write(TEST, ctrl)
                ctrl = !ctrl
                break
            case 'c':
                await gpioPromise.write(TEST, ctrl)
                ctrl = !ctrl
                break

            case '5':
                console.log('-> Lendo RFID uma vez')
                rfidController
                    .readOnce()
                    .subscribe((payload) => {
                        console.log('RFID: ', payload)
                    })
                break

            case '6':
                console.log('-> Lendo RFID permanentemente')
                rfidController
                    .listen()
                    .subscribe(payload => console.log('RFID: ', payload))
                break

            case 'x': // Permanentemente começa a ouvir a porta do fluxometro
                provider.gpioListener().subscribe((e) => console.log(e))
                break;

            case '\u0003': // CTRL C termina aplicação
                // CTRL + C to exit
                process.exit()

            default: console.log(`Options:
a: pour 100ml
\': setup
1: start
2: stop
\\: destroy
5: RFID once
6: RFID
z: TEST pin ${TEST} setup to WRITE
x: TEST pin ${TEST} true
c: TEST pin ${TEST} false
[ ]: listen pin ${TEST} raw
x: listen flowmeter`, JSON.stringify(key))
        }
    });
} catch (e) {
    console.log(e)
    process.exit()
}
