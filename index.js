const { fromEvent } = require('rxjs');
const readline = require('readline')
const { init, setupFlowmeter, setupValve } = require('./rpiService')

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true)
const keypress = fromEvent(process.stdin, 'keypress')

const pour = async (mls) => {
    v = await setupValve()
    v.subscribe((payload) => {
        console.log('valve_changed', payload);
    })
    console.log('#1', 'Valve setup')
    const f = setupFlowmeter()
    console.log('#2', 'Fluxometer setup')
    v.next({ channel: 11, value: false })
    console.log('#3', 'Valve OPEN')
    const listen = f.subscribe(payload => {
        console.log('#', payload)
        if (payload.volume >= mls) {
            listen.unsubscribe()
            console.warn('#4', 'Reset valve and stop listen')
            v.complete()
        }
    })
}

let valve
let flux

console.info('Press CTRL + C to end program')
try {
    keypress.subscribe(async ([event, key]) => {
        switch (event) {

            case '1': // Initialization
                valve = await setupValve()
                valve.subscribe((item) => console.log(item))
                break

            case '2': // Open valve event
                valve.next({ channel: 11, value: false })
                break

            case '3': // Close valve event
                valve.next({ channel: 11, value: true }) // CLOSE VALVE
                break

            case '4': // Should close the valve
                valve.complete()
                break

            case ' ': // Listen the fluxometer event
                flux = setupFlowmeter().subscribe(item => console.log(item))
                console.log('Start listening flowmeter')
                break;

            case 'x': // Stop listening the fluxometer event
                flux.unsubscribe()
                console.log('Stop listening flowmeter')
                break;

            case 't': //
                pour(10)
                break

            case '\r': //
                pour(200)
                break

            case '\u0003':
                // CTRL + C to exit
                if (valve) valve.complete()
                process.exit()
            default: console.log(JSON.stringify(key))
        }
    });
} catch (e) {
    console.log(e)
    if (valve) valve.complete()
}
