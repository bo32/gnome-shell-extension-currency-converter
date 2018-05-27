const Soup = imports.gi.Soup;
const Signals = imports.signals;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const APIProvider = Me.imports.api_providers.APIProvider;

let CUR_PREFIX = 'USD';
let BASE_URL = 'http://www.apilayer.net/api/live?';

var Converter = new Lang.Class({
	Name: 'Converter',

	_init: function(api_provider) {
		this.api_provider = api_provider;
	},

	is_api_key_valid: function(callback) {
		if (!this.api_provider.get) {
			return false;
		}
		let result = false;
		let url = this.api_provider.get_check_api_key_url();
		global.log(url);
		let request = Soup.Message.new('GET', url);
		let session = new Soup.SessionAsync();
		let valid = false;
		session.queue_message(request, Lang.bind(this, function(session, response) {
			if(response) {
				if (response.status_code == 200) {
					var json = JSON.parse(response.response_body.data);
					valid = this.api_provider.is_api_key_valid_from_json(json);
				}
			}
			if (callback)
				callback(valid);
		}));
		return valid;
	},

	setFromCurrency: function(currency) {
		this.fromCurrency = currency;
	},

	setToCurrency: function(currency) {
		this.toCurrency = currency;
	},

	getFromCurrency: function() {
		return this.fromCurrency;
	},

	getToCurrency: function() {
		return this.toCurrency;
	},

	setAPIKey: function(api_key) {
		this._api_key = api_key;
	},

	getAPIKey: function() {
		return this._api_key;
	},

	getToUSDCurrency: function() {
		return CUR_PREFIX + this.toCurrency;
	},

	getFromUSDCurrency: function() {
		return CUR_PREFIX + this.fromCurrency;
	},

	convert: function(amount, callback, error_handler) {
		if (!this.api_provider.get_api_key()) {
			error_handler('Currency Converter cannot work.', 'Please create a free account on the website currecylayer.com, and enter your key in the parameters page.');
			return;
		}

		// let url = BASE_URL + 'access_key=' + this._api_key + '&currencies='+this.fromCurrency+','+this.toCurrency+ '&format=1';
		let url = this.api_provider.get_convert_url(this.fromCurrency, this.toCurrency, amount);
		global.log(url);
		let request = Soup.Message.new('GET', url);
		let session = new Soup.SessionAsync();

		session.queue_message(request, Lang.bind(this, function(session, response) {
			try {
				if(response.status_code == 200) {
					// if (Boolean(JSON.parse(response.response_body.data).success)) {
						let json = JSON.parse(response.response_body.data);
						global.log(JSON.stringify(json));
						let result = this.api_provider.get_result_from_json(json);
						callback(result);
						return;
					// } else {
					// 	error_handler('Currency Converter cannot work.', 'The server was reached but returned an error. Please check your parameters.');
					// }
				} else {
					let json = JSON.parse(response.response_body.data);
					error_handler('Currency Converter cannot work.', this.api_provider.get_error_message(json));
				}
			} catch (err) {
				error_handler('Currency Converter cannot work.', "The server couldn't be reached.");
				return;
			}
		}));
	}
});
Signals.addSignalMethods(Converter.prototype);
