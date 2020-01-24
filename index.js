const { fromEvent } = require('rxjs');
const readline = require('readline')
const EventEmitter = require('events')
const rpiService = require('./rpiService')

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true)
const keypress = fromEvent(process.stdin, 'keypress')

const genericCallBack = (r) => console.warn(' == Callback == ', r)

rpiService.init()
    .then(rpi => {
        console.info('Press CTRL + C to end program')

        keypress.subscribe(([event, key]) => {
            switch (event) {
                case '1':  // Manualy open the valve
                    rpiService.openValve(rpi, genericCallBack)
                    break

                case '2': // Manualy close the valve
                    rpiService.closeValve(rpi, genericCallBack)
                    break

                case ' ': // Start to listen events and acumulate

                    rpiService.openValve(rpi, () => genericCallBack)
                    const flow = rpiService.listenChannel(rpi)
                    flow.subscribe(({ pulses, counter}) => {
                        console.warn('Flux:', pulses, counter)
                        if (pulses >= 1000) {
                            rpiService.closeValve(rpi, () => process.exit())
                        }
                    })
                    break

                case '\u0003': process.exit()
                default: console.log(JSON.stringify(key))
            }
        });


    })
    .catch(err => console.error(err))
