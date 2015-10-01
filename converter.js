const Soup = imports.gi.Soup;
const Lang = imports.lang;

let CUR_PREFIX = 'USD';
let BASE_URL = 'http://www.apilayer.net/api/live?';

const Converter = new Lang.Class({
	Name: 'Converter',

	_init: function(fromCurrency, toCurrency, api_key) {
		this.fromCurrency = fromCurrency;
		this.toCurrency = toCurrency;
		this._api_key = api_key;
	},

	is_api_key_valid: function(callback) {
		if (!this._api_key) {
			return false;
		}
		let result = false;
		let url = BASE_URL + 'access_key=' + this._api_key;
		let request = Soup.Message.new('GET', url);
		let session = new Soup.SessionAsync();
		let valid = false;
		session.queue_message(request, Lang.bind(this, function(session, response) {
			if(response) {
				if (response.status_code == 200) {
					valid = Boolean(JSON.parse(response.response_body.data).success);
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

	getToUSDCurrency: function() {
		return CUR_PREFIX + this.toCurrency;
	},

	getFromUSDCurrency: function() {
		return CUR_PREFIX + this.fromCurrency;
	},

	convert: function(amount, callback, error_handler) {
		if (!this._api_key) {
			error_handler('Currency Converter cannot work.', 'Please create a free account on the website currecylayer.com, and enter your key in the parameters page.');
			return;
		}

		let url = BASE_URL + 'access_key=' + this._api_key + '&currencies='+this.fromCurrency+','+this.toCurrency+ '&format=1';
		let request = Soup.Message.new('GET', url);
		let session = new Soup.SessionAsync();

		session.queue_message(request, Lang.bind(this, function(session, response) {
			try {
				if(response.status_code == 200) {
					if (Boolean(JSON.parse(response.response_body.data).success)) {
						let quotes = JSON.parse(response.response_body.data).quotes;
						let result = parseFloat(amount) * parseFloat(quotes[this.getToUSDCurrency()]) / parseFloat(quotes[this.getFromUSDCurrency()]);
						callback(result);
						return;
					} else {
						error_handler('Currency Converter cannot work.', 'The server was reached but returned an error. Please check your parameters.');
					}
				}
			} catch (err) {
				error_handler('Currency Converter cannot work.', "The server couldn't be reached.");
				return;
			}
		}));
	}
});



