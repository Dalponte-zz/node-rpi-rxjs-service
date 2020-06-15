const {Observable, fromEvent, Subject, interval} = require('rxjs');
const {map, finalize, filter, throttle} = require('rxjs/operators');
var gpio = require('rpi-gpio').promise;
var rpiGpio = require('rpi-gpio');


VALVE_CHANNEL = 11
FLUX_CHANNEL = 13

OPEN_VALVE = true
CLOSE_VALVE = false

const setupFlowMeter = (flowMeter) => {
  if (flowMeter) return flowMeter
  let pulses = 0
  const observable = fromEvent(rpiGpio, 'change')
  rpiGpio.setup(FLUX_CHANNEL, rpiGpio.DIR_IN, rpiGpio.EDGE_BOTH,
    (err) => console.log(`> Flowmeter on channel ${FLUX_CHANNEL} setup.`, err));
  return observable.pipe(
    map(([channel, value]) => {
      pulses++
      const volume = Math.trunc(pulses * 0.146)
      return {channel, value, pulses, volume}
    }),
    throttle(val => interval(50))
    // filter(({pulses}) => pulses % 8 === 0),
  );
}

const setValveState = (target, action) => {
  target.write(VALVE_CHANNEL, action, err => {
    if (err)
      console.error('VALVE_STATE_ERROR', err)
  });
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
