const { of, Subscription, Observable, fromEvent, Subject, interval, BehaviorSubject } = require('rxjs');
const { takeLast, skip, map, takeWhile, timeoutWith, catchError, finalize, delay, isEmpty, count, timeout, first, filter, debounce, throttle, switchMap } = require('rxjs/operators');

const gpio = require('rpi-gpio')
const gpioPromise = require('rpi-gpio').promise


const OPEN_VALVE = false
const CLOSE_VALVE = true

const FLOWMETER = 29
const RELE = 11
const LED_RED = 18
const LED_GREEN = 15
const LED_BLUE = 16

module.exports = class PourProvider {
  constructor(
    gpioListener,
    gpioPromiseController,
    {
      flowPulseFactor,
      timeoutTime,
      debounceTime,
    }) {
    this.flowPulseFactor = flowPulseFactor
    this.timeoutTime = timeoutTime
    this.debounceTime = debounceTime
    this.gpioListener = gpioListener
    this.gpioCtrl = gpioPromiseController
  }

  async clean() {
    console.log('DESTROY!')
    return this.gpioCtrl.destroy()
  }

  async setup() {
    const gpioCtrl = this.gpioCtrl
    console.log('SETUP => ', FLOWMETER, RELE)
    return Promise.all([
      gpioCtrl.setup(FLOWMETER, gpioCtrl.DIR_IN, gpioCtrl.EDGE_BOTH),
      gpioCtrl.setup(RELE, gpioCtrl.DIR_HIGH),
      gpioCtrl.setup(LED_RED, gpioCtrl.DIR_HIGH),
      gpioCtrl.setup(LED_GREEN, gpioCtrl.DIR_LOW),
      gpioCtrl.setup(LED_BLUE, gpioCtrl.DIR_LOW),
    ])
  }

  async start() {
    const gpioCtrl = this.gpioCtrl
    console.log('START => ', RELE, LED_RED, LED_GREEN)
    return Promise.all([
      gpioCtrl.write(RELE, OPEN_VALVE),
      gpioCtrl.write(LED_RED, false),
      gpioCtrl.write(LED_GREEN, true),
    ])
  }
  async stop() {
    const gpioCtrl = this.gpioCtrl
    console.log('STOP => ', RELE, LED_RED, LED_GREEN)
    return Promise.all([
      gpioCtrl.write(RELE, CLOSE_VALVE),
      gpioCtrl.write(LED_RED, true),
      gpioCtrl.write(LED_GREEN, false),
    ])
  }

  consumptionHandler = async (event, { id, limitAmount, consumptionOrderId, meta }) => {
    const debounceTime = this.debounceTime,
      timeoutTime = this.timeoutTime,
      flowPulseFactor = this.flowPulseFactor
    console.log( id, '=> Config: ', { debounceTime, timeoutTime, flowPulseFactor })
    await this.start()

    let pulses = 0
    const flowMeter = this.gpioListener().pipe(
      skip(10),
      map(([pin, value], i) => {
        pulses++
        const volume = Math.trunc(pulses * flowPulseFactor)
        return { id, pin, value, pulses, volume }
      }),
      throttle(() => interval(100)),
    )
    
    
    const subscription = new Subscription()

    const dbObs = flowMeter.pipe(
      debounce(() => interval(debounceTime)),
      first()
    ).subscribe(async (payload) => {
      event.sender.send('DEBOUNCE', { ...payload, consumptionOrderId, meta })
      await this.stop()
      subscription.unsubscribe()
    })
    subscription.add(dbObs)

    const to = flowMeter.pipe(
      timeout(timeoutTime),
      first(),
    ).subscribe(
      null,
      async () => {
        event.sender.send('TIMEOUT', { id, pulses: 0, volume: 0, meta, consumptionOrderId })
        await this.stop()
        subscription.unsubscribe()
      }
    )
    subscription.add(to)

    subscription.add(flowMeter
      .subscribe(
        async  payload => {
          event.sender.send('FLOW', payload)

          if (payload.volume >= limitAmount) {
            event.sender.send('FINISHED', { ...payload, consumptionOrderId, meta })
            await this.stop()
            dbObs.unsubscribe()
            subscription.unsubscribe()
          }
        },
        async  err => {
          event.sender.send('ERROR', { error: err.message, consumptionOrderId, meta })
          await this.stop()
          subscription.unsubscribe()
        },
        async  () => {
          console.log('COMPLETE ===>')
          await this.stop()
          subscription.unsubscribe()
        }
      ))

  }
}
