var gpio = require('rpi-gpio');
const readline = require('readline')
const { fromEvent } = require('rxjs')

readline.emitKeypressEvents(process.stdin)
process.stdin.setRawMode(true)
const keypress = fromEvent(process.stdin, 'keypress')

const VALVE_CHANNEL = 18
const TEST1_CHANNEL = 13

console.info('1 - LOW \n2 -HIGH \nz - true \nx - false \nA ; S; D\nCTRL+C - Terminar')

const cb = (err) => {
    if (err) {
        throw err
    }
    console.log(err)
}

const init = async () => {
    try {
        keypress.subscribe(async ([event, key]) => {
            switch (event) {
                case '1':
                    gpio.setup(VALVE_CHANNEL, gpio.DIR_LOW, cb)
                    break
                case '2':
                    gpio.setup(VALVE_CHANNEL, gpio.DIR_HIGH, cb)
                    break

                case 'z':
                    gpio.write(VALVE_CHANNEL, true, cb)
                    break
                case 'x':
                    gpio.write(VALVE_CHANNEL, false, cb)
                    break
                
                case 'a':
                    gpio.setup(TEST1_CHANNEL, gpio.DIR_HIGH, cb)
                    break
                case 's':
                    gpio.write(TEST1_CHANNEL, true, cb)
                    break
                case 'd':
                    gpio.write(TEST1_CHANNEL, false, cb)
                    break
                    
                
                case 'q':
                    gpio.destroy(cb)
                    break
                case '\u0003': // CTRL C termina aplicação
                    // CTRL + C to exit
                    gpio.destroy()
                    process.exit()
            }
        });
    } catch (e) {
        gpio.destroy(cb)
        console.log(e)
        process.exit()
    }
}
init()