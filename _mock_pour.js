const { interval } = require('rxjs');
const { map, filter } = require('rxjs/operators');
const events = require('events');

const PourProvider = require('./PourProvider')

const { mockEvent, mockGpioPromise } = require('./mock')

const consumption = {
    "meta": null,
    "id": 1067,
    "limitAmount": 300,
    "createdAt": "2020-05-25T13:24:45.269532+00:00",
    "consumption_order": {
        "id": 567,
        "tapId": 1,
        "createdAt": "2020-05-25T13:24:44.404696+00:00",
        "amount": 333,
        "client": {
            "id": 28,
            "name": "Zike",
            "credit_transactions_aggregate": {
                "aggregate": {
                    "sum": {
                        "value": 20
                    }
                }
            }
        }
    }
}

const provider = new PourProvider(
    () => interval(1).pipe(
        // delay(15000),
        filter((t) => {
            // return false // TIMEOUT
            return true // Default
            // return t < 2 || t > 7000 // DEBOUNCE
        }),
        map(() => [13, true])
    ),
    mockGpioPromise,
    {
        flowPulseFactor: 0.146,
        timeoutTime: 5000,
        debounceTime: 8000,
    }
)

var ipcMain = new events.EventEmitter();
ipcMain.on('AUTHENTICATED', provider.consumptionHandler)
ipcMain.emit('AUTHENTICATED', mockEvent, consumption)

interval(1000).subscribe((t) => {
    console.log('t: ', t)
})

interval(20000).subscribe((t) => {
    ipcMain.emit('AUTHENTICATED', mockEvent, { ...consumption, id: t + 1 })
})