var gpio = require('rpi-gpio')
var gpiop = require('rpi-gpio').promise
const readline = require('readline')

const { fromEvent, interval } = require('rxjs')
const { map, finalize, filter, throttle } = require('rxjs/operators')

readline.emitKeypressEvents(process.stdin)
process.stdin.setRawMode(true)
const keypress = fromEvent(process.stdin, 'keypress')
console.info('----------------\n CTRL+C - Terminar\n----------------')


const listenPortChange = (port) => {
	let count = 0
	return fromEvent(gpio, 'change').pipe(
		map(([channel, value], pulses) => {
			console.log('CHANNEL: ', channel, 'PORT: ', port, value)
			count++
			const volume = Math.trunc(count * 0.146)
			return { port, count, pulses, volume, value}
		}),
		throttle(val => interval(50))
		// filter(({pulses}) => pulses % 8 === 0),
	);
}

const setup = () => {
	const flow = listenPortChange(FLOWMETER_CHANNEL)
	return flow.subscribe(async payload => {
		console.log('FLOW', payload)
		gpiop.write(LED_CHANNEL, payload.value)
	})
}

const FLOWMETER_CHANNEL = 13
const LED_CHANNEL = 15

let f

const init = async () => {
	try {
		await gpiop.setup(LED_CHANNEL, gpio.DIR_LOW)
		await gpiop.setup(11, gpio.DIR_LOW)
		await gpiop.setup(FLOWMETER_CHANNEL, gpiop.DIR_IN, gpiop.EDGE_BOTH)

			
		f = setup()

		keypress.subscribe(async ([event]) => {
			switch (event) {
				case '1':
					if (f) f.unsubscribe()
					f = setup()
					break
				case '2':
					gpio.on('change', async(ch, value) => {
						await gpiop.write(LED_CHANNEL, value)
						console.log(ch, value)
					})
					break
				case '\'':
					f.unsubscribe()
					break
				case 'q':
					gpiop.destroy()
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