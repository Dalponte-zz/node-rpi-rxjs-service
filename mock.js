const { assert } = require('chai')

const mockEvent = {

    sender: { 
        send: (channel, payload) => {
            console.log('[', channel, '] ' , payload)
        }
    }

}

const mockGpioPromise = {
    DIR_IN: 'in',
    DIR_LOW: 'low',
    DIR_HIGH: 'high',
    EDGE_BOTH: 'both',
    setup: (pin, value, defaultValue = null) => {
        assert.typeOf(pin, 'number')
        assert.isString(value)
    },
    write: (pin, value) => {
        assert.typeOf(pin, 'number')
        assert.isBoolean(value)
    },
}

module.exports = {
    mockEvent,
    mockGpioPromise,
}