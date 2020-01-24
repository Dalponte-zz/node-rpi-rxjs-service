# node-rpi-rxjs-service
Node service with rpi-gpio package and RxJs for GPIO control

### Instalation
`npm install`

### Run
`npm start`

Or especify file using node:

`node index.js`

## Instructions

In order to isolate and be possible to 
mock the event emitter from the GPIO 
there is a possibility to inject the 
context on the observe libs.

For example, In `index.js`:
```javascript
// Create a event emitter instance 
const mock = new EventEmitter();

// Pass the mocked event emmiter to the context
pour(mock, { pulsePerMl: 0.11, mlRestriction: 300 })

// Then, emit event as a GPIO channel would
mock.emit('change', [13, true])
```