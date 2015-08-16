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
const Clutter = imports.gi.Clutter;
//const Gio = imports.gi.Gio;
const ShellEntry = imports.ui.shellEntry;
//const Prefs = Me.imports.prefs;
const Convenience = Me.imports.convenience;
const Settings = Convenience.getSettings();

let fromValue;
let resultLabel;
let converter;
let icon_size = 16;
var fav_currencies = Settings.get_string('favorite-currencies').split(',');
let from_currency = fav_currencies[0];
let to_currency = fav_currencies[1];
let width = 80;
let fromMenu;
let toMenu;

const CurrencyConverterMenuButton = new Lang.Class({
    Name: 'CurrencyConverter.CurrencyConverterMenuButton',
    Extends: PanelMenu.Button,

	_init: function() {
        this.parent(0.0, 'currencyconverter');
		converter = new Converter(from_currency, to_currency, Settings.get_string('api-key'));
		let hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
        let icon = new St.Icon({ icon_name: 'mail-send-receive-symbolic', style_class: 'system-actions-icon', 'icon_size': icon_size});
		//let gicon = Gio.icon_new_for_string(Me.path + "/icons/money.svg");
		//let icon = new St.Icon({gicon: gicon, icon_size: icon_size});
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

		/* initial ornament */
		for(let item in this.menuItems) {
			let checked = this.buttons[item].label == this._getCurrency();
			this.menuItems[item].setOrnament(checked);
		}
	},

	_setCurrency: function(text) {
		this.label.text = text;
	},

	_getCurrency: function() {
		return this.label.text;
	}
});

const FromSubMenu = new Lang.Class({
	Name: 'FromSubMenu',
	Extends: CurrencySubMenu,
	
	_init:function() {
		this.parent(from_currency);
		this.field = new St.Entry({ style_class: 'login-dialog-prompt-entry', can_focus: true});
		this.field.set_x_expand(true);
		this.field.set_width(width);
		ShellEntry.addContextMenu(this.field);
		this.clutter_text = this.field.get_clutter_text();
		this.clutter_text.set_max_length(20);
		this.clutter_text.connect('activate', Lang.bind(this, this._on_activate));
		this.clutter_text.set_x_expand(true);
		this.actor.add(this.field);
	},

	_getAmount: function() {
		return this.clutter_text.text;
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
			toMenu._setResult(parseFloat(result).toFixed(nb_decimals));
		} else {
			toMenu._setResult(result);
		}
	}, 

	_on_activate: function() {
		if (!isNaN(this._getAmount()) && this._getAmount()) {
			converter.setFromCurrency(fromMenu._getCurrency());
			converter.setToCurrency(toMenu._getCurrency());
			let result = converter.convert(this._getAmount(), this._printResult, this._error_handler);
		} else {
			this._printResult('');
		}
	},
	
	_error_handler: function(title, message) {
		Main.notify(title, message);
	}
});

const ToMenu = new Lang.Class({
	Name: 'ToMenu',
	Extends: CurrencySubMenu,

	_init: function() {
		this.parent(to_currency);
		resultLabel = new St.Label({text: '', 'x_align': Clutter.ActorAlign.END});
		resultLabel.set_width(width);
		this.actor.add(resultLabel, {expand: true });
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
		let reverseButton = new St.Button({label: 'Reverse', x_expand: true});
		reverseButton.connect('clicked', Lang.bind(this, function() {
			let tmp = toMenu._getCurrency();
			toMenu._setCurrency(fromMenu._getCurrency());
			fromMenu._setCurrency(tmp);
			fromMenu._on_activate();
		}));
		this.actor.add(reverseButton);
		let prefsButton = new St.Button({label: 'Preferences', x_expand: true});
		prefsButton.connect('clicked', Lang.bind(this, function() {
			Prefs.buildPrefsWidget();
		}));
		this.actor.add(prefsButton);
	}
});

function init() {
}

let menu;

function enable() {
    menu = new CurrencyConverterMenuButton;
    Main.panel.addToStatusArea('currencyconverter', menu);
}

function disable() {
    menu.destroy();
}
