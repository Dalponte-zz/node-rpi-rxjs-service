const { interval} = require('rxjs')
const { map, filter, first } = require('rxjs/operators')
const Mfrc522 = require("mfrc522-rpi")
const SoftSPI = require("rpi-softspi")

const init = ( ) => {


const softSPI = new SoftSPI({
    clock: 23, // pin number of SCLK
    mosi: 19, // pin number of MOSI
    miso: 21, // pin number of MISO
    client: 24 // pin number of CS
  });
  
  // GPIO 24 can be used for buzzer bin (PIN 18), Reset pin is (PIN 22).
  // I believe that channing pattern is better for configuring pins which are optional methods to use.
  return new Mfrc522(softSPI).setResetPin(22)
}

const readOnce = () => {
    const rfid = init()
    const observable = interval(1000)

     return observable
        .pipe(
            map(() => {
                rfid.reset()
                let tag = rfid.findCard()
                if (!tag.status) {
                    console.log("Listening rfid")
                    return null
                }
                const tagCoded = rfid.getUid()
                const uid = tagCoded.data
                const memoryCapacity = rfid.selectCard(uid)

                return {
                    type: tag.bitSize,
                    tagCoded,
                    uid,
                    memoryCapacity
                }
            }),
            filter((tagInfo) => !!tagInfo),
            first(),
        )
}

const listen  = () => {
    const rfid = init()
    const observable = interval(1000)

     return observable
        .pipe(
            map(() => {
                rfid.reset();
                let tag = rfid.findCard();
                if (!tag.status) {
                    console.log("Listening rfid")
                    return null
                }
                const tagCoded = rfid.getUid()
                const uid = tagCoded.data
                const memoryCapacity = rfid.selectCard(uid)

                return {
                    type: tag.bitSize,
                    tagCoded,
                    uid,
                    memoryCapacity
                }
            }),
            filter((tagInfo) => !!tagInfo),
        )
}

module.exports = {
    init,
    readOnce,
    listen,
}