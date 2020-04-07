const {Observable, fromEvent, Subject} = require('rxjs');
const {map, finalize, filter} = require('rxjs/operators');
var gpio = require('rpi-gpio');

VALVE_CHANNEL = 11
FLUX_CHANNEL = 13

OPEN_VALVE = true
CLOSE_VALVE = false

const setupFlowMeter = (flowMeter) => {
  if (flowMeter) return flowMeter
  let pulses = 0
  const observable = fromEvent(gpio, 'change')
  gpio.setup(FLUX_CHANNEL, gpio.DIR_IN, gpio.EDGE_BOTH,
    (err) => console.log(`> Flowmeter on channel ${FLUX_CHANNEL} setup.`, err));
  return observable.pipe(
    map(([channel, value]) => {
      pulses++
      const volume = Math.trunc(pulses * 0.11)
      return {channel, value, pulses, volume}
    }),
    // filter(({pulses}) => pulses % 8 === 0),
  );
}

const setValveState = (target, action) => {
  target.write(VALVE_CHANNEL, action, err => err || console.error('VALVE_STATE_ERROR', err));
}

const setupValve = () => {
  return new Promise((resolve, reject) => {
    gpio.setup(VALVE_CHANNEL, gpio.DIR_LOW, err => {
      if (err) throw reject(err)
      // Close valve as workaround for initial state bug
      setValveState(gpio, CLOSE_VALVE)

      const valveSubject = new Subject().pipe(
        map(({action}) => {
          if (action === OPEN_VALVE || action === CLOSE_VALVE)
            setValveState(gpio, action)
          return {valveClosed: false}
        }),
        finalize(() => setValveState(gpio, CLOSE_VALVE))
      )
      resolve(valveSubject)
    })
  })
}

const init = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const valve = await setupValve()
      console.log('[1] ===> ', 'Valve setup')
      valve.subscribe((payload) => {
        console.log('[valve] ===> ', 'changed: ', payload)
      })
      resolve({valve})
    } catch (e) {
      reject(e)
    }
  })
}

module.exports = {
  VALVE_CHANNEL,
  FLUX_CHANNEL,
  OPEN_VALVE,
  CLOSE_VALVE,
  init,
  setupFlowMeter,
  setupValve,
}
