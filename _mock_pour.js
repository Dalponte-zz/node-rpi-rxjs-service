const { interval } = require('rxjs');
const {delay, map, filter } = require('rxjs/operators');
const events = require('events');
const gpioPromise = require('rpi-gpio').promise

const PourProvider = require('./PourProvider')

const { mockEvent, mockGpioPromise } = require('./mock')

const consumption = {
    "meta": null,
    "id": 1067,
    "limitAmount": 100,
    "createdAt": "2020-05-25T13:24:45.269532+00:00",
    "consumption_order": {}
}

const provider = new PourProvider(
    () => interval(10).pipe(
        // delay(15000), // TIMEOUT
        filter((t) => {
            // return true // Default
            return t < 50 || t > 500 // DEBOUNCE
        }),
        map(() => [13, true])
    ),
    gpioPromise,
    {
        flowPulseFactor: 0.146,
        timeoutTime: 5000,
        debounceTime: 8000,
    }
)

const ipcMain = new events.EventEmitter()
ipcMain.on('AUTHENTICATED', provider.consumptionHandler)

provider.setup().then(async() => {
    ipcMain.emit('AUTHENTICATED', mockEvent, consumption)
})
interval(20000).subscribe((t) => {
    ipcMain.emit('AUTHENTICATED', mockEvent, { ...consumption, id: t + 1 })
})