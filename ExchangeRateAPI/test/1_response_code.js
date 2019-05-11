var chakram = require('chakram'),
    expect = chakram.expect,
    XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest,
    assert = require('chai').assert,
    allRatesUrl = "https://blockchain.info/ticker",
    defaultCurrency = "AUD",
    allCurrencies = ["USD", "JPY", "CNY", "SGD","HKD", "CAD", "NZD"
                    ,"AUD", "CLP", "GBP", "DKK","SEK", "ISK", "BRL"
                    , "EUR", "RUB", "PLN", "THB", "KRW", "TWD"];

function getResponse(url){
    var xmlHttpRequest = new XMLHttpRequest();
    xmlHttpRequest.open("GET",url,false);
    xmlHttpRequest.send(null);

    return xmlHttpRequest.responseText;
}    

function getConvertToBtcValue(currency, value){
    var convertUrl = "https://blockchain.info/tobtc?currency="+currency+"&value="+value;
    return getResponse(convertUrl);       
}

function getAllRates(){
    var response = getResponse(allRatesUrl);

    return JSON.parse(response);
}

describe("Smoke", function() {
    it("Verify HTTP status 200", function () {
        return chakram.get(allRatesUrl)
          .then(function (response) {
            expect(response).to.have.header("content-type", "application/json;charset=UTF-8");
            expect(response).to.have.responsetime(3000);
            return expect(response).to.have.status(200);
        });
    });
});

describe("Currencies", function() {
    it("Verify if all available currencies are present", function () {
        var response = getResponse(allRatesUrl);
        for (var i = 0; i < allCurrencies.length; i++) {
            assert.include(response, allCurrencies[i], "Object contains currency");
        }
    });
});

describe("Converting", function() {
    it("Verify AUD converting", function () {
        var amount = 20000;
        var receivedResult = parseFloat(getConvertToBtcValue(defaultCurrency, amount));
        var calculatedResult = parseFloat(amount / getAllRates()[defaultCurrency].sell);

        return assert.closeTo(receivedResult, calculatedResult, 2, "Received and calculated values mismatch");
    });

    it("Verify error message for unsupported currency parameter", function () {
        var receivedResult = getConvertToBtcValue("XXX", 1);
        var expectedResult = "Parameter <currency> with unsupported symbol";
        return assert.equal(receivedResult, expectedResult, "Received error message mismatch");
    });

    it("Verify error message for unsupported amount parameter", function () {
        var receivedResult = getConvertToBtcValue(defaultCurrency, "X");
        var expectedResult = "Parameter <value> with invalid numerical value";
        return assert.equal(receivedResult, expectedResult, "Received error message mismatch");
    }); 
});



