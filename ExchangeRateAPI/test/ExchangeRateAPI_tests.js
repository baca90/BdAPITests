var chakram = require('chakram');
var expect = chakram.expect;
var assert = require('chai').assert;

const TICKER_URL = "https://blockchain.info/ticker";
const TOBTC_URL = "https://blockchain.info/tobtc";
const SYMBOL_ERROR = "Parameter <currency> with unsupported symbol";
const NUMERICAL_ERROR = "Parameter <value> with invalid numerical value";
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
            return chakram.get(TICKER_URL)
                .then(function(allRates) {
                    expect(Object.keys(allRates.body).sort()).to.eql(allCurrencies.sort());
                })
        });
    });

    describe("Converting", function() {

        it("Verify all currency converting", function () {
            var amount = 20000;
            var allRates = chakram.get(TICKER_URL);
            
            allCurrencies.forEach(function (curr){
                chakram.get(`${TOBTC_URL}?currency=${curr}&value=${amount}`)
                .then(function (result){
                    actResult = parseFloat(result.body);
                    expResult = parseFloat(amount / allRates.body[curr].sell);
                    assert.closeTo(actResult, expResult, 0.01, "Received and calculated values mismatch");
                })
            });
        });

        it("Verify error message for unsupported currency parameter", function () {
            var response = chakram.get("https://blockchain.info/tobtc?currency=XXX&value=1")
            return expect(response).to.be.tobtc.error(500, SYMBOL_ERROR);
        });

        it("Verify error message for unsupported amount parameter", function () {
            var response = chakram.get("https://blockchain.info/tobtc?currency=AUD&value=X")
            return expect(response).to.be.tobtc.error(500, NUMERICAL_ERROR);
        });

        it("Verify error message for both unsupported parameters", function () {
            var response = chakram.get("https://blockchain.info/tobtc?currency=X&value=X")
            return expect(response).to.be.tobtc.error(500, SYMBOL_ERROR);
        });

        it("Verify error message for out of range value parameter", function () {
            var amount = "99999999999999999999999999999999999999999999999999";
            var response = chakram.get(`https://blockchain.info/tobtc?currency=AUD&value=${amount}`);
            expect(amount.length).to.be.equal(50);
            return expect(response).to.be.tobtc.error(500, NUMERICAL_ERROR);
        });

        it("Verify result for almost out of range value parameter", function () {
            var amount = "9999999999999999999999999999999999999999999999999";
            var response = chakram.get(`https://blockchain.info/tobtc?currency=AUD&value=${amount}`);
            var actResult = parseFloat(response.body);

            chakram.get(TICKER_URL)
            .then(function(result){
                 var expResult = parseFloat(amount / result.body["AUD"].sell);
                 assert.closeTo(actResult, expResult, 0.01, "Received and calculated values mismatch");
            });

            expect(amount.length).to.be.equal(49);
            return expect(response).to.have.status(200);
        });
    });
})
