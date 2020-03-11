module.exports = {

    sender: { 
        send: (channel, payload) => {
            console.log('[SENDER]', channel, payload)
        }
    }

}
