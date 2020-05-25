const {Observable, fromEvent, Subject, interval, BehaviorSubject} = require('rxjs');
const {map, finalize, filter, debounce, throttle, switchMap} = require('rxjs/operators');

const OPEN_VALVE = false
const CLOSE_VALVE = true

const FLOWMETER = 13
const RELE = 11
const LED_RED = 18
const LED_GREEN = 15
const LED_BLUE = 16

module.exports = class PourProvider {
  gpioChange

  constructor({
                flowPulseFactor,
                timeoutTime,
                debounceTime,
                gpioObservable,
                gpioPromiseController,
              }) {
    this.config = {
      flowPulseFactor: flowPulseFactor,
      timeoutTime: timeoutTime,
      debounceTime: debounceTime,
    }
    this.gpioChange = gpioObservable
    this.gpioCtrl = gpioPromiseController
  }

  async setup () {
    const gpioCtrl = this.gpioCtrl
    console.log('[SETUP] => ', FLOWMETER, RELE)
    return Promise.all([
      gpioCtrl.setup(FLOWMETER, gpioCtrl.DIR_IN, gpioCtrl.EDGE_BOTH),
      gpioCtrl.setup(RELE, gpioCtrl.DIR_HIGH),
      gpioCtrl.setup(LED_RED, gpioCtrl.DIR_HIGH),
      gpioCtrl.setup(LED_GREEN, gpioCtrl.DIR_LOW),
      gpioCtrl.setup(LED_BLUE, gpioCtrl.DIR_LOW),
    ])
  }

  async start () {
    const gpioCtrl = this.gpioCtrl
    console.log('[START] => ', RELE, LED_RED, LED_GREEN)
    return Promise.all([
      gpioCtrl.write(RELE, OPEN_VALVE),
      gpioCtrl.write(LED_RED, false),
      gpioCtrl.write(LED_GREEN, true),
    ])
  }
  async stop () {
    const gpioCtrl = this.gpioCtrl
    console.log('[STOP] => ', RELE, LED_RED, LED_GREEN)
    return Promise.all([
      gpioCtrl.write(RELE, CLOSE_VALVE),
      gpioCtrl.write(LED_RED, true),
      gpioCtrl.write(LED_GREEN, false),
    ])
  }

}
