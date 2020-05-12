var gpio = require('rpi-gpio').promise;
const readline = require('readline')
const { fromEvent, interval } = require('rxjs')

readline.emitKeypressEvents(process.stdin)
process.stdin.setRawMode(true)
const keypress = fromEvent(process.stdin, 'keypress')
console.info('CTRL+C - Terminar')

const P1 = 29
const P2 = 31
const P3 = 36

console.info('------------------'
+ '\n\'- Setup'
+ '\n1- PIN ' +  P1
+ '\n2- PIN ' +  P2
+ '\n3- PIN ' +  P3
+ '\n------------------')


let s1 = false
let s2 = false
let s3 = false

const init = async () => {
    try {
        keypress.subscribe(async ([event, key]) => {
            switch (event) {
                case '\'':
                    await gpio.setup(P1, gpio.DIR_LOW)
                    await gpio.setup(P2, gpio.DIR_LOW)
                    await gpio.setup(P3, gpio.DIR_LOW)
                    break
                case '1':
                    const r1 = await gpio.write(P1, s1)
                    s1 = !s1
                    console.log(P1, s1, r1)
                    break
                case '2':
                    const r2 = await gpio.write(P2, s2)
                    s2 = !s2
                    console.log(P2, s2, r2)
                    break
                case '3':
                    const r3 = await gpio.write(P3, s3)
                    s3 = !s3
                    console.log(P3, s3, r3)
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