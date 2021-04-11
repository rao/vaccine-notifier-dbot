import axios from "axios"
import fetch, { Response } from "node-fetch"
require("dotenv").config();

const DISCORD_WEBHOOK: string | undefined = process.env.DISCORD_WEBHOOK;
let validProviderList: RawProvider [] = [];
let firstRun: boolean = true;

interface RawProvider {
  providerId: number;
  providerName: string;
  vaccineBrand: string;
  address: string;
  availableAppointments: string;
  isShowable: boolean;
}

interface Field {
  name: string;
  value: string;
}

interface NYCGovSiteResponse {
  providerList: RawProvider [];
  lastUpdated: string;
}

interface CVSSiteResponse {
  responseMetaData: {
    statusCode: string;
    statusDesc: string;
    conversationID: string;
    refId: string;
  }
}

const checkForChanges = async () => {
  const nycGovWebsite: NYCGovSiteResponse = await checkNYCGovSite();
  const cvsWebsite: CVSSiteResponse = await checkCVSSite();
  const fields: Field [] = [];

  console.log("-> Checking for changes...");

  const updatedValidProviderList: RawProvider [] = nycGovWebsite.providerList.filter(
    (provider: RawProvider) => provider.availableAppointments === "Y"
  );

  for (let validProvider of updatedValidProviderList) {
    fields.push({
      name: `${validProvider.providerName} - Offering ${validProvider.vaccineBrand}`,
      value: `Location: ${validProvider.address}`,
    });
  }

  if (validProviderList.length !== updatedValidProviderList.length) {
    let status: string = "";

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

    console.log(`-> Alert: Difference in provider list!`);
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

const checkNYCGovSite = async (): Promise<NYCGovSiteResponse> => {
  try {
    const response: Response = await fetch(
      "https://am-i-eligible.covid19vaccine.health.ny.gov/api/list-providers",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "en-US,en;q=0.9",
        },
        method: "GET",
      }
    );
    return await response.json();
  } catch (err) {
    throw new Error("Invalid response " + err);
  }
};

const checkCVSSite = async (): Promise<CVSSiteResponse> => {
  try {
    const response: Response = await fetch(
      "https://www.cvs.com/Services/ICEAGPV1/immunization/1.0.0/getIMZStores",
      {
        headers: {
          accept: "application/json",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "application/json",
        },
        body:
          '{"requestMetaData":{"appName":"CVS_WEB","lineOfBusiness":"RETAIL","channelName":"WEB","deviceType":"DESKTOP","deviceToken":"7777","apiKey":"a2ff75c6-2da7-4299-929d-d670d827ab4a","source":"ICE_WEB","securityType":"apiKey","responseFormat":"JSON","type":"cn-dep"},"requestPayloadData":{"selectedImmunization":["CVD"],"distanceInMiles":50,"imzData":[{"imzType":"CVD","ndc":["59267100002","59267100003"],"allocationType":"1"}],"searchCriteria":{"addressLine":"11102"}}}',
        method: "POST",
      }
    );
    return await response.json();
  } catch (err) {
    throw new Error("Invalid response " + err);
  }
};

checkForChanges();

setInterval(() => {
  checkForChanges();
}, 60 * 1000);