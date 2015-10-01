/* Currency Converter extension */

const Main = imports.ui.main;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Converter = Me.imports.converter.Converter;
const Currencies = Me.imports.currencies;
const Clutter = imports.gi.Clutter;
const Shell = imports.gi.Shell;
const ShellEntry = imports.ui.shellEntry;
const Convenience = Me.imports.convenience;
const Settings = Convenience.getSettings();
const Utils = Me.imports.utils;
const Tweener = imports.ui.tweener;
const _ = imports.gettext.domain(Me.uuid).gettext;

let fromValue;
let resultLabel;
let converter;
let icon_size = 16;
let fav_currencies;
let from_currency;
let to_currency;
let width = 80;
let fromMenu;
let toMenu;

const CurrencyConverterMenuButton = new Lang.Class({
    Name: 'CurrencyConverter.CurrencyConverterMenuButton',
    Extends: PanelMenu.Button,

	_init: function() {
        this.parent(0.0, 'currencyconverter');
		fav_currencies = Settings.get_string('favorite-currencies').split(',');
		from_currency = fav_currencies[0];
		to_currency = fav_currencies[1];
		//converter = new Converter(from_currency, to_currency, Settings.get_string('api-key'));
		let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
        let icon = new St.Icon({ icon_name: 'mail-send-receive-symbolic', style_class: 'system-actions-icon', 'icon_size': icon_size});
        hbox.add_child(icon);
		hbox.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
		this.actor.add_child(hbox);
		fromMenu = new FromSubMenu();
		this.menu.addMenuItem(fromMenu);
		toMenu = new ToMenu();
		this.menu.addMenuItem(toMenu);
		let reverseMenu = new ReverseMenu();
		this.menu.addMenuItem(reverseMenu);
	},

    destroy: function() {
		this.parent();
    },
});

const CurrencySubMenu = new Lang.Class({
	Name: 'CurrencyConverter.CurrencyMenu',
    Extends: PopupMenu.PopupSubMenuMenuItem,

	_init: function(currency) {
		this.parent(currency);
		/* add menus */
		this.menuItems = new Array();
		this.buttons = new Array();
		for(let currency in fav_currencies) {
			let currencyMenuItem = new PopupMenu.PopupBaseMenuItem({activate: false});
			let currencyButton = new St.Button({label: fav_currencies[currency], x_align: 0, x_expand: true})
    	    currencyButton.connect('clicked', Lang.bind(this, function() {
				this._setCurrency(currencyButton.label);
				for(let item in this.menuItems) {
					let checked = this.buttons[item].label == this._getCurrency();
					this.menuItems[item].setOrnament(checked);
				}
			}));
			currencyMenuItem.actor.add(currencyButton);
	        this.menu.addMenuItem(currencyMenuItem);
			this.menuItems.push(currencyMenuItem);
			this.buttons.push(currencyButton);
		}
		
		if (Settings.get_boolean('allow-custom-currencies')) {
			this.showCurrencyField = false;
			this.expandIcon = PopupMenu.arrowIcon(St.Side.LEFT);
			this.expandButton = new St.Button({child: this.expandIcon});
			this.expandButton.connect('clicked', Lang.bind(this, this._show_currency_field));
			this.actor.insert_child_at_index(this.expandButton, 1);
		}

		/* initial ornament */
		for(let item in this.menuItems) {
			let checked = this.buttons[item].label == this._getCurrency();
			this.menuItems[item].setOrnament(checked);
		}
	},
	
	_show_currency_field: function(show) {
		// turn arrow
		this.showCurrencyField = !this.showCurrencyField;
		this.expandIcon = PopupMenu.arrowIcon(this.showCurrencyField ? St.Side.RIGHT : St.Side.LEFT);
		this.expandButton.child = this.expandIcon;
		
		// display or hide the field
		if (this.showCurrencyField) {
			// this.currencyField is the field allowing the user to set manually the FROM currency. Not visible at first.
			this.currencyField = new St.Entry();
			this.currencyField.set_x_expand(false);
			this.currencyField.set_width(45);
			this.actor.insert_child_at_index(this.currencyField, 1);
			this.currencyField.clutter_text.connect('activate', Lang.bind(this, fromMenu._on_activate));
		} else {
			this.actor.remove_child(this.currencyField);
		}
	},

	_setCurrency: function(text) {
		this.label.text = text;
	},
	
	_set_custom_currency: function(text) {
		if (this.showCurrencyField) {
			this.currencyField.text = text;
		}
	},
	
	_get_custom_currency: function() {
		if (this.showCurrencyField) {
			return this.currencyField.clutter_text.text;
		}
	},

	_getCurrency: function() {
		if (!Settings.get_boolean('allow-custom-currencies')) {
			return this.label.text;
		}
		
		let currency;
		if (this.showCurrencyField 
				&& this.currencyField 
				&& this.currencyField.clutter_text.text 
				&& this._is_custom_currency_valid()) {
			currency = this.currencyField.clutter_text.text;
			this._validate_currency(true);
		} else {
			currency = this.label.text;
			this._validate_currency(false);
		}
		return currency;
	},
	
	_is_custom_currency_valid: function() {	
		let custom_currency = this.currencyField.clutter_text.text;
		for (let c in Currencies.currencies) {
			if (Currencies.currencies[c]['code'] == custom_currency) {
				return true;
			}
		}
		return false;
	},
	
	_validate_currency: function(valid) {
		if (this.currencyField) {
			let color = valid ? 'lawngreen' : 'red';
			this.currencyField.set_style('color: ' + color + ';');
		}
	},
	
	_printResult: function(result) {
		if(result) {
			let nb_decimals;
			if(result > 1) {
				nb_decimals = 2;
			} else if (result > 0.01) {
				nb_decimals = 3;
			} else {
				nb_decimals = 5;
			}
			toMenu._setResult(Utils.formatCurrencyNumber(parseFloat(result)));
		} else {
			toMenu._setResult(result);
		}
	}, 
	
	_error_handler: function(title, message) {
		Main.notify(title, message);
	}	
});

const FromSubMenu = new Lang.Class({
	Name: 'FromSubMenu',
	Extends: CurrencySubMenu,
	
	_init:function() {
		this.parent(from_currency);
		
		let fromField = new St.Entry({ style_class: 'login-dialog-prompt-entry', can_focus: true, x_align: Clutter.ActorAlign.END, y_align: Clutter.ActorAlign.CENTER, x_expand: true});
		fromField.set_width(width);
		ShellEntry.addContextMenu(fromField);
		this.clutter_text = fromField.get_clutter_text();
		this.clutter_text.set_max_length(20);
		this.clutter_text.connect('activate', Lang.bind(this, this._on_activate));
		this.clutter_text.set_x_expand(true);
		this.actor.insert_child_at_index(fromField, 4);
	},

	_getAmount: function() {
		return this.clutter_text.text;
	},

	_on_activate: function() {
		if (!isNaN(fromMenu._getAmount()) && fromMenu._getAmount() && fromMenu._getAmount() != 0) {
			let from_currency = fromMenu._getCurrency();
			let to_currency = toMenu._getCurrency();
			let api_key = Settings.get_string('api-key');
			converter = new Converter(from_currency, to_currency, api_key);
			let result = converter.convert(fromMenu._getAmount(), this._printResult, this._error_handler);
		} else {
			this._printResult('');
		}
	},
});

const ToMenu = new Lang.Class({
	Name: 'ToMenu',
	Extends: CurrencySubMenu,

	_init: function() {
		this.parent(to_currency);
		resultLabel = new St.Label({x_align: Clutter.ActorAlign.END, y_align: Clutter.ActorAlign.CENTER});
		resultLabel.set_width(width);
		this.actor.insert_child_at_index(resultLabel, 4);
	},

	_setResult: function(text) {
		resultLabel.text = text;
	},

	_getResult: function() {
		return resultLabel.text;
	}
});

const ReverseMenu = new Lang.Class({
	Name: 'FromMenu',
	Extends: PopupMenu.PopupBaseMenuItem,

	_init: function() {
		this.parent();
		let reverseButton = new St.Button({label: _('Reverse'), x_expand: true});
		reverseButton.connect('clicked', Lang.bind(this, function() {
			if (!toMenu.showCurrencyField && !fromMenu.showCurrencyField) {
				let tmp = toMenu._getCurrency();
				toMenu._setCurrency(fromMenu._getCurrency());
				fromMenu._setCurrency(tmp);
			} else {
				if (!fromMenu.showCurrencyField)
					fromMenu._show_currency_field(true);
				if (!toMenu.showCurrencyField)
					toMenu._show_currency_field(true);
				let tmp = fromMenu._get_custom_currency();
				fromMenu._set_custom_currency(toMenu._get_custom_currency());
				toMenu._set_custom_currency(tmp);	
			}
			fromMenu._on_activate();
		}));
		this.actor.add(reverseButton);
		let prefsButton = new St.Button({label: _('Preferences'), x_expand: true});
		prefsButton.connect('clicked', Lang.bind(this, function() {
			launch_extension_prefs(Me.uuid);
		}));
		this.actor.add(prefsButton);
	},
});

function launch_extension_prefs(uuid) {
    let appSys = Shell.AppSystem.get_default();
    let app = appSys.lookup_app('gnome-shell-extension-prefs.desktop');
    let info = app.get_app_info();
    let timestamp = global.display.get_current_time_roundtrip();
    info.launch_uris(
        ['extension:///' + uuid],
        global.create_app_launch_context(timestamp, -1)
    );
}

function init() {
}

let menu;

function restart() {
	global.log('restart');
	disable();
	enable();
}

function enable() {
    menu = new CurrencyConverterMenuButton;
    Main.panel.addToStatusArea('currencyconverter', menu);
}

function disable() {
    menu.destroy();
}
