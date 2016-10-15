const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Signals = imports.signals;

// Timer class in initially created to refresh every X minutes the result.
// Not used anymore, maybe consider to delete it.
const Autorefresh = new Lang.Class({
	Name: 'Autorefresh',

	_init: function(refresh_time) {
        this.refresh_time = refresh_time;
        this.start();
	},

    start: function() {
        this.timer_id = Mainloop.timeout_add((this.refresh_time) * 1000 * 60, Lang.bind(this, function() {
            let tz = TimeZone.new_local();
    		let now = DateTime.new_now(tz);
            global.log(now + ' - auto-refresh: ' + this.timer_id);
            this.emit('autorefresh');
            this.start();
        }));
    },

    stop: function() {
		if(this.timer_id != null) {
        	Mainloop.source_remove(this.timer_id);
			this.timer_id = null;
		}
    }
});
Signals.addSignalMethods(Autorefresh.prototype);