const axios = require("axios")

module.exports.sendCodeTo = async function(phone) {
    try {
        const headers = {
            'content-type': 'application/json',
            'authorization': 'Token b8c7d886184fb586fad94150df249091f8cc79da',
            'x-rapidapi-host': 'd7-verify.p.rapidapi.com',
            'x-rapidapi-key': 'b92328ae24mshf3b019aed799526p1fe05cjsna0df21280b02',
            'accept': 'application/json',
            'useQueryString': true
        }

        const data = {
            expiry: 900,
            message: 'Your FiXpert code is {code}',
            mobile: phone,
            'sender_id': 'FiXpert'
        }
    
        const { data: result } = 
            await axios.post('https://d7-verify.p.rapidapi.com/send', data, { headers })

        return result['otp_id']
    } catch (e) {
        console.log(e.message)
    }  
}

module.exports.verifyCode = async function(code, id) {
    const headers = {
        'content-type': 'application/json',
        'authorization': 'Token b8c7d886184fb586fad94150df249091f8cc79da',
        'x-rapidapi-host': 'd7-verify.p.rapidapi.com',
        'x-rapidapi-key': 'b92328ae24mshf3b019aed799526p1fe05cjsna0df21280b02',
        'accept': 'application/json',
        'useQueryString': true
    }

    const data = {
        'otp_code': code,
        'otp_id': id
    }

    const { data: result } = 
        await axios.post('https://d7-verify.p.rapidapi.com/verify', data, { headers })

    if (result.status !== 'success')
        throw new Error('The SMS code is incorrect.')
}