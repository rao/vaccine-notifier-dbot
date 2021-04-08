const axios = require('axios');
const fetch = require('node-fetch')

const NYCGOV_SITE = 'https://am-i-eligible.covid19vaccine.health.ny.gov/';
const CVS_SITE = 'https://www.cvs.com/vaccine/intake/store/cvd-store-select/first-dose-select';
const DISCORD_WEBHOOK = 'https://discord.com/api/webhooks/829747507994820685/QNSrFXL7kPQxsmHPwRe2jkHklG0YoBrr58ZfVVBr6W4qq5x3jMs5gDWtx8-yq3CT5byi'

let validProviderList = []
let updatedValidProviderList = []
let firstRun = true

const checkForChanges = async () => {
    const nyc_gov_website = await checkNYCGovSite();
    const cvs_website = await checkCVSSite();
    let fields = []

    console.log('-> Checking for changes.')

    nyc_gov_website.providerList.forEach(provider => {
        if (provider.availableAppointments === 'Y') {
            updatedValidProviderList.push(provider)
        }
    })

    updatedValidProviderList.forEach((provider) => {
        fields.push({ name: `${provider.providerName} - Offering ${provider.vaccineBrand}`, value: `Location: ${provider.address}` })
    })

    if (validProviderList.length != updatedValidProviderList.length) {
        if (firstRun) {
            console.log('-> First time run.')
            firstRun = false
            validProviderList = updatedValidProviderList
            axios({
                method: 'post',
                url: DISCORD_WEBHOOK,
                headers: { "Content-type": "application/json" },
                data: {
                    embeds: [
                        {
                            title: `Initial Vaccine List`,
                            description: `[Link To Form's Website](https://am-i-eligible.covid19vaccine.health.ny.gov/)`,
                            color: 1942002,
                            fields: fields,
                            timestamp: new Date()
                        }
                    ]
                }
            })
        } else {
            console.log(`-> Alert: Difference in provider list.`)
            validProviderList = updatedValidProviderList

            axios({
                method: 'post',
                url: DISCORD_WEBHOOK,
                headers: { "Content-type": "application/json" },
                data: {
                    embeds: [
                        {
                            title: `Updated Vaccine List`,
                            description: `[Link To Form's Website](https://am-i-eligible.covid19vaccine.health.ny.gov/)`,
                            color: 1942002,
                            fields: fields,
                            timestamp: new Date()
                        }
                    ]
                }
            })
        }
    }

    updatedValidProviderList = []

    if (!(cvs_website.responseMetaData.statusDesc === 'No stores with immunizations found')) {
        console.log(cvs_website.responseMetaData.statusDesc)
        axios({
            method: 'post',
            url: DISCORD_WEBHOOK,
            headers: { "Content-type": "application/json" },
            data: {
                embeds: [
                    {
                        title: `Updated Vaccine List`,
                        description: `[Link To Form's Website](https://www.cvs.com/immunizations/covid-19-vaccine)`,
                        color: 1942002,
                        fields: [{
                            name: 'Appointments have been made available at CVS.'
                        }],
                        timestamp: new Date()
                    }
                ]
            }
        })
    }
}

const checkNYCGovSite = () => {
    return new Promise(async (resolve, reject) => {
        fetch("https://am-i-eligible.covid19vaccine.health.ny.gov/api/list-providers", {
            "headers": {
                "accept": "application/json, text/plain, */*",
                "accept-language": "en-US,en;q=0.9",
            },
            "method": "GET",
            "mode": "cors"
        }).then(response => {
            resolve(response.json())
        })
    })
}

const checkCVSSite = () => {
    return new Promise((resolve, reject) => {
        fetch("https://www.cvs.com/Services/ICEAGPV1/immunization/1.0.0/getIMZStores", {
            "headers": {
                "accept": "application/json",
                "accept-language": "en-US,en;q=0.9",
                "content-type": "application/json",
            },
            "referrer": "https://www.cvs.com/vaccine/intake/store/cvd-store-select/first-dose-select",
            "body": "{\"requestMetaData\":{\"appName\":\"CVS_WEB\",\"lineOfBusiness\":\"RETAIL\",\"channelName\":\"WEB\",\"deviceType\":\"DESKTOP\",\"deviceToken\":\"7777\",\"apiKey\":\"a2ff75c6-2da7-4299-929d-d670d827ab4a\",\"source\":\"ICE_WEB\",\"securityType\":\"apiKey\",\"responseFormat\":\"JSON\",\"type\":\"cn-dep\"},\"requestPayloadData\":{\"selectedImmunization\":[\"CVD\"],\"distanceInMiles\":50,\"imzData\":[{\"imzType\":\"CVD\",\"ndc\":[\"59267100002\",\"59267100003\"],\"allocationType\":\"1\"}],\"searchCriteria\":{\"addressLine\":\"11102\"}}}",
            "method": "POST",
            "mode": "cors"
        }).then(response => {
            resolve(response.json())
        })
    })
}

checkForChanges()

setInterval(() => {
    checkForChanges()
}, (60 * 1000))

// currently only monitoring 2 websites every minute