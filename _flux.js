var gpio = require('rpi-gpio')
var gpiop = require('rpi-gpio').promise
const readline = require('readline')

const { fromEvent, interval } = require('rxjs')
const { map, finalize, filter, throttle } = require('rxjs/operators')

readline.emitKeypressEvents(process.stdin)
process.stdin.setRawMode(true)
const keypress = fromEvent(process.stdin, 'keypress')
console.info(' \' - Setup \n 1 - Open \n 2 - Close \n CTRL+C - Terminar')


const listenPortChange = (port) => {
	let count = 0
	return fromEvent(gpio, 'change').pipe(
		map(([channel, value], pulses) => {
			console.log('CHANNEL: ', channel, 'PORT: ', port)
			count++
			const volume = Math.trunc(count * 0.146)
			return { port, count, pulses, volume, value}
		}),
		throttle(val => interval(50))
		// filter(({pulses}) => pulses % 8 === 0),
	);
}

const FLOWMETER_CHANNEL = 15
const TEST_CHANNEL = 11

const init = async () => {
	try {
		keypress.subscribe(async ([event]) => {
			await gpiop.setup(TEST_CHANNEL, gpio.DIR_LOW)

			switch (event) {
				case '\'':
					await gpio.setup(FLOWMETER_CHANNEL, gpio.DIR_IN, gpio.EDGE_BOTH)
					const flow = listenPortChange(FLOWMETER_CHANNEL)
					flow.subscribe(payload => {
						console.log('FLOW', payload)
					})
					break
				case '1':
					gpiop.write(TEST_CHANNEL, true)
					break
				case '2':
					gpiop.write(TEST_CHANNEL, false)
					break
				case '3':
					await gpio.setup(13, gpio.DIR_IN, gpio.EDGE_BOTH)
					const t = listenPortChange(13)
					t.subscribe(payload => {
						console.log('TESTE', payload)
					})
					break
				case '0':
					gpio.destroy()
					break
				case '\u0003': // CTRL C termina aplicação
					// CTRL + C to exit
					gpio.destroy()
					process.exit()
			}
		});
	} catch (e) {
		gpio.reset()
		console.log(e)
		process.exit()
	}
}
init()