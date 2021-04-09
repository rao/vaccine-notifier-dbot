// currently only monitoring 2 websites every minute

require("dotenv").config();
const axios = require("axios");
const fetch = require("node-fetch");
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

let validProviderList = [];
let updatedValidProviderList = [];
let firstRun = true;

const checkForChanges = async () => {
  const nycGovWebsite = await checkNYCGovSite();
  const cvsWebsite = await checkCVSSite();

  const fields = [];

  console.log("-> Checking for changes.");

  updatedValidProviderList = nycGovWebsite.providerList.filter(
    (provider) => provider.availableAppointments === "Y"
  );

  for (validProvider of updatedValidProviderList) {
    fields.push({
      name: `${validProvider.providerName} - Offering ${validProvider.vaccineBrand}`,
      value: `Location: ${validProvider.address}`,
    });
  }

  if (validProviderList.length !== updatedValidProviderList.length) {
    let status = "";

    if (firstRun) {
      console.log("-> First time run.");
      firstRun = false;
      validProviderList = updatedValidProviderList;
      axios({
        method: "post",
        url: DISCORD_WEBHOOK,
        headers: { "Content-type": "application/json" },
        data: {
          embeds: [
            {
              title: `Initial Vaccine List`,
              description: `[Link To Form's Website](https://am-i-eligible.covid19vaccine.health.ny.gov/)`,
              color: 1942002,
              fields: fields,
              timestamp: new Date(),
            },
          ],
        },
      });
      return;
    }

    console.log(`-> Alert: Difference in provider list.`);
    validProviderList = updatedValidProviderList;

    if (updatedValidProviderList.length < validProviderList.length) {
      status = "-> Appointments have been booked ❌";
      console.log('Appointments booked')
    } else if (updatedValidProviderList.length > validProviderList.length) {
      status = "-> Appointments have been added ✅";
      console.log('Appointments added')
    }

    axios({
      method: "post",
      url: DISCORD_WEBHOOK,
      headers: { "Content-type": "application/json" },
      data: {
        embeds: [
          {
            title: `Updated Vaccine List ${status}`,
            description: `[Link To Form's Website](https://am-i-eligible.covid19vaccine.health.ny.gov/)`,
            color: 1942002,
            fields: fields,
            timestamp: new Date(),
          },
        ],
      },
    });
  }

  if (
    !(
      cvsWebsite.responseMetaData.statusDesc ===
      "No stores with immunizations found"
    )
  ) {
    axios({
      method: "post",
      url: DISCORD_WEBHOOK,
      headers: { "Content-type": "application/json" },
      data: {
        embeds: [
          {
            title: `Updated Vaccine List`,
            description: `[Link To Form's Website](https://www.cvs.com/immunizations/covid-19-vaccine)`,
            color: 1942002,
            fields: [
              {
                name: "Appointments have been made available at CVS.",
              },
            ],
            timestamp: new Date(),
          },
        ],
      },
    });
  }
};

const checkNYCGovSite = async () => {
  try {
    const response = await fetch(
      "https://am-i-eligible.covid19vaccine.health.ny.gov/api/list-providers",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-US,en;q=0.9",
        },
        method: "GET",
        mode: "cors",
      }
    );
    return await response.json();
  } catch (err) {
    throw new Error("Invalid response " - err);
  }
};

const checkCVSSite = async () => {
  try {
    const response = await fetch(
      "https://www.cvs.com/Services/ICEAGPV1/immunization/1.0.0/getIMZStores",
      {
        headers: {
          accept: "application/json",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
        },
        referrer:
          "https://www.cvs.com/vaccine/intake/store/cvd-store-select/first-dose-select",
        body:
          '{"requestMetaData":{"appName":"CVS_WEB","lineOfBusiness":"RETAIL","channelName":"WEB","deviceType":"DESKTOP","deviceToken":"7777","apiKey":"a2ff75c6-2da7-4299-929d-d670d827ab4a","source":"ICE_WEB","securityType":"apiKey","responseFormat":"JSON","type":"cn-dep"},"requestPayloadData":{"selectedImmunization":["CVD"],"distanceInMiles":50,"imzData":[{"imzType":"CVD","ndc":["59267100002","59267100003"],"allocationType":"1"}],"searchCriteria":{"addressLine":"11102"}}}',
        method: "POST",
        mode: "cors",
      }
    );
    return await response.json();
  } catch (err) {
    throw new Error("Invalid response " - err);
  }
};

checkForChanges();

setInterval(() => {
  checkForChanges();
}, 60 * 1000);