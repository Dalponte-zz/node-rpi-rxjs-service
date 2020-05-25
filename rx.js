const gpioController = require('rpi-gpio')
const gpioPromiseController = require('rpi-gpio').promise
const readline = require('readline')
// RxJS v6+
const {Observable, fromEvent, Subject, interval, timer} = require('rxjs');
const {first, skip, debounce, map, finalize, filter, throttle, switchMap, multicast} = require('rxjs/operators');

// Test files
const mockEvent = require('./mockEvent')
readline.emitKeypressEvents(process.stdin)
process.stdin.setRawMode(true)
const keypress = fromEvent(process.stdin, 'keypress')
gpioPromiseController.setup(37, gpioPromiseController.DIR_HIGH)
// gpioPromiseController.setup(29, gpioPromiseController.DIR_IN, gpioPromiseController.EDGE_BOTH)

const FLOWMETER = 29
const RELE = 11

const LED_RED = 18
const LED_GREEN = 15
const LED_BLUE = 16

const setup = (prGpio) => {
    console.log('[SETUP] => ')
    return Promise.all([
        prGpio.setup(FLOWMETER, prGpio.DIR_IN, prGpio.EDGE_BOTH),
        prGpio.setup(RELE, prGpio.DIR_HIGH),
        prGpio.setup(LED_RED, prGpio.DIR_HIGH),
        prGpio.setup(LED_GREEN, prGpio.DIR_LOW),
        prGpio.setup(LED_BLUE, prGpio.DIR_LOW),
    ])
}

const start = async (prGpio) => {
    console.log('[START] => ')
    return Promise.all([
        prGpio.write(RELE, false),
        prGpio.write(LED_RED, false),
        prGpio.write(LED_GREEN, true),
    ])
}
const stop = async (prGpio) => {
    console.log('[STOP] => ')
    return Promise.all([// gpioPromiseController.setup(29, gpioPromiseController.DIR_HIGH)

        prGpio.write(RELE, true),
        prGpio.write(LED_RED, true),
        prGpio.write(LED_GREEN, false),
    ])
}

const flowmeterPipe = (gpio, {pulseMlFactor, pulseTolerance}) => {
    let pulses = 0
    return fromEvent(gpio, 'change').pipe(
        skip(pulseTolerance),
        map(([channel, value]) => {
            pulses++
            const volume = Math.trunc(pulses * pulseMlFactor)
            console.log('[FLOW] => ', channel, value, pulses, volume )
            return {channel, value, pulses, volume}
        }),
        throttle(val => interval(50)),
        finalize(() => stop),
    );
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
//*/

const options = {
    pourDebounceTime: 5000,
    pourTimeoutTime: 7000,
    pulseMlFactor: 0.146,
    pulseTolerance: 5
}

const consumptionObservable  = (gpio, prGpio, {id, limitAmount}) => {
    return new Observable(subscriber => {
        start(prGpio)
        const f = flowmeterPipe(gpioController, options)
        const sub = f.subscribe(payload => {
            if (payload.volume >= limitAmount) {
                console.log('[FINISH] => ', payload)

                stop(prGpio)
                subscriber.next({
                    channel: 'FINISHED',
                    payload: {
                        consumptionBeginId: id, 
                        totalAmount: payload.volume
                    }
                })
                subscriber.complete()
            } else {
                subscriber.next({channel: 'FLOW', payload})
            }
        })

        const db = f.pipe(
            debounce(() => interval(options.pourDebounceTime)),
            first(),
        ).subscribe(payload => {
            console.log('[DEBOUNCE] => ', payload)
            sub.complete()
            subscriber.next({channel: 'DEBOUNCE', payload: {
                consumptionBeginId: id, 
                totalAmount: payload.volume
            }})
            stop(prGpio)
            subscriber.complete()
        })
    })
}

const pourHandler = (gpio, prGpio) => {
    return ({event: interface, consumptionBegin}) => {
        const consumption = consumptionObservable(gpio, prGpio, consumptionBegin)
            .subscribe(({event, payload}) => {
            interface.sender.send(event, payload)
        }, (err) => {
            console.error('[ERROR] => ', err)
        }, () => { // <----
            console.log('[FINALIZED] =====> ')
        })
    }
}

/*
const pourVolume = ({app, valve, flowMeter}) => (event, {id, limitAmount, code}) => {
    if (!limitAmount) {
      throw new Error('Invalid Amount')
    }
    const flux = gpioController.setupFlowMeter(flowMeter)
  
    const listen = flux.subscribe(payload => {
      event.sender.send('FLOW', {...payload, id, limitAmount});
      console.warn(payload)
      if (payload.volume >= limitAmount) {
        listen.unsubscribe()
        valve.next({action: gpioController.CLOSE_VALVE})
        console.log('[4] ===> ', 'Valve CLOSED. ==> Served: ', payload.volume, ' mls')
  
        const metrics = app.getAppMetrics()
        event.sender.send('FINISHED', {consumptionBeginId: id, totalAmount: payload.volume, code, metrics});
      }
    })
  
    flux.pipe(
      debounce(() => interval(11000))
    ).subscribe(payload => {
      console.log('[DEBOUNCE] ==> Consumo terminado por Debounce', listen)
      valve.next({action: gpioController.CLOSE_VALVE})
      listen.unsubscribe()
      event.sender.send('DEBOUNCE', {consumptionBeginId: id, totalAmount: payload.volume, code, metrics: {}});
    });
  
    valve.next({action: gpioController.OPEN_VALVE})
    console.log('[3] ===> ', 'Valve OPEN ==> Serving ', limitAmount, ' mls')
  }
*/


const init = async () => {
    try {
        await setup(gpioPromiseController)
        /* 

        const s = new Subject()
        const handler = pourHandler(gpioController, gpioPromiseController)
        s.subscribe(handler)


        const control = s.pipe(
            switchMap(() => flowmeterPipe(gpioController)),
        ).subscribe((payload, i) => {
            console.log('[FLOW]', payload)
        })
        //*/

        keypress.subscribe(async ([event, key]) => {
            switch (event) {
                case '1':
//                    control.next({id: 10, limitAmount: 100, date: (new Date()).getMinutes()})
                    break
                case '2':
                    const s = new Subject()
                    const c = consumptionObservable(gpioController, gpioPromiseController,  {
                        id: 10, 
                        limitAmount: 10, 
                        date: (new Date()).getMinutes()
                    })

                    s.pipe(
                        switchMap(() => c)
                    ).subscribe(({channel, payload}) => {
                        mockEvent.sender.send(event, payload)
                    }, (err) => {
                        stop(gpioPromiseController)
                        s.complete()
                        console.error('[ERROR] => ', err)
                    }, () => { // <----
                        stop(gpioPromiseController)
                        s.complete()
                        console.log('[FINALIZED] =====> ')
                    })
                    s.next()
                    break

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
        console.log('[ERROR] =>', e)
        process.exit()
    }
}
init()

/*
fromEvent(gpioController, 'change').subscribe((payload) => { 
    console.log(payload)
    gpioPromiseController.write(LED_BLUE, !payload[1])
}) //*/
