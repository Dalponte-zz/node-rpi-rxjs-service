const { Observable, fromEvent } = require('rxjs');
const { scan, map } = require('rxjs/operators');
var gpio = require('rpi-gpio');

VALVE_CHANNEL = 11
FLUX_CHANNEL = 13

const openValve = (target, callBack) => {
    target.write(11, false, function (err) {
        if (err) throw err;
        callBack({ channel: VALVE_CHANNEL, action: 'open' })
    });
}

const closeValve = (target, callBack) => {
    target.write(11, true, function (err) {
        if (err) throw err;
        callBack({ channel: VALVE_CHANNEL, action: 'close' })
    });
}

const listenChannel = (target) => {
    const listener = fromEvent(target, 'change')
    return listener.pipe(
        scan(({ pulses }, [channel, value]) => {
            return { channel, value, pulses: pulses ? pulses + 1 : 1 }
        })
    )
}

const observeChannel = (target, condition) => {
    return new Observable(subscriber => {
        let pulses = 0
        const listener = fromEvent(target, 'change')
        listener.subscribe(([channel, value]) => {
            const payload = { channel, value, pulses: pulses++ }
            subscriber.next(payload)
            if (condition(payload)) subscriber.complete()
        })
    });
}

const init = () => {
    return new Promise((resolve, reject) => {
        gpio.setup(VALVE_CHANNEL, gpio.DIR_LOW, err => {
            if (err) reject(err)
            closeValve(gpio, () => console.warn('Close valve as workaround for initial state bug'))
            gpio.setup(FLUX_CHANNEL, gpio.DIR_IN, gpio.EDGE_BOTH);
            resolve(gpio)
        });
    })
}

module.exports = {
    init: init,
    openValve: openValve,
    closeValve: closeValve,
    listenChannel: listenChannel,
    observeChannel: observeChannel,
}