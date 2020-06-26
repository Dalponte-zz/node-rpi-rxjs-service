const { Subscription, interval } = require('rxjs');
const { skip, map, timeout, first, debounce, throttle } = require('rxjs/operators');

const OPEN_VALVE = false
const CLOSE_VALVE = true

const FLOWMETER = 16
const RELE = 18
const LED_RED = 11
const LED_GREEN = 13
const LED_BLUE = 15

module.exports = class PourProvider {
  constructor(
    gpioListener,
    gpioPromise,
    {
      flowPulseFactor,
      timeoutTime,
      debounceTime,
    }) {
    this.flowPulseFactor = flowPulseFactor
    this.timeoutTime = timeoutTime
    this.debounceTime = debounceTime
    this.gpioListener = gpioListener
    this.gpioCtrl = gpioPromise
  }

  async clean() {
    console.log('DESTROY!')
    return this.gpioCtrl.destroy()
  }

  async setup() {
    const gpioCtrl = this.gpioCtrl
    console.log('SETUP => flowmeter:', FLOWMETER, 'rele:', RELE)
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
    console.log('START => rele:', OPEN_VALVE, 'green led:', LED_GREEN)
    return Promise.all([
      gpioCtrl.write(RELE, OPEN_VALVE),
      gpioCtrl.write(LED_RED, false),
      gpioCtrl.write(LED_GREEN, true),
    ])
  }
  async stop() {
    const gpioCtrl = this.gpioCtrl
    console.log('STOP => rele:', CLOSE_VALVE, 'red led:', LED_RED)
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
    console.log( id, '=> Config: ', { limitAmount, debounceTime, timeoutTime, flowPulseFactor })
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

    subscription.add( flowMeter.pipe(
      debounce(() => interval(debounceTime))
    ).subscribe(async (payload) => {
      console.log('DEBOUNCE ==>', payload)
      event.sender.send('DEBOUNCE', { ...payload, consumptionOrderId, meta })
      await this.stop()
      subscription.unsubscribe()
    }))

    subscription.add( flowMeter.pipe(
      timeout(timeoutTime),
      first()
    ).subscribe(
      null,
      async () => {
        console.log('TIMEOUT ==>', id)
        event.sender.send('TIMEOUT', { id, pulses: 0, volume: 0, meta, consumptionOrderId })
        await this.stop()
        subscription.unsubscribe()
      }
    ))

    subscription.add(flowMeter.subscribe(
      async  payload => {
        event.sender.send('FLOW', payload)
        if (payload.volume >= limitAmount) {
          console.log('FINISHED ==>', payload)
          event.sender.send('FINISHED', { ...payload, consumptionOrderId, meta })
          await this.stop()
          subscription.unsubscribe()
        }
      },
      async  err => {
        console.log('ERROR ==>', err)
        event.sender.send('ERROR', { error: err.message, consumptionOrderId, meta })
        await this.stop()
        subscription.unsubscribe()
      }
    ))
  }
}
