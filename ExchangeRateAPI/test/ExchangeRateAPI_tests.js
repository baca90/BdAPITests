var chakram = require('chakram');
var itParam = require('mocha-param');
var expect = chakram.expect;
var assert = require('chai').assert;

const DEF_CURRENCY = "USD";
const DEF_AMOUNT = 20000;
const TICKER_URL = "https://blockchain.info/ticker";
const TOBTC_URL = "https://blockchain.info/tobtc";
const SYMBOL_ERROR = "Parameter <currency> with unsupported symbol";
const NUMERICAL_ERROR = "Parameter <value> with invalid numerical value";
const NO_VALUE_ERROR = "Parameter <value> is missing";
const NO_CURRENCY_ERROR = "Parameter <currency> is missing";
const ADDITIONAL_VALUES = [-3000, 5326.4582];
const ALL_CURRENCIES = ["USD", "JPY", "CNY", "SGD","HKD", "CAD", "NZD",
                       "AUD", "CLP", "GBP", "DKK","SEK", "ISK", "BRL",
                       "EUR", "RUB", "PLN", "THB", "KRW", "TWD", "CHF", "INR"];

describe("tobtc API", function() {

    chakram.addProperty("tobtc", function(){});
    chakram.addMethod("error", function (respObj, status, message) {
        expect(respObj).to.have.status(status);
        expect(respObj.body).to.equal(message);
    });

    describe("Smoke", function() {
        it("Verify response parameters", function () {
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
                    expect(Object.keys(allRates.body).sort()).to.eql(ALL_CURRENCIES.sort());
                })
        });
    });

    describe("Converting", function() {

        var allRates = chakram.get(TICKER_URL);
        itParam("Verify ${value} converting", ALL_CURRENCIES, function(curr){
            chakram.get(`${TOBTC_URL}?currency=${curr}&value=${DEF_AMOUNT}`)
                .then(function (result){
                    actResult = parseFloat(result.body);
                    expResult = parseFloat(DEF_AMOUNT / allRates.body[curr].sell);
                    return assert.closeTo(actResult, expResult, 0.01, "Received and calculated values mismatch");
                })
        });

        itParam("Verify converting value: ${value}", ADDITIONAL_VALUES, function(value){
            chakram.get(`${TOBTC_URL}?currency=${DEF_CURRENCY}&value=${value}`)
                .then(function (result){
                    actResult = parseFloat(result.body);
                    expResult = parseFloat(DEF_AMOUNT / allRates.body[curr].sell);
                    return assert.closeTo(actResult, expResult, 0.01, "Received and calculated values mismatch");
                })
        });
       
        it("Verify error message for no amount parameter", function () {
            var response = chakram.get(`${TOBTC_URL}?currency=AUD`);
            return expect(response).to.be.tobtc.error(500, NO_VALUE_ERROR);
        });
       
        it("Verify error message for no currency parameter", function () {
            var response = chakram.get(`${TOBTC_URL}?value=500`);
            return expect(response).to.be.tobtc.error(500, NO_CURRENCY_ERROR);
        });

        it("Verify error message for unsupported currency parameter", function () {
            var response = chakram.get(`${TOBTC_URL}?currency=XXX&value=1`);
            return expect(response).to.be.tobtc.error(500, SYMBOL_ERROR);
        });

        it("Verify error message for unsupported amount parameter", function () {
            var response = chakram.get(`${TOBTC_URL}?currency=AUD&value=X`);
            return expect(response).to.be.tobtc.error(500, NUMERICAL_ERROR);
        });

        it("Verify error message for both unsupported parameters", function () {
            var response = chakram.get(`${TOBTC_URL}?currency=X&value=X`);
            return expect(response).to.be.tobtc.error(500, SYMBOL_ERROR);
        });

        it("Verify error message for out of range value parameter", function () {
            var amount = "99999999999999999999999999999999999999999999999999";
            var response = chakram.get(`${TOBTC_URL}?currency=AUD&value=${amount}`);
            expect(amount.length).to.be.equal(50);
            return expect(response).to.be.tobtc.error(500, NUMERICAL_ERROR);
        });

        it("Verify result for biggest supported value parameter", function () {
            var amount = "9999999999999999999999999999999999999999999999999";
            var response = chakram.get(`${TOBTC_URL}?currency=AUD&value=${amount}`);
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