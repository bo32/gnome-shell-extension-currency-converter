const Soup = imports.gi.Soup;
const Lang = imports.lang;
const Main = imports.ui.main;

var HttpHelper = new Lang.Class({
	Name: 'HttpHelper',

	_init: function() {
    },
    
    send_request: function(url, callback) {
        let request = Soup.Message.new('GET', url);
		let session = new Soup.SessionAsync();

		session.queue_message(request, Lang.bind(this, function(session, response) {
			try {
				if(response.status_code == 200) {
                    let json = JSON.parse(response.response_body.data);
                    callback(json);
				} else {
					let json = JSON.parse(response.response_body.data);
					Main.notify('Currency Converter error.', 'Status code ' + response.status_code + ' when reaching ' + url);
					return;
				}
			} catch (err) {
				Main.notify('Currency Converter error.', 'Cannot reach ' + url);
				return;
            }
        }));
    }
});