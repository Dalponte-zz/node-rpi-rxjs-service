const gpioController = require('rpi-gpio')
const gpioPromiseController = require('rpi-gpio').promise
const readline = require('readline')
// RxJS v6+
const {Observable, fromEvent, Subject, interval, timer} = require('rxjs');
const {debounce, map, finalize, filter, throttle, switchMap, multicast} = require('rxjs/operators');

// Test files
readline.emitKeypressEvents(process.stdin)
process.stdin.setRawMode(true)
const keypress = fromEvent(process.stdin, 'keypress')

const FLOWMETER = 31
const RELE = 11

const LED_RED = 18
const LED_GREEN = 15
const LED_BLUE = 16

const setup = (prGpio) => {
    console.log('[SETUP] => ', RELE, LED_RED, LED_GREEN)
    return Promise.all([
        prGpio.setup(FLOWMETER, prGpio.DIR_IN, prGpio.EDGE_BOTH),
        prGpio.setup(RELE, prGpio.DIR_HIGH),
        prGpio.setup(LED_RED, prGpio.DIR_HIGH),
        prGpio.setup(LED_GREEN, prGpio.DIR_LOW),
        prGpio.setup(LED_BLUE, prGpio.DIR_LOW),
    ])
}

const start = async (prGpio) => {
    console.log('[START] => ', RELE, LED_RED, LED_GREEN)
    return Promise.all([
        prGpio.write(RELE, false),
        prGpio.write(LED_RED, false),
        prGpio.write(LED_GREEN, true),
    ])
}
const stop = async (prGpio) => {
    console.log('[STOP] => ', RELE, LED_RED, LED_GREEN)
    return Promise.all([
        prGpio.write(RELE, true),
        prGpio.write(LED_RED, true),
        prGpio.write(LED_GREEN, false),
    ])
}

const flowmeterPipe = (gpio) => {
    let pulses = 0
    console.log('[FLOWMETER] => ')
    return fromEvent(gpio, 'change').pipe(
        map(([channel, value]) => {
            pulses++
            const volume = Math.trunc(pulses * 0.146)
            console.log('[FLOW] => ', channel, value, volume, pulses)
            return {channel, value, pulses, volume}
        }),
        throttle(val => interval(50)),
        finalize(() => stop),
    );
}



const interfaceHandler = (event, payload) => {
    switch(event) {
        case 'FLOW': 
            console.log('{ interface } => ', event, payload)
            break
        case 'TIMEOUT': 
            console.log('{ interface } => ', event, payload)
            break
        case 'DEBOUNCE': 
            console.log('{ interface } => ', event, payload)
            break
        case '': 
            console.log('{ interface } => ', event, payload)
            break
        default:
            console.log('{ Eita carai } => ', event, payload)

    }
}

/*
const consumptionHandler = (gpio, prGpio) => {
    return async ({id, limitAmount}) => {
        const flowmeter = flowmeterPipe(gpio)
        await start(prGpio)

        flow.subscribe((payload) => {
            console.log(payload)
            if (payload.volume >= limitAmount) {
                // event.sender.send('FINISHED', { consumptionBeginId: id, totalAmount: payload.volume})
                stop(prGpio)
            }
        })

        const db = flowmeter.pipe(debounce(() => interval(3000)))
        db.subscribe(x => {
            interface.complete()
        });
    }
}
*/

const consumptionManager = (gpio, prGpio) => {
    return ({id, limitAmount}) => {
        return new Observable(s => {
            start(prGpio)
            const flowmeter = flowmeterPipe(gpio)

            flow = flowmeter.subscribe((payload) => {
                console.log(payload)
                if (payload.volume >= limitAmount) {
                    // event.sender.send('FINISHED', { consumptionBeginId: id, totalAmount: payload.volume})
                    stop(prGpio)
                }
            })

            const db = flowmeter.pipe(debounce(() => interval(3000)))
            db.subscribe(x => {
                console.log('FIM CARAI', x)
                s.complete()
            });
        });
    }
};

const init = async () => {
    try {
        setup(gpioPromiseController)

        keypress.subscribe(async ([event, key]) => {
            switch (event) {
                    // control.next({id: 10, limitAmount: 100})


                case 'z':
                    await start(gpioPromiseController)
                    break
                case 'x':
                    await stop(gpioPromiseController)
                    break
                case 'q':
                    gpioPromiseController.destroy()
                    break
                case '\u0003': // CTRL + C to exit
                    process.exit()
            }
        });
    } catch (e) {
        console.log('[ERROR] =>', e.message)
        process.exit()
    }
}
init()