var chakram = require('chakram');
var expect = chakram.expect;
var assert = require('chai').assert;

const defaultCurrency = "AUD";
const TICKER_URL = "https://blockchain.info/ticker";
const TOTBC_URL = "https://blockchain.info/tobtc";
const  allCurrencies = ["USD", "JPY", "CNY", "SGD","HKD", "CAD", "NZD",
                        "AUD", "CLP", "GBP", "DKK","SEK", "ISK", "BRL",
                        "EUR", "RUB", "PLN", "THB", "KRW", "TWD", "CHF", "INR"]

describe("tobtc API", function() {
    
    chakram.addProperty("tobtc", function(){});
    chakram.addMethod("error", function (respObj, status, message) {
        expect(respObj).to.have.status(status);
        expect(respObj.body).to.equal(message);
    });

    describe("Smoke", function() {
        it("Verify HTTP status 200", function () {
            return chakram.get(TICKER_URL)
              .then(function (response) {
                expect(response).to.have.header("content-type", "application/json;charset=UTF-8");
                expect(response).to.have.responsetime(3000);
                expect(response).to.have.status(200);
            });
        });
    });

    describe("Currencies", function() {
        it("Verify if all available currencies are present", function () {
            return chakram
                .get(TICKER_URL)
                .then((allRates) => {
                    expect(Object.keys(allRates.body).sort()).to.eql(allCurrencies.sort());
                })
        });
    });

    describe("Converting", function() {
        it("Verify AUD converting", function () {
            var amount = 20000;
            return Promise.all([
                chakram.get(`${TOTBC_URL}?currency=${defaultCurrency}&value=${amount}`),
                chakram.get(TICKER_URL)
            ]).then (([convertedValue, allRates]) => {
                actResult = parseFloat(convertedValue.body);
                expResult = parseFloat(amount / allRates.body[defaultCurrency].sell);

                assert.closeTo(actResult, expResult, 2, "Received and calculated values mismatch");
            })
        });

        it("Verify error message for unsupported currency parameter", function () {
            var response = chakram.get("https://blockchain.info/tobtc?currency=XXX&value=1")
            return expect(response).to.be.tobtc.error(500, "Parameter <currency> with unsupported symbol");
        });

        it("Verify error message for unsupported amount parameter", function () {
            var response = chakram.get("https://blockchain.info/tobtc?currency=AUD&value=X")
            return expect(response).to.be.tobtc.error(500, "Parameter <value> with invalid numerical value");
        });
    });
})
