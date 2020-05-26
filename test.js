const { fromEvent } = require('rxjs');
const { map } = require('rxjs/operators');

const gpio = require('rpi-gpio')
const gpioCtrl = require('rpi-gpio').promise

const { mockEvent, mockGpioPromise } = require('./mock')
const PourProvider = require('./PourProvider')
const provider = new PourProvider(
    () => interval(10),
    gpioCtrl,
    {
        flowPulseFactor: 0.146,
        timeoutTime: 5000,
        debounceTime: 8000,
    }
)
const CH1 = 29

const init = async () => {
    const change = fromEvent(gpio, 'change')

    change.subscribe((t) => {
        console.log(t)
    })
}


gpioCtrl.setup(CH1, gpioCtrl.DIR_IN, gpioCtrl.EDGE_BOTH),
provider.setup()
init()
setTimeout(async() => {
    await provider.start()
}, 1000)
setTimeout(async() => {
    await provider.stop()
}, 2000)
