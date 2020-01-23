var gpio = require('rpi-gpio');

const ml_per_pulse = 0.214
let pulse_count = 0, total_ml = 0

gpio.on('change', function(channel, value) {


		if(value) pulse_count++
		
		console.log({channel, pulse_count, value});	
	
});
gpio.setup(13, gpio.DIR_IN, gpio.EDGE_BOTH);
