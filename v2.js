const { of, Observable, merge, fromEvent, Subject, interval, TestScheduler, ReactiveTest } = require('rxjs');
const { map, finalize, filter, debounce, throttle, catchError, switchMap, timeout, first } = require('rxjs/operators');
const { assert, expect } = require('chai')
const PourProvider = require('./PourProvider')

const consumption = {
    "meta": null,
    "id": 1067,
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
    {
        flowPulseFactor: 0.146,
        timeoutTime: 5000,
        debounceTime: 3000,
        gpioObservable: interval(10),
        gpioPromiseController: {
            DIR_IN: 'in',
            DIR_LOW: 'low',
            DIR_HIGH: 'high',
            EDGE_BOTH: 'both',
            setup: (pin, value, defaultValue = null) => {
                assert.typeOf(pin, 'number')
                assert.isString(value)
            },
            write: (pin, value) => {
                assert.typeOf(pin, 'number')
                assert.isBoolean(value)
            },
        }
    },
)

const handler = async (consumption) => {
    console.log(provider.gpioChange)

    let pulses = 0
    const flowMeter = interval(10).pipe(
        map(() => {
            return [13, true]
        }),
        map(([channel, value]) => {
            pulses++
            const volume = Math.trunc(pulses * 0.146)
            return { channel, value, pulses, volume }
        }),
        throttle(() => interval(100)),
        filter(({ volume }) => (volume < 50 || volume > 1000)),
        timeout(3000),
        catchError(error => of(`TIMEOUT!!!!`)),
    )

    const sub = merge(
        flowMeter, 
        flowMeter.pipe(
            debounce(() => interval(2000)),
            map(({ channel, value, pulses, volume }) => {
                throw Error({ channel, value, pulses, volume })
            }),
            catchError(error => of(`DEBOUNCE!!!!`)),
            first()
        )
    ).subscribe(
        ({ message, channel, value, pulses, volume }) => {
            console.log(consumption.id, '> ', volume, pulses)
            if (volume >= 100)
                sub.unsubscribe()
        },
        (t, e) => {
            console.log(' => ', t, e)
            const { message, channel, value, pulses, volume } = t
            console.log(consumption.id, '==================', 
            {channel, value, pulses, volume },
            JSON.stringify( message.message)    
            )
            sub.unsubscribe()
        },
        (t, e) => {
            console.log('COMPLETADO => ', consumption.id, e)
            sub.unsubscribe()
        },
    )
}



const s = new Subject()
s.subscribe(handler)
s.next(consumption)


setTimeout(() => 
    s.next({...consumption, id: 222}), 10000) // RFID identification


setTimeout(() => 
    s.next({...consumption, id: 111}), 20000) // RFID identification


/*/ ------------------------------------------------------
describe('PourProvider', () => {
  it('Construct', () => {
    const f = provider.flowmeterObservable()
    const s = f.subscribe((i) => {
      console.log(i)
      assert.typeOf(i, 'Object')
    })
    console.log(typeof s)

  })
})
// ------------------------------------------------------
before(async () =>  {
  try {
    await provider.setup()
  }catch (e) {
    console.error('ERROR => ', e)
    throw e
  }
})
//*/
