const { fromEvent } = require('rxjs');
const readline = require('readline')
const EventEmitter = require('events')
const rpiService = require('./rpiService')

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true)
const keypress = fromEvent(process.stdin, 'keypress')

const genericCallBack = (r) => console.warn(' == Callback == ', r)

const pour = (rpi, { pulsePerMl, mlRestriction }) => {
    // Open valve
    rpiService.openValve(rpi, () => genericCallBack)

    // Get RxJs observable by the EventEmiter provided by the GPIO lib
    const flow = rpiService.listenChannel(rpi)

    // Set a subscription to listen every event received
    flow.subscribe(({ pulses, counter }) => {
        console.warn('Flux:', pulses, 'Volume:', pulses * pulsePerMl)
        if (pulses * pulsePerMl >= mlRestriction) {
            // Close the valve and finish when reached target volume
            rpiService.closeValve(rpi, () => process.exit())
        }
    })
}


rpiService.init()
    .then(rpi => {
        console.info('Press CTRL + C to end program')

        keypress.subscribe(([event, key]) => {
            switch (event) {
                case '1':
                    // Manualy open the valve
                    rpiService.openValve(rpi, genericCallBack)
                    break

                case '2':
                    // Manualy close the valve
                    rpiService.closeValve(rpi, genericCallBack)
                    break

                case ' ':
                    // Start to listen events and acumulate
                    pour(rpi, { pulsePerMl: 0.11, mlRestriction: 300 })
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
