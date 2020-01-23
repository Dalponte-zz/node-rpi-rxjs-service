var gpio = require('rpi-gpio');

const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true)


const open = () => {
    gpio.write(11, false, function(err) {
        if (err) throw err;
        console.warn('[ ] The valve should be OPENED');
    });
}

const close = () => {
    gpio.write(11, true, function(err) {
        if (err) throw err;
        console.warn('[X] The valve should be CLOSED');
    });
}

const init  = async () => {

    gpio.setup(11, gpio.DIR_HIGH, open);

    process.stdin.on('keypress', (str, {sequence}) => {
        console.log('Key detected: ', sequence);

        if(sequence === '\r'){
            open()
        }   else if(sequence === 'q') {
            process.exit()
        }   else {
            close()
        }
    });

}
try{
    init()
}
catch(err) {
    process.exit()
}