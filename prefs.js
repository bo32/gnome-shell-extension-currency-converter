const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;
const Pango = imports.gi.Pango;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Currencies = Me.imports.currencies;
const Utils = Me.imports.utils;
const Convenience = Me.imports.convenience;
const Settings = Convenience.getSettings();
// const Converter = Me.imports.converter.Converter;
const _ = imports.gettext.domain(Me.uuid).gettext;

const MARGIN_LEFT = 10;

CurrencyConverterSettingsWidget.prototype = {

	_init: function() {

		this.vbox = new Gtk.Box({
			orientation: Gtk.Orientation.VERTICAL,
			spacing: 6
		});
		var stack = new Gtk.Stack({
            transition_type: Gtk.StackTransitionType.SLIDE_LEFT_RIGHT,
            transition_duration: 500,
            margin_left: 10,
            margin_right: 10
        });
        var stack_switcher = new Gtk.StackSwitcher({
            margin_left: 5,
            margin_top: 5,
            margin_bottom: 5,
            margin_right: 5,
            halign: Gtk.Align.CENTER,
            stack: stack
		});

		// this.converter = new Converter();

		/****************************************
		 * Currencies section
		 ****************************************/
		this.original_fav_currencies = Settings.get_string('favorite-currencies');

		this._grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                  row_spacing: 6,
                                  column_spacing: 6 });

		// /* Link to currencylayer.com */
		// this._grid.attach(new Gtk.LinkButton({
		// 	label: _('Currency Layer website'), 
		// 	halign: Gtk.Align.CENTER,
		// 	uri: 'https://currencylayer.com/'}), 0, 0, 6, 1);

		// /* API key field */
		// let api_key_field = new Gtk.Entry({hexpand: true});
		// this._grid.attach(new Gtk.Label({
		// 	label: _('API Key'),
		// 	halign: Gtk.Align.START,
		// 	margin_left: MARGIN_LEFT
		// }), 0, 1, 1, 1);
		// api_key_field.set_text(Settings.get_string('api-key'));
		// api_key_field.connect('changed', Lang.bind(this, function() {
		// 	let c = new Gdk.Color();
		// 	c = Gdk.Color.parse("black", c)[1];
		// 	api_key_field.modify_fg(Gtk.StateType.NORMAL, c);
		// }));
		// this._grid.attach(api_key_field, 1, 1, 4, 1);

		// let test_api_key_button = new Gtk.Button({label: 'Test'});

		// test_api_key_button.connect('clicked', Lang.bind(this, function() {
		// 	this.converter.setFromCurrency('');
		// 	this.converter.setToCurrency('');
		// 	this.converter.setAPIKey(api_key_field.text);
		// 	this.converter.is_api_key_valid(function(result_api_key_is_valid) {
		// 		/* set green is the api key is correct, or red otherwise */
		// 		let c = new Gdk.Color();
		// 		if (result_api_key_is_valid) {
		// 			c = Gdk.Color.parse("green", c)[1];
		// 		} else {
		// 			c = Gdk.Color.parse("red", c)[1];
		// 		}
		// 		api_key_field.modify_fg(Gtk.StateType.NORMAL, c);
		// 		Settings.set_string('api-key', api_key_field.text);
		// 		return;
		// 	});
		// }));
		// this._grid.attach(test_api_key_button, 5, 1, 1, 1);

		/* Display result in panel menu */
		this._grid.attach(new Gtk.Label({
			label: _('Display the conversion results in the panel menu.'), 
			hexpand: true, 
			halign: Gtk.Align.START,
			margin_left: MARGIN_LEFT
		}), 0, 2, 5, 1);
		let display_result_in_panel_menu_switch = new Gtk.Switch({
			active: Settings.get_boolean('display-result-in-panel-menu'), 
			halign: Gtk.Align.END
		});
		display_result_in_panel_menu_switch.connect('notify::active', function() {
			Settings.set_boolean('display-result-in-panel-menu', display_result_in_panel_menu_switch.active);
		});
		this._grid.attach(display_result_in_panel_menu_switch, 5, 2, 1, 1);

		/* Allow the custom currencies */
		this._grid.attach(new Gtk.Label({
			label: _('Allow custom currencies'), 
			hexpand: true, 
			halign: Gtk.Align.START,
			margin_left: MARGIN_LEFT
		}), 0, 3, 5, 1);
		let allow_custom_cur_switch = new Gtk.Switch({active: Settings.get_boolean('allow-custom-currencies'), halign: Gtk.Align.END});
		allow_custom_cur_switch.connect('notify::active', function() {
			Settings.set_boolean('allow-custom-currencies', allow_custom_cur_switch.active);
		});
		this._grid.attach(allow_custom_cur_switch, 5, 3, 1, 1);

		/* Initial amount */
		this._grid.attach(new Gtk.Label({
			label: _('Initial amount (leave 0 to disable the functionality)'), 
			hexpand: true, 
			halign: Gtk.Align.START,
			margin_left: MARGIN_LEFT
		}), 0, 4, 5, 1);

		this.init_amount_field = new Gtk.Entry({
			hexpand: true
		});
		this.init_amount_field.set_text(Settings.get_int('init-amount').toString());
		this._grid.attach(this.init_amount_field, 5, 4, 1, 1);

		/* Favorite currencies field */
		let fav_currencies = Settings.get_string('favorite-currencies').split(',');
		this._grid.attach(new Gtk.Label({
			label: _('Favorite currencies'),
			halign: Gtk.Align.START,
			margin_left: MARGIN_LEFT
		}), 0, 5, 1, 1);

		let fav_currencies_field = new Gtk.Entry({
			hexpand: true, 
			editable: false
		});
		// let tags = new Gtk.TextTagTable();
		// this.text_buffer = new Gtk.TextBuffer({tag_table: tags});

		// this.text_buffer.connect('changed', Lang.bind(this, function() {
		// 	this.apply_tags();
		// }));

		// let fav_currencies_field = new Gtk.TextView({
		// 	buffer: this.text_buffer
		// 	// border_width: 1
		// });
		// fav_currencies_field.set_style('view');

		// fav_currencies_field.set_text(Settings.get_string('favorite-currencies'));

		// this.currency_tag = new Gtk.TextTag({
		// 	name: 'curreny_tag',
		// 	foreground: 'white',
		// 	background: '#00578a',
		// 	editable: false,
		// 	// margin: 10,
		// 	// stretch: Pango.Stretch.ULTRA_EXPANDED,
		// 	// pixels_inside_wrap: 10,
		// 	// weight: 800,
		// 	weight: Pango.Weight.BOLD,
		// 	accumulative_margin: true,
		// 	// left_margin_set: true,
		// 	// left_margin: 10,
		// 	// justification: Gtk.Justification.CENTER,
		// 	// right_margin: 10,
		// 	// padding: 10,
		// 	// size_points: 20.2,
		// 	// rise: 10,
		// 	indent: 4,
		// 	scale: 1.2,
		// 	pixels_inside_wrap: 4,
		// 	wrap_mode: Gtk.WrapMode.WORD,
		// 	pixels_above_lines: 4,
		// 	pixels_below_lines: 4
		// });
		// tags.add(this.currency_tag);

		// let tmp_fav_currencies = '';
		// let i;
		// for ( i = 0 ; i < fav_currencies.length - 1 ; i++) {
		// 	tmp_fav_currencies += fav_currencies[i] + ' ';
		// }
		// tmp_fav_currencies += fav_currencies[i];
		// this.text_buffer.set_text(Settings.get_string('favorite-currencies'), -1);
		// this.text_buffer.set_text(tmp_fav_currencies, -1);
		fav_currencies_field.set_text(Settings.get_string('favorite-currencies'));

		this._grid.attach(fav_currencies_field, 1, 5, 5, 1);

		/* Currency list */
		let scrolledWindow = new Gtk.ScrolledWindow({
			vscrollbar_policy: Gtk.PolicyType.AUTOMATIC, 
			hscrollbar_policy: Gtk.PolicyType.AUTOMATIC, 
			visible: true, 
			hexpand: true, 
			vexpand: true});
		this._currencyTreeView = new Gtk.TreeView();
		scrolledWindow.add(this._currencyTreeView);
		this._currencyTreeView.get_selection().set_mode(Gtk.SelectionMode.SINGLE);

		let columns = { IS_FAVORITE: 0, CODE: 1, NAME: 2 };

		this._treeViewModel = new Gtk.ListStore();
		this._treeViewModel.set_column_types([GObject.TYPE_BOOLEAN, GObject.TYPE_STRING, GObject.TYPE_STRING]);
		this._currencyTreeView.model = this._treeViewModel;

		let favoriteColumn = new Gtk.TreeViewColumn({
			'title': _('Favorite'), 
			'expand': false, 
			'resizable': true, 
			'clickable': true});

		let favoriteCell = new Gtk.CellRendererToggle({'mode': Gtk.CellRendererMode.ACTIVATABLE});
		favoriteCell.activatable = true;
		favoriteColumn.pack_start(favoriteCell, true);
        favoriteColumn.add_attribute(favoriteCell, 'active', columns.IS_FAVORITE);
		favoriteCell.connect('toggled', Lang.bind(this, function(cellRenderer, path) {
				let gtkpath = Gtk.TreePath.new_from_string(path);
				let selection = this._currencyTreeView.get_selection();
				selection.select_path(gtkpath);
				let [ isSelected, model, iter ] = selection.get_selected();
				this._treeViewModel.set(iter, 
					[columns.IS_FAVORITE], 
					[!this._treeViewModel.get_value(iter, columns.IS_FAVORITE)], 
					-1);

				if (this._treeViewModel.get_value(iter, columns.IS_FAVORITE)) {
					/* add currency in list */
					fav_currencies.push(this._treeViewModel.get_value(iter, columns.CODE));
				} else {
					/* remove currency from list */
					let index = fav_currencies.indexOf(this._treeViewModel.get_value(iter, columns.CODE));
					fav_currencies.splice(index, 1);
				}
				//fav_currencies.sort();
				// let new_fav_currencies = fav_currencies.join(' ');
				// fav_currencies_field.set_text(new_fav_currencies);
				let new_fav_currencies = fav_currencies.join();
				fav_currencies_field.set_text(new_fav_currencies);
				Settings.set_string('favorite-currencies', new_fav_currencies);
				// this.text_buffer.set_text(new_fav_currencies, -1);
				// Settings.set_string('favorite-currencies', new_fav_currencies.replace(' ', ''));
		}));
		this._currencyTreeView.append_column(favoriteColumn);

		let codeColumn = new Gtk.TreeViewColumn({
			'title': _('Code'), 
			'expand': false, 
			'resizable': true});
		let codeCell = new Gtk.CellRendererText();
		codeColumn.pack_start(codeCell, true);
        codeColumn.add_attribute(codeCell, 'text', columns.CODE);
		this._currencyTreeView.append_column(codeColumn);

		let nameColumn = new Gtk.TreeViewColumn({
			'title': _('Name'), 
			'expand': true, 
			'resizable': true});
		let nameCell = new Gtk.CellRendererText();
		nameColumn.pack_start(nameCell, true);
        nameColumn.add_attribute(nameCell, 'text', columns.NAME);
		this._currencyTreeView.append_column(nameColumn);

		for(let c in Currencies.currencies) {
			let is_favorite = fav_currencies.indexOf(Currencies.currencies[c]['code']) != -1;
			let iter = this._treeViewModel.append();
			this._treeViewModel.set(iter,
				[columns.IS_FAVORITE, columns.CODE, columns.NAME],
				[is_favorite, Currencies.currencies[c]['code'], Currencies.currencies[c]['name']]
				);
		}
		//this._currencyTreeView.model.set_sort_column_id(columns.IS_FAVORITE, Gtk.SortType.DESCENDING);

		this._grid.attach(scrolledWindow, 0, 6, 6, 1);

		stack.add_titled(this._grid, "currencies", _("Currencies"));

		/****************************************
		 * Panel Menu result section
		 ****************************************/

		// this._grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
        //                           row_spacing: 6,
        //                           column_spacing: 6 });
		
		// // Display result in panel menu
		// this._grid.attach(new Gtk.Label({
		// 	label: _('Display the conversion results in the panel menu.'), 
		// 	hexpand: true, 
		// 	halign: Gtk.Align.START
		// }), 0, 0, 1, 1);
		// let display_result_in_panel_menu_switch = new Gtk.Switch({
		// 	active: Settings.get_boolean('display-result-in-panel-menu'), 
		// 	halign: Gtk.Align.END
		// });
		// display_result_in_panel_menu_switch.connect('notify::active', function() {
		// 	Settings.set_boolean('display-result-in-panel-menu', display_result_in_panel_menu_switch.active);
		// });
		// this._grid.attach(display_result_in_panel_menu_switch, 5, 0, 1, 1);

		// // Auto-refresh result
		// this._grid.attach(new Gtk.Label({
		// 	label: _('Activate auto refresh'), 
		// 	hexpand: true, 
		// 	halign: Gtk.Align.START
		// }), 0, 1, 1, 1);
		// let activate_auto_refresh_switch = new Gtk.Switch({
		// 	active: Settings.get_boolean('activate-auto-refresh'), 
		// 	halign: Gtk.Align.END
		// });
		// activate_auto_refresh_switch.connect('notify::active', function() {
		// 	Settings.set_boolean('activate-auto-refresh', activate_auto_refresh_switch.active);
		// });
		// this._grid.attach(activate_auto_refresh_switch, 5, 1, 1, 1);

		// stack.add_titled(this._grid, "panel-menu-result", _("Panel menu result"));


		/* API providers */
		this._grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
			row_spacing: 6,
			column_spacing: 6 });
		
		stack.add_titled(this._grid, "api-providers", _("API providers"));

		this._grid.attach(new Gtk.Label({
			label: _('API provider'),
			halign: Gtk.Align.START,
			margin_left: MARGIN_LEFT
		}), 0, 0, 1, 1);

		var providers_combobox = new Gtk.ComboBoxText({
			hexpand: true
		});
		providers_combobox.append('currencylayer', 'Currency layer');
		providers_combobox.append('openexchangerates', 'Open exchange rates (only Free plan tested)'); 
		// providers_combobox.append('xignite', 'Xignite');
		// providers_combobox.append('xe', 'XE');
		// providers_combobox.append('oanda', 'Oanda');
		// providers_combobox.append('currencyconverterapi', 'Currency converter API');
		providers_combobox.append('fixer', 'Fixer');
		providers_combobox.append('exchangerate-api', 'ExchangeRate API');

		var api_provider = Settings.get_string('api-provider');
		providers_combobox.set_active_id(api_provider);

		this._grid.attach(providers_combobox, 1, 0, 3, 1);

		// this._grid.attach(new Gtk.LinkButton({
		// 	label: _('API provider\'s website'), 
		// 	halign: Gtk.Align.END,
		// 	uri: 'https://currencylayer.com/'}), 5, 0, 1, 1);

		let save_api_provider_button = new Gtk.Button({label: 'Save'});
		this._grid.attach(save_api_provider_button, 5, 0, 1, 1);
		save_api_provider_button.connect('clicked', Lang.bind(this, function() {
			Settings.set_string('api-provider', providers_combobox.get_active_id());
		}));

		/* API key field */
		let api_key_field = new Gtk.Entry({hexpand: true});
		this._grid.attach(new Gtk.Label({
			label: _('API Key'),
			halign: Gtk.Align.START,
			margin_left: MARGIN_LEFT
		}), 0, 1, 1, 1);
		api_key_field.set_text(Settings.get_string('api-key'));
		// api_key_field.connect('changed', Lang.bind(this, function() {
		// 	let c = new Gdk.Color();
		// 	c = Gdk.Color.parse("black", c)[1];
		// 	api_key_field.modify_fg(Gtk.StateType.NORMAL, c);
		// }));
		this._grid.attach(api_key_field, 1, 1, 3, 1);

		let test_api_key_button = new Gtk.Button({label: 'Save'});

		test_api_key_button.connect('clicked', Lang.bind(this, function() {
			// this.converter.setAPIKey(api_key_field.text);
			// this.converter.is_api_key_valid(function(result_api_key_is_valid) {
			// 	/* set green is the api key is correct, or red otherwise */
			// 	let c = new Gdk.Color();
			// 	if (result_api_key_is_valid) {
			// 		c = Gdk.Color.parse("green", c)[1];
			// 	} else {
			// 		c = Gdk.Color.parse("red", c)[1];
			// 	}
			// 	api_key_field.modify_fg(Gtk.StateType.NORMAL, c);
				Settings.set_string('api-key', api_key_field.text);
				// return;
			// });
		}));
		this._grid.attach(test_api_key_button, 5, 1, 1, 1);


		this.vbox.pack_start(stack_switcher, false, true, 0);
		this.vbox.pack_start(stack, true, true, 0);

		return;
	},

	_completePrefsWidget: function() {
		// let new_fav_currencies = Settings.get_string('favorite-currencies');
		// if (this.original_fav_currencies != new_fav_currencies) {
		// 	Settings.set_string('favorite-currencies', new_fav_currencies);
		// }
        let scrollingWindow = new Gtk.ScrolledWindow({
                                 'hscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                 'vscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                 'hexpand': true, 'vexpand': true});
        scrollingWindow.add_with_viewport(this.vbox);
        scrollingWindow.width_request = 700;
        scrollingWindow.height_request = 650;
        scrollingWindow.show_all();
		scrollingWindow.unparent();

		scrollingWindow.connect('destroy', Lang.bind(this, function() {
			if (Settings.get_int('init-amount').toString() !== this.init_amount_field.get_text()) {
				Settings.set_int('init-amount', parseInt(this.init_amount_field.get_text()));
			}
		}));
        return scrollingWindow;
    },

	// apply_tags: function() {
	// 	let start, end;
	// 	let i = 0;
	// 	let currencies = this.get_text_buffer_text();
	// 	// currencies = currencies.replace(' ', '');
	// 	// var spaced_currencies = '';
	// 	// global.log('spaced_currencies: ' + spaced_currencies);
	// 	// while(i < currencies.length) {
	// 	// 	spaced_currencies = spaced_currencies + currencies.substr(i, 3);
	// 	// 	spaced_currencies = spaced_currencies + ' '; 
	// 	// 	global.log('spaced_currencies: ' + spaced_currencies);
	// 	// 	i += 3;
	// 	// }
	// 	// this.text_buffer.set_text(spaced_currencies, -1);
	// 	i = 0;
	// 	// while(i < Settings.get_string('favorite-currencies').length) {
	// 	while(i < currencies.length) {
	// 		start = this.text_buffer.get_iter_at_line_index(0, i);
	// 		end = this.text_buffer.get_iter_at_line_offset(0, i + 3);
	// 		this.text_buffer.apply_tag(this.currency_tag, start, end);

	// 		i += 4;
	// 	}
	// },

	get_text_buffer_text: function() {
		let start = this.text_buffer.get_start_iter();
		let end = this.text_buffer.get_end_iter();
		return this.text_buffer.get_text(start, end, true);
	}
};

function init() {
}

function CurrencyConverterSettingsWidget(converter) {
    this._init(converter);
}

function buildPrefsWidget(converter) {
    let widget = new CurrencyConverterSettingsWidget(converter);
	return widget._completePrefsWidget();
}
