module.exports = {

    sender: { 
        send: (channel, payload) => {
            console.log('#', channel, '=>' , payload)
        }
    }

}
