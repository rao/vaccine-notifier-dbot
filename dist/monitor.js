"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var axios_1 = require("axios");
var node_fetch_1 = require("node-fetch");
require("dotenv").config();
var DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
var validProviderList = [];
var firstRun = true;
var checkForChanges = function () { return __awaiter(void 0, void 0, void 0, function () {
    var nycGovWebsite, cvsWebsite, fields, updatedValidProviderList, _i, updatedValidProviderList_1, validProvider, status_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, checkNYCGovSite()];
            case 1:
                nycGovWebsite = _a.sent();
                return [4 /*yield*/, checkCVSSite()];
            case 2:
                cvsWebsite = _a.sent();
                fields = [];
                console.log("-> Checking for changes...");
                updatedValidProviderList = nycGovWebsite.providerList.filter(function (provider) { return provider.availableAppointments === "Y"; });
                for (_i = 0, updatedValidProviderList_1 = updatedValidProviderList; _i < updatedValidProviderList_1.length; _i++) {
                    validProvider = updatedValidProviderList_1[_i];
                    fields.push({
                        name: validProvider.providerName + " - Offering " + validProvider.vaccineBrand,
                        value: "Location: " + validProvider.address
                    });
                }
                if (validProviderList.length !== updatedValidProviderList.length) {
                    status_1 = "";
                    if (firstRun) {
                        console.log("-> First time run.");
                        firstRun = false;
                        validProviderList = updatedValidProviderList;
                        axios_1["default"]({
                            method: "post",
                            url: DISCORD_WEBHOOK,
                            headers: { "Content-type": "application/json" },
                            data: {
                                embeds: [
                                    {
                                        title: "Initial Vaccine List",
                                        description: "[Link To Form's Website](https://am-i-eligible.covid19vaccine.health.ny.gov/)",
                                        color: 1942002,
                                        fields: fields,
                                        timestamp: new Date()
                                    },
                                ]
                            }
                        });
                        return [2 /*return*/];
                    }
                    console.log("-> Alert: Difference in provider list!");
                    validProviderList = updatedValidProviderList;
                    if (updatedValidProviderList.length < validProviderList.length) {
                        status_1 = "-> Appointments have been booked ❌";
                        console.log('Appointments booked');
                    }
                    else if (updatedValidProviderList.length > validProviderList.length) {
                        status_1 = "-> Appointments have been added ✅";
                        console.log('Appointments added');
                    }
                    axios_1["default"]({
                        method: "post",
                        url: DISCORD_WEBHOOK,
                        headers: { "Content-type": "application/json" },
                        data: {
                            embeds: [
                                {
                                    title: "Updated Vaccine List " + status_1,
                                    description: "[Link To Form's Website](https://am-i-eligible.covid19vaccine.health.ny.gov/)",
                                    color: 1942002,
                                    fields: fields,
                                    timestamp: new Date()
                                },
                            ]
                        }
                    });
                }
                if (!(cvsWebsite.responseMetaData.statusDesc ===
                    "No stores with immunizations found")) {
                    axios_1["default"]({
                        method: "post",
                        url: DISCORD_WEBHOOK,
                        headers: { "Content-type": "application/json" },
                        data: {
                            embeds: [
                                {
                                    title: "Updated Vaccine List",
                                    description: "[Link To Form's Website](https://www.cvs.com/immunizations/covid-19-vaccine)",
                                    color: 1942002,
                                    fields: [
                                        {
                                            name: "Appointments have been made available at CVS."
                                        },
                                    ],
                                    timestamp: new Date()
                                },
                            ]
                        }
                    });
                }
                return [2 /*return*/];
        }
    });
}); };
var checkNYCGovSite = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, node_fetch_1["default"]("https://am-i-eligible.covid19vaccine.health.ny.gov/api/list-providers", {
                        headers: {
                            accept: "application/json, text/plain, */*",
                            "accept-language": "en-US,en;q=0.9"
                        },
                        method: "GET"
                    })];
            case 1:
                response = _a.sent();
                return [4 /*yield*/, response.json()];
            case 2: return [2 /*return*/, _a.sent()];
            case 3:
                err_1 = _a.sent();
                throw new Error("Invalid response " + err_1);
            case 4: return [2 /*return*/];
        }
    });
}); };
var checkCVSSite = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, node_fetch_1["default"]("https://www.cvs.com/Services/ICEAGPV1/immunization/1.0.0/getIMZStores", {
                        headers: {
                            accept: "application/json",
                            "accept-language": "en-US,en;q=0.9",
                            "content-type": "application/json"
                        },
                        body: '{"requestMetaData":{"appName":"CVS_WEB","lineOfBusiness":"RETAIL","channelName":"WEB","deviceType":"DESKTOP","deviceToken":"7777","apiKey":"a2ff75c6-2da7-4299-929d-d670d827ab4a","source":"ICE_WEB","securityType":"apiKey","responseFormat":"JSON","type":"cn-dep"},"requestPayloadData":{"selectedImmunization":["CVD"],"distanceInMiles":50,"imzData":[{"imzType":"CVD","ndc":["59267100002","59267100003"],"allocationType":"1"}],"searchCriteria":{"addressLine":"11102"}}}',
                        method: "POST"
                    })];
            case 1:
                response = _a.sent();
                return [4 /*yield*/, response.json()];
            case 2: return [2 /*return*/, _a.sent()];
            case 3:
                err_2 = _a.sent();
                throw new Error("Invalid response " + err_2);
            case 4: return [2 /*return*/];
        }
    });
}); };
checkForChanges();
setInterval(function () {
    checkForChanges();
}, 60 * 1000);
