const Soup = imports.gi.Soup;
const Signals = imports.signals;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const HttpHelper = Me.imports.http_helper.HttpHelper;

var APIProvider = new Lang.Class({
    Name: 'APIProvider',
    
    _init: function(api_key) {
        this.api_key = api_key;
        this.base_url = '';
    },

    get_check_api_key_url: function() {
        return '';
    },

    get_convert_url: function(from_currency, to_currency, amount) {
        return '';
    },

    get_result_from_json: function() {
        return -1;
    },

    is_api_key_valid_from_json: function() {
        return false;
    },

    get_api_key: function() {
        return this.api_key;
    },

    get_error_message: function(json) {
        return '';
    }
});

var CurrencyLayer = new Lang.Class({
    Name: 'CurrencyLayer',
    Extends: APIProvider,

    _init: function(api_key) {
        this.parent(api_key);
        this.base_url = 'http://www.apilayer.net/api/live?';
    },

    get_convert_url: function(from_currency, to_currency, amount) {
        this.from = from_currency;
        this.to = to_currency;
        this.amount = amount;

        return this.base_url 
            + 'access_key=' + this.api_key 
            + '&currencies=' + from_currency 
            + ',' + to_currency 
            + '&format=1';
    },

    get_check_api_key_url: function() {
        return this.base_url 
            + 'access_key=' + this.api_key;
    },

    get_result_from_json: function(json) {
        let quotes = json.quotes;
        return parseFloat(this.amount) * 
                parseFloat(quotes['USD' + this.to]) / 
                parseFloat(quotes['USD' + this.from]);
    },

    is_api_key_valid_from_json: function(json) {
        return json.success;
    },

    get_error_message: function(json) {
        return '';
    }
});

var OpenExchangeRates = new Lang.Class({
    Name: 'OpenExchangeRates',
    Extends: APIProvider,

    _init: function(api_key) {
        this.parent(api_key);
        this.base_url = 'https://openexchangerates.org/api/';

        this._get_plan();
    },

    get_convert_url: function(from_currency, to_currency, amount) {
        this.from = from_currency;
        this.to = to_currency;
        this.amount = amount;

        // if developer license or higher:
        if (this.plan !== 'Free') {
            return this.base_url 
                + 'convert'
                + '/' + amount
                + '/' + from_currency
                + '/' + to_currency
                + '?app_id=' + this.api_key;
        } else {
            // if no license at all:
            return this.base_url 
                + 'latest.json'
                + '?app_id=' + this.api_key;
        }
    },

    _get_plan: function() {
        
        var http_helper = new HttpHelper();
        http_helper.send_request(this.base_url 
            + 'usage.json'
            + '?app_id=' + this.api_key, 
            Lang.bind(this, function(json) {
                this.plan = json.data.plan.name;
            }));
    },

    get_check_api_key_url: function() {
        return this.base_url 
            + 'Symbol=' + 'EUR' + 'USD' 
            + '&_token=' + this.api_key;
    },

    get_result_from_json: function(json) {
        if (this.plan !== 'Free') {
            // if developer license or higher:
            return json.response;
        } else {
            // if no license at all:
            return json.rates[this.to] / json.rates[this.from] * this.amount;
        }
    },

    is_api_key_valid_from_json: function(json) {
        return json.Outcome === 'Success';
    },

    get_error_message: function(json) {
        return json.status + ': ' + json.description;
    }

});

var CurrencyConverterAPI = new Lang.Class({
    Name: 'CurrencyConverterAPI',
    Extends: APIProvider,

    _init: function(api_key) {
        this.parent(api_key);
        this.base_url = 'https://www.currencyconverterapi.com/api/v3/convert?';
    },

    get_convert_url: function(from_currency, to_currency, amount) {
        this.from = from_currency;
        this.to = to_currency;

        return this.base_url 
            + 'q=' + from_currency 
            + '_' + to_currency 
            + '&compact=ultra'
            + '&apiKey=' + this.api_key;
    },

    get_check_api_key_url: function() {
        return this.base_url 
            + '/others/usage?apiKey=' + this.api_key;
    },

    get_result_from_json: function(json) {
        return json[this.from + '_' + this.to];
    },

    is_api_key_valid_from_json: function(json) {
        return json.error === true;
    },

    get_error_message: function(json) {
        return json;
    }

});

var Xignite = new Lang.Class({
    Name: 'Xignite',
    Extends: APIProvider,

    _init: function(api_key) {
        this.parent(api_key);
        this.base_url = 'https://globalcurrencies.xignite.com/xGlobalCurrencies.json/';
    },

    get_convert_url: function(from_currency, to_currency, amount) {
        return this.base_url 
            + 'ConvertRealTimeValue'
            + '?From=' + from_currency
            + '&To=' + to_currency
            + '&Amount=' + amount;
    },

    get_check_api_key_url: function() {
        return this.base_url 
            + 'Symbol=' + 'EUR' + 'USD' 
            + '&_token=' + this.api_key;
    },

    get_result_from_json: function(json) {
        return json.Mid;
    },

    is_api_key_valid_from_json: function(json) {
        return json.Outcome === 'Success';
    },

    get_error_message: function(json) {
        return json;
    }

});