const { fromEvent } = require('rxjs');
const { scan } = require('rxjs/operators');

VALVE_CHANNEL = 11
FLUX_CHANNEL = 13

const openValve = (callBack) => {
    return callBack({ channel: VALVE_CHANNEL })
}

const closeValve = (callBack) => {
    return callBack({ channel: VALVE_CHANNEL })
}

const listenChannel = ({ target }) => {
    const listener = fromEvent(target, 'change')
    return listener.pipe(
        scan(({ pulses }, { channel }) => {
            return { channel, pulses: pulses ? pulses + 1 : 1 }
        })
    )
}

module.exports = {
    openValve: openValve,
    closeValve: closeValve,
    listenChannel: listenChannel,
}