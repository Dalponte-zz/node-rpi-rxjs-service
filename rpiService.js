const { Observable, fromEvent, Subject } = require('rxjs');
const { scan, map, finalize, reduce } = require('rxjs/operators');
var gpio = require('rpi-gpio');

VALVE_CHANNEL = 11
FLUX_CHANNEL = 13

const fluxometerObserver = () => {
    let pulses = 0
    const observable = fromEvent(gpio, 'change')
    gpio.setup(FLUX_CHANNEL, gpio.DIR_IN, gpio.EDGE_BOTH);
    return observable.pipe(
        map(([channel, value]) => {
            pulses++
            const volume = pulses * 0.110
            return { channel, value, pulses, volume }
        }),
    );
}

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

const valveSubject = () => {
    return new Promise((resolve, reject) => {
        gpio.setup(VALVE_CHANNEL, gpio.DIR_LOW, err => {
            if (err) throw reject(err)
            closeValve(gpio, () => console.warn('Close valve as workaround for initial state bug'))

            const valveSubject = new Subject().pipe(
                map(({ channel, value }) => {
                    if (channel === VALVE_CHANNEL && value === false)
                        openValve(gpio, (item) => console.warn('OPEN', item))
                    else if (channel === VALVE_CHANNEL && value === true)
                        closeValve(gpio, (item) => console.warn('CLOSE', item))
                    return { channel, value, valveClosed: false }
                }),
                finalize(() => closeValve(gpio, (gpio,
                    (item) => console.warn('FINISH', item))
                ))
            )
            resolve(valveSubject)
        });
    })
}

module.exports = {
    fluxometerObserver,
    valveSubject,
}