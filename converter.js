const Soup = imports.gi.Soup;
const Lang = imports.lang;
//const ExtensionUtils = imports.misc.extensionUtils;
//const Me = ExtensionUtils.getCurrentExtension();
//const Prefs = Me.imports.prefs;

const Converter = new Lang.Class({
	Name: 'Converter',

	_init: function(api_key) {
		this._api_key = api_key;
	},

	_init: function(fromCurrency, toCurrency, api_key) {
		this.fromCurrency = fromCurrency;
		this.toCurrency = toCurrency;
		this._api_key = api_key;
	},

	is_api_key_valid: function(callback) {
		var result;
		callback(result);
		return result;
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
		return 'USD' + this.toCurrency;
	},

	getFromUSDCurrency: function() {
		return 'USD' + this.fromCurrency;
	},

	convert: function(amount, callback, error_handler) {
		if (!this._api_key) {
			error_handler('Currency Converter cannot work.', 'Please create a free account on the website currecylayer.com, and enter your key in the parameters page.');
			return;
		}

		let url = 'http://www.apilayer.net/api/live?access_key=' + this._api_key + '&currencies='+this.fromCurrency+','+this.toCurrency+ '&format=1';
		let request = Soup.Message.new('GET', url);
		let session = new Soup.SessionAsync();

		session.queue_message(request, Lang.bind(this, function(session, response) {
			if(response.status_code == 200) {
				let quotes = JSON.parse(response.response_body.data).quotes;
				let result = parseFloat(amount) * parseFloat(quotes[this.getToUSDCurrency()]) / parseFloat(quotes[this.getFromUSDCurrency()]);
				callback(result);
				return;
			} else {
				return;
			}
		}));
	}
});



