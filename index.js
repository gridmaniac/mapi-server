require('./modules/db')
require('./modules/server')
// require('./modules/thesaurus-converter')

const geocoder = require('./modules/geocoder')

async function test() {
    // const data = await geocoder.reverse({ lat: 6.69, lon: -1.62 })
    // const data = await geocoder.reverse({ lat: 56.84975, lon: 53.21308 })
    const data = await geocoder.search('Kumasi, Barekese')
    console.log(data)
}

// test()