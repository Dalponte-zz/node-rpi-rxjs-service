var gpio = require('rpi-gpio').promise;
const readline = require('readline')
const { fromEvent, interval } = require('rxjs')

readline.emitKeypressEvents(process.stdin)
process.stdin.setRawMode(true)
const keypress = fromEvent(process.stdin, 'keypress')

const CH_1 = 11
const CH_2 = 15
const CH_3 = 29
const CH_4 = 31

console.log(
    gpio.DIR_IN,
    gpio.DIR_LOW,
    gpio.DIR_HIGH,
    gpio.EDGE_BOTH,
)

console.info(`------------------
\'- Setup ${CH_1} ${gpio.DIR_LOW}
1- True
2- False
3- 2s interval
q- Limpa portas
------------------`)

let s 
let state = true
const init = async () => {
    try {
        await gpio.setup(CH_1, gpio.DIR_LOW)
        await gpio.setup(CH_2, gpio.DIR_LOW)
        await gpio.setup(CH_3, gpio.DIR_HIGH)
        await gpio.setup(CH_4, gpio.DIR_LOW)

        keypress.subscribe(async ([event, key]) => {
            switch (event) {
                case '\'':
                    await gpio.setup(CH_1, gpio.DIR_LOW)
                    await gpio.setup(CH_2, gpio.DIR_HIGH)
                    await gpio.setup(CH_3, gpio.DIR_HIGH)
                    await gpio.setup(CH_4, gpio.DIR_LOW)
                    break
                case '1':
                    const open = await gpio.write(CH_1, true)
                    console.log(CH_1, true, 'OPEN', open)
                    break
                case '2':
                    const close = await gpio.write(CH_1, false)
                    console.log(CH_1, false, 'CLOSE',  close)
                    break
                case '3':
                    s = interval(2000)
                    s.subscribe(async (t) => {
                        gpio.write(CH_1, state)
                        console.log(CH_1, state, t)
                        gpio.write(CH_2, state)
                        console.log(CH_2, state, t)

                        gpio.write(CH_3, state)
                        gpio.write(CH_4, !state)

                        state = !state
                    }) 
                    break
                case 'q':
                    const d = await gpio.destroy()
                    console.log(d)
                    break
                case '\u0003': // CTRL C termina aplicação
                    // CTRL + C to exit
                    gpio.destroy()
                    process.exit()
            }
        });
    } catch (e) {
        gpio.destroy()
        console.log('[ERROR] =>', e.message)
        process.exit()
    }
}
init()
