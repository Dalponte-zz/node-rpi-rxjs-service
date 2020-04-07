const { fromEvent } = require('rxjs')
const readline = require('readline')
const gpioController = require('./gpioController')
const rfidController = require('./rfidController')
const mockEvent = require('./mockEvent')

const pourVolume = ({ valve, flowMeter }) => (event, { id, limitAmount, code }) => {
    const flux = gpioController.setupFlowMeter(flowMeter)
    const listen = flux.subscribe(payload => {
        event.sender.send('FLOW', payload)
        if (payload.volume >= limitAmount) {
            listen.unsubscribe()
            valve.next({ action: gpioController.CLOSE_VALVE }) // @TODO Change to symbol close_valve
            console.log('[4] ===> ', 'Valve CLOSED. ==> Served: ', payload.volume, ' mls')

            event.sender.send('FINISHED', { consumptionBeginId: id, totalAmount: payload.volume, code, metrics: [] })
        }
    })

    valve.next({ action: gpioController.OPEN_VALVE }) // @TODO Change to symbol close_valve
    console.log('[3] ===> ', 'Valve OPEN ==> Serving ', limitAmount, ' mls')
}

readline.emitKeypressEvents(process.stdin)
process.stdin.setRawMode(true)
const keypress = fromEvent(process.stdin, 'keypress')
console.info('Press CTRL + C to end program')
var v
var f
try {
    keypress.subscribe(async ([event, key]) => {
        switch (event) {
            case '1': // Inicializa porta da valvula
                v = await gpioController.setupValve()
                v.subscribe((item) => console.log(item))
                break

            case '2': // Abre valvula
                v.next({ action: gpioController.OPEN_VALVE })
                break

            case '3': // Fecha valvula
                v.next({ action: gpioController.CLOSE_VALVE })
                break

            case '4': // Termina controlador da válvula
                v.complete()
                break

            case '5': // Leitura do RFID apresentando na tela
                console.log('-> Lendo RFID uma vez')
                obs = rfidController.readOnce()
                console.warn(obs)
                obs.subscribe((payload) => {
                    console.log('LEU: ', payload)
                })
                break

            case '6': // Permanentemente ouvindo RFID e libera consumo de 50ml
                rfidController
                    .listen()
                    .subscribe(payload => {
                        console.log(payload)
                        gpioController.init().then(({ valve }) => {
                            pourVolume({ valve })(mockEvent, {id: 10, limitAmount: 50, code:  'UNDEFINED'})
                        })
                    })
                break

            case ' ': // Permanentemente começa a ouvir a porta do fluxometro
                f = gpioController.setupFlowMeter().subscribe(item => console.log(item))
                console.log('Start listening flowmeter')
                break;

            case 'x': // Para de ouvir a porta do fluxometro
                f.unsubscribe()
                console.log('Stop listening flowmeter')
                break;

            case '\r': // Libera 100ml usando 
                gpioController.init().then(({ valve }) => {
                    pourVolume({ valve })(mockEvent, 100, 'UNDEFINED')
                }).catch((err) => {
                    console.error('[ERROR] ===> It was not possible initialize the GPIO Controller!')
                    ipcMain.on('AUTHENTICATED', pourVolume({ valve: new Subject(), flowMeter: mock() }))
                })
                break

            case '\u0003': // CTRL C termina aplicação
                // CTRL + C to exit
                process.exit()

            default: console.log('NO ACTION. Available: 1,2,3,4," ",x,t,ENTER', JSON.stringify(key))
        }
    });
} catch (e) {
    console.log(e)
    process.exit()
}
