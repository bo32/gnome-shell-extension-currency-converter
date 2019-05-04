/* Currency Converter extension */

const Main = imports.ui.main;
const Panel = imports.ui.panel;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Clipboard = St.Clipboard.get_default();
const CLIPBOARD_TYPE = St.ClipboardType.CLIPBOARD;
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
const APIProviderFactory = Me.imports.api_provider_factory.APIProviderFactory;
const APIProvider = Me.imports.api_providers.APIProvider;
const Mainloop = imports.mainloop;
const _ = imports.gettext.domain(Me.uuid).gettext;

var fromValue;
var resultLabel;
var icon_size = 16;
var fav_currencies;
var from_currency;
var to_currency;
var width = 80;
var expand_width = 45;
var fromMenu;
var toMenu;

var menu;
var converter;

const CurrencyConverterMenuButton = class CurrencyConverterMenuButton extends PanelMenu.Button {

	constructor(converter) {
        super(0.0, 'currencyconverter');
		this._settings_changed = false;
		Settings.connect('changed', Lang.bind(this, function() {
			if (this._settings_changed !== true)
				this._settings_changed = true;
		}));
		fav_currencies = Settings.get_string('favorite-currencies').split(',');
		// fav_currencies = Utils.split_every_offset(Settings.get_string('favorite-currencies'), 3);
		from_currency = fav_currencies[0];
		to_currency = fav_currencies[1];
        this.converter = converter;

		this.actor.add_child(get_converter_icon_box());
		fromMenu = new FromSubMenu(this.converter);
		this.menu.addMenuItem(fromMenu);
		toMenu = new ToMenu();
		this.menu.addMenuItem(toMenu);
		var reverseMenu = new ReverseMenu();
		this.menu.addMenuItem(reverseMenu);

		// grab focus when the menu is opened
        this.menu.connect('open-state-changed', Lang.bind(this, function(self, open) {
    		Mainloop.timeout_add(20, Lang.bind(this, function() {
        		if (open)
					global.stage.set_key_focus(fromMenu._get_FromField());
		   	}));
		}));

		if (Settings.get_int('init-amount') > 0) {
			fromMenu._get_FromField().set_text(Settings.get_int('init-amount').toString());
			fromMenu._on_activate();
		}
	}

    destroy() {
		this.parent();
    }
};

function set_label(label) {
	var hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
	var label = new St.Label({
		text: label,
		x_align: Clutter.ActorAlign.FILL,
		y_align: Clutter.ActorAlign.CENTER
	});
	hbox.add_child(label);
	menu.actor.remove_all_children();
	menu.actor.add_child(hbox);
}

const CurrencySubMenu = class CurrencySubMenu extends PopupMenu.PopupSubMenuMenuItem {

	constructor(currency) {
		super(currency);
		/* add menus */
		this.menuItems = new Array();
		this.buttons = new Array();
		for(var currency in fav_currencies) {
			var currencyMenuItem = new PopupMenu.PopupBaseMenuItem({activate: false});
			var currencyButton = new St.Button({label: fav_currencies[currency], x_align: 0, x_expand: true})
    	    currencyButton.connect('clicked', Lang.bind(this, function() {
				this._setCurrency(currencyButton.label);
				for(var item in this.menuItems) {
					var checked = this.buttons[item].label == this._getCurrency();
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
		for(var item in this.menuItems) {
			var checked = this.buttons[item].label == this._getCurrency();
			this.menuItems[item].setOrnament(checked);
		}
	}

	_show_currency_field(show) {
		// turn arrow
		this.showCurrencyField = !this.showCurrencyField;
		this.expandIcon = PopupMenu.arrowIcon(this.showCurrencyField ? St.Side.RIGHT : St.Side.LEFT);
		this.expandButton.child = this.expandIcon;

		// display or hide the field
		if (this.showCurrencyField) {
			// this.currencyField is the field allowing the user to set manually the FROM/TO currency. Not visible at first.
			this.currencyField = new St.Entry();
			this.currencyField.set_x_expand(false);
			this.currencyField.set_width(expand_width);
			this.actor.insert_child_at_index(this.currencyField, 1);
			this.currencyField.clutter_text.connect('activate', Lang.bind(this, fromMenu._on_activate));
		} else {
			this.actor.remove_child(this.currencyField);
		}
	}

	_setCurrency(text) {
		this.label.text = text;
	}

	_set_custom_currency(text) {
		if (this.showCurrencyField) {
			this.currencyField.text = text;
		}
	}

	_get_custom_currency() {
		return this.currencyField.clutter_text.text;
	}

	_getCurrency() {
		if (!Settings.get_boolean('allow-custom-currencies')) {
			return this.label.text;
		}

		var currency;
		if (this.showCurrencyField
				&& this.currencyField
				&& this.currencyField.clutter_text.text) {
			if (this._is_custom_currency_valid()) {
				currency = this.currencyField.clutter_text.text;
				this._validate_currency(true);
			} else {
				currency = '';
				this._validate_currency(false);
			}
		} else {
			currency = this.label.text;
		}
		return currency;
	}

	_is_custom_currency_valid() {
		var custom_currency = this.currencyField.clutter_text.text;
		for (var c in Currencies.currencies) {
			if (Currencies.currencies[c]['code'] == custom_currency) {
				return true;
			}
		}
		return false;
	}

	_validate_currency(valid) {
		if (this.currencyField) {
			var color = valid ? 'lawngreen' : 'red';
			this.currencyField.set_style('color: ' + color + ';');
		}
	}

	_printResult(result) {
		if(result) {
			toMenu._setResult(Utils.formatCurrencyNumber(parseFloat(result)));
		} else {
			toMenu._setResult(result);
		}

		if (Settings.get_boolean('display-result-in-panel-menu')) {
			if (result == '') {
				restore_currency_icon();
			} else {
				set_label(toMenu._getResult() + ' ' + toMenu._getCurrency());
			}
		}
	}

	_error_handler(title, message) {
		Main.notify(title, message);
	}
};

const FromSubMenu = class FromSubMenu extends CurrencySubMenu {

	constructor(converter) {
		super(from_currency);
        this.converter = converter;

		this.fromField = new St.Entry({
			style_class: 'login-dialog-prompt-entry',
			x_align: Clutter.ActorAlign.FILL,
			y_align: Clutter.ActorAlign.CENTER,
			x_expand: true,
			can_focus: true});
		this.fromField.set_width(width);
		ShellEntry.addContextMenu(this.fromField);
		this.clutter_text = this.fromField.get_clutter_text();
		this.clutter_text.connect('activate', Lang.bind(this, this._on_activate));
		this.clutter_text.set_x_expand(true);
		this.actor.insert_child_at_index(this.fromField, 4);
	}

	_get_FromField() {
		return this.fromField;
	}

	_getAmount() {
		return this.clutter_text.text;
	}

	_on_activate() {
		var amount = fromMenu._getAmount();
		if (amount.indexOf(",") > -1) {
			amount = amount.replace(",", ".");
		}

		if (!isNaN(amount) 
				&& amount 
				&& amount != 0) {
			var from_currency = fromMenu._getCurrency();
			var to_currency = toMenu._getCurrency();
			var api_key = Settings.get_string('api-key');
            this.converter.setFromCurrency(from_currency);
			this.converter.setToCurrency(to_currency);
			
			if (from_currency == '' || to_currency == '') {
				this._printResult('');
			} else {
				this.converter.convert(amount, this._printResult, this._error_handler);
			}
		} else {
			this._printResult('');
		}
	}
};

const ToMenu = class ToMenu extends CurrencySubMenu {

	constructor() {
		super(to_currency);
		resultLabel = new St.Label({
			x_align: Clutter.ActorAlign.FILL,
			y_align: Clutter.ActorAlign.CENTER,
			x_expand: true,
			width: fromMenu._get_FromField().width});
		var clutter_text = resultLabel.get_clutter_text();
		clutter_text.set_x_align(Clutter.ActorAlign.END);
		clutter_text.set_x_expand(true);
		this.actor.height = fromMenu.actor.height;
		this.actor.insert_child_at_index(resultLabel, 4);
	}

	_setResult(text) {
		resultLabel.text = text.replace(",", ".");
	}

	_getResult() {
		return resultLabel.text;
	}
};

const ReverseMenu = class ReverseMenu extends PopupMenu.PopupBaseMenuItem {

	constructor() {
		super();

		// Reverse button
		var reverse_icon = new St.Icon({
			icon_name: 'mail-send-receive-symbolic',
        	style_class: 'system-actions-icon',
			icon_size: icon_size
		});
		var reverseButton = new St.Button({
			child: reverse_icon, 
			x_expand: true
		});
		reverseButton.connect('clicked', Lang.bind(this, function() {
			if (!toMenu.showCurrencyField && !fromMenu.showCurrencyField) {
				var tmp = toMenu._getCurrency();
				toMenu._setCurrency(fromMenu._getCurrency());
				fromMenu._setCurrency(tmp);
			} else {
				if (!fromMenu.showCurrencyField)
					fromMenu._show_currency_field(true);
				if (!toMenu.showCurrencyField)
					toMenu._show_currency_field(true);
				var tmp = fromMenu._get_custom_currency();
				fromMenu._set_custom_currency(toMenu._get_custom_currency());
				toMenu._set_custom_currency(tmp);
			}
			fromMenu._on_activate();
		}));
		this.actor.add(reverseButton);

		// Copy to clipboard button
		var clipboard_icon = new St.Icon({
			icon_name: 'edit-paste-symbolic',
			style_class: 'system-actions-icon',
			icon_size: icon_size
		});
		var copyButton = new St.Button({
			child: clipboard_icon, 
			x_expand: true
		});
		copyButton.connect('clicked', Lang.bind(this, function() {
			Clipboard.set_text(CLIPBOARD_TYPE, toMenu._getResult());
		}));
		this.actor.add(copyButton);

		// Preferences button
		var preferences_icon = new St.Icon({
			icon_name: 'system-run-symbolic',
			style_class: 'system-actions-icon',
			icon_size: icon_size
		});
		var prefsButton = new St.Button({
			child: preferences_icon, 
			x_expand: true
		});
		prefsButton.connect('clicked', Lang.bind(this, function() {
			this.emit('activate'); // shuts the menu
			launch_extension_prefs(Me.uuid);
		}));
		this.actor.add(prefsButton);

		// Clear PanelMenu button
		if(Settings.get_boolean('display-result-in-panel-menu')) {
			var clear_icon = new St.Icon({
				icon_name: 'edit-clear-symbolic',
				style_class: 'system-actions-icon',
				icon_size: icon_size
			});
			var clearButton = new St.Button({
				child: clear_icon, 
				x_expand: true
			});
			clearButton.connect('clicked', Lang.bind(this, function() {
				// auto_refresh.stop();
				restore_currency_icon();
			}));
			this.actor.add(clearButton);
		}
	}
};

function launch_extension_prefs(uuid) {
    var appSys = Shell.AppSystem.get_default();
    var app = appSys.lookup_app('gnome-shell-extension-prefs.desktop');
	// global.log(Settings.get_string('favorite-currencies'));
    app.connect('windows_changed', Lang.bind(menu, function() {
		// global.log('--------');
		// global.log(app.get_state() == Shell.AppState.STOPPED);
		// global.log(this._settings_changed === true);
        if (app.get_state() == Shell.AppState.STOPPED && this._settings_changed === true) {
			restart();
			Main.notify('The Currency Converter extension just restarted.');
			this._settings_changed = false;
        }
    }));
    var info = app.get_app_info();
    var timestamp = global.display.get_current_time_roundtrip();
    info.launch_uris(
        ['extension:///' + uuid],
        global.create_app_launch_context(timestamp, -1)
    );
}

function get_converter_icon_box() {
	var hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
	var icon = new St.Icon({
		icon_name: 'mail-send-receive-symbolic',
		style_class: 'system-actions-icon',
		'icon_size': icon_size});
	hbox.add_child(icon);
	return hbox;
}

function restore_currency_icon() {
	menu.actor.remove_all_children();
	menu.actor.add_child(get_converter_icon_box());
}

function init() {
}

function restart() {
	disable();
	enable();
}

function enable() {
	var api_provider_factory = new APIProviderFactory();
	var api_provider = api_provider_factory.get_api_provider();
    converter = new Converter(api_provider);
    menu = new CurrencyConverterMenuButton(converter);
    Main.panel.addToStatusArea('currencyconverter', menu);
}

function disable() {
    menu.destroy();
}
