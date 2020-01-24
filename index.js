const { fromEvent } = require('rxjs');
const readline = require('readline')
const EventEmitter = require('events')
const rpiService = require('./rpiService')
const { finalize } = require('rxjs/operators');

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true)
const keypress = fromEvent(process.stdin, 'keypress')

const mock = new EventEmitter();
// Only for visual feedback	
mock.on('change', (e) => console.log(e));

const genericCallBack = (r) => console.warn(' == Callback == ', r)

const pour = (rpi, { pulsePerMl, mlRestriction }) => {
    // Open valve
    rpiService.openValve(rpi, genericCallBack)

    // Get RxJs observable by the EventEmiter provided by the GPIO lib
    const flow = rpiService.observeChannel(rpi, ({ pulses }) => {
        if (pulses * pulsePerMl >= mlRestriction) {
            return true
        }
        else return false
    })
    const treated = flow.pipe(finalize(() => rpiService.closeValve(rpi, genericCallBack)))

    // Set a subscription to listen every event received
    treated.subscribe(({ pulses, counter }) => {
        console.warn('Flux:', pulses, 'Volume:', pulses * pulsePerMl)
    })
}

rpiService.init()
    .then(rpi => {
        console.info('Press CTRL + C to end program')

        keypress.subscribe(([event, key]) => {
            switch (event) {
                case '\r':
                    // Emit node event to simulate IO with delay	
                    mock.emit('change', [13, true])
                    break

                case '1':
                    // Manualy open the valve
                    rpiService.openValve(rpi, genericCallBack)
                    break

                case '2':
                    // Manualy close the valve
                    rpiService.closeValve(rpi, genericCallBack)
                    break

                case ' ':
                    // Pour 300 ml
                    pour(rpi, { pulsePerMl: 0.11, mlRestriction: 300 })
                    break

                case 't':
                    // Pour 10 ml
                    pour(rpi, { pulsePerMl: 0.11, mlRestriction: 10 })
                    break

                case '\u0003':
                    // CTRL + C to exit
                    rpiService.closeValve(rpi, genericCallBack)
                    process.exit()
                default: console.log(JSON.stringify(key))
            }
        });


    })
    .catch(err => console.error(err))
