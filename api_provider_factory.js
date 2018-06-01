const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const APIProviders = Me.imports.api_providers;
const Convenience = Me.imports.convenience;
const Settings = Convenience.getSettings();

var APIProviderFactory = new Lang.Class({
    Name: 'APIProviderFactory',
    
    _init: function() {
        this.api_provider = Settings.get_string('api-provider');
        this.api_key = Settings.get_string('api-key');
    },

    get_api_provider: function() {
        var provider;
        switch(this.api_provider) {
            case 'currencylayer':
                provider = new APIProviders.CurrencyLayer(this.api_key);
                break;
            case 'openexchangerates':
                provider = new APIProviders.OpenExchangeRates(this.api_key);
                break;
            // case 'xignite':
            //     provider = new APIProviders.Xignite(this.api_key);
            //     break;
            // case 'xe':
            //     provider = new APIProviders.XE(this.api_key);
            //     break;
            // case 'oanda':
            //     provider = new APIProviders.Oanda(this.api_key);
            //     break;
            // case 'currencyconverterapi':
            //     provider = new APIProviders.CurrencyConverterAPI(this.api_key);
            //     break;
            case 'fixer':
                provider = new APIProviders.Fixer(this.api_key);
                break;
            case 'exchangerate-api':
                provider = new APIProviders.ExchangeRateApi(this.api_key);
                break;
        }
        return provider;
    }

});