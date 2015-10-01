const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const GObject = imports.gi.GObject;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Currencies = Me.imports.currencies;
const Convenience = Me.imports.convenience;
const Settings = Convenience.getSettings();
const Converter = Me.imports.converter.Converter;
const _ = imports.gettext.domain(Me.uuid).gettext;

CurrencyConverterSettingsWidget.prototype = {

	_init: function() {		
		this._grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                  row_spacing: 6,
                                  column_spacing: 6 });

		/* Link to currencylayer.com */
		this._grid.attach(new Gtk.LinkButton({label: _('Currency Layer website'), uri: 'https://currencylayer.com/'}), 0, 0, 1, 1);

		/* API key field */
		let api_key_field = new Gtk.Entry({hexpand: true});
		this._grid.attach(new Gtk.Label({label: _('API Key')}), 0, 1, 1, 1);
		api_key_field.set_text(Settings.get_string('api-key'));
		api_key_field.connect('changed', Lang.bind(this, function() {
			let c = new Gdk.Color();
			c = Gdk.Color.parse("black", c)[1];
			api_key_field.modify_fg(Gtk.StateType.NORMAL, c); 
		}));
		this._grid.attach(api_key_field, 1, 1, 4, 1);
		
		let test_api_key_button = new Gtk.Button({label: 'Test'});		
	
		test_api_key_button.connect('clicked', Lang.bind(this, function() {
			let converter = new Converter('', '', api_key_field.text);
			converter.is_api_key_valid(function(result_api_key_is_valid) {
				/* set green is the api key is correct, or red otherwise */
				let c = new Gdk.Color();
				if (result_api_key_is_valid) {
					c = Gdk.Color.parse("green", c)[1];
				} else {
					c = Gdk.Color.parse("red", c)[1];
				}
				api_key_field.modify_fg(Gtk.StateType.NORMAL, c); 
				Settings.set_string('api-key', api_key_field.text);
				return;
			});
		}));
		this._grid.attach(test_api_key_button, 5, 1, 1, 1);
		
		/* Allow the custom currencies */
		this._grid.attach(new Gtk.Label({label: _('Allow custom currencies'), hexpand: true, halign: Gtk.Align.CENTER}), 0, 2, 1, 1);
		let allow_custom_cur_switch = new Gtk.Switch({active: Settings.get_boolean('allow-custom-currencies'), halign: Gtk.Align.END});
		allow_custom_cur_switch.connect('notify::active', function() {
			Settings.set_boolean('allow-custom-currencies', allow_custom_cur_switch.active);
		});
		this._grid.attach(allow_custom_cur_switch, 5, 2, 1, 1);

		/* Favorite currencies field */
		let fav_currencies = Settings.get_string('favorite-currencies').split(',');
		this._grid.attach(new Gtk.Label({label: _('Favorite currencies')}), 0, 3, 1, 1);
		let fav_currencies_field = new Gtk.Entry({hexpand: true, editable: false});
		fav_currencies_field.set_text(Settings.get_string('favorite-currencies'));
		this._grid.attach(fav_currencies_field, 1, 3, 5, 1);

		/* Currency list */
		let scrolledWindow = new Gtk.ScrolledWindow({vscrollbar_policy: Gtk.PolicyType.AUTOMATIC, hscrollbar_policy: Gtk.PolicyType.AUTOMATIC, visible: true, hexpand: true, vexpand: true});
		this._currencyTreeView = new Gtk.TreeView();
		scrolledWindow.add(this._currencyTreeView);
		this._currencyTreeView.get_selection().set_mode(Gtk.SelectionMode.SINGLE);

		let columns = { IS_FAVORITE: 0, CODE: 1, NAME: 2 };

		this._treeViewModel = new Gtk.ListStore();
		this._treeViewModel.set_column_types([GObject.TYPE_BOOLEAN, GObject.TYPE_STRING, GObject.TYPE_STRING]);
		this._currencyTreeView.model = this._treeViewModel;

		let favoriteColumn = new Gtk.TreeViewColumn({'title': _('Favorite'), 'expand': false, 'resizable': true, 'clickable': true});
		let favoriteCell = new Gtk.CellRendererToggle({'mode': Gtk.CellRendererMode.ACTIVATABLE});
		favoriteCell.activatable = true;
		favoriteColumn.pack_start(favoriteCell, true);
        favoriteColumn.add_attribute(favoriteCell, 'active', columns.IS_FAVORITE);
		favoriteCell.connect('toggled', Lang.bind(this, function(cellRenderer, path) {
				let gtkpath = Gtk.TreePath.new_from_string(path);
				let selection = this._currencyTreeView.get_selection();
				selection.select_path(gtkpath);
				let [ isSelected, model, iter ] = selection.get_selected();
				this._treeViewModel.set(iter, [columns.IS_FAVORITE], [!this._treeViewModel.get_value(iter, columns.IS_FAVORITE)], -1);
				if (this._treeViewModel.get_value(iter, columns.IS_FAVORITE)) {
					/* add currency in list */
					fav_currencies.push(this._treeViewModel.get_value(iter, columns.CODE));
				} else {
					/* remove currency from list */
					let index = fav_currencies.indexOf(this._treeViewModel.get_value(iter, columns.CODE));
					fav_currencies.splice(index, 1);
				}
				//fav_currencies.sort();
				let new_fav_currencies = fav_currencies.join();
				fav_currencies_field.set_text(new_fav_currencies);
				Settings.set_string('favorite-currencies', new_fav_currencies);
		}));
		this._currencyTreeView.append_column(favoriteColumn);

		let codeColumn = new Gtk.TreeViewColumn({'title': _('Code'), 'expand': false, 'resizable': true});
		let codeCell = new Gtk.CellRendererText();
		codeColumn.pack_start(codeCell, true);
        codeColumn.add_attribute(codeCell, 'text', columns.CODE);
		this._currencyTreeView.append_column(codeColumn);

		let nameColumn = new Gtk.TreeViewColumn({'title': _('Name'), 'expand': true, 'resizable': true});
		let nameCell = new Gtk.CellRendererText();
		nameColumn.pack_start(nameCell, true);
        nameColumn.add_attribute(nameCell, 'text', columns.NAME);
		this._currencyTreeView.append_column(nameColumn);

		for(let c in Currencies.currencies) {
			let is_favorite = fav_currencies.indexOf(Currencies.currencies[c]['code']) != -1;
			let iter = this._treeViewModel.append();
			this._treeViewModel.set(iter, 
				[columns.IS_FAVORITE, columns.CODE, columns.NAME],
				[is_favorite, Currencies.currencies[c]['code'], Currencies.currencies[c]['name']],
				-1);	
		}
		//this._currencyTreeView.model.set_sort_column_id(columns.IS_FAVORITE, Gtk.SortType.DESCENDING);
		this._grid.attach(scrolledWindow, 0, 4, 6, 1);
		return;
	},
	
	_completePrefsWidget: function() {
        let scrollingWindow = new Gtk.ScrolledWindow({
                                 'hscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                 'vscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                 'hexpand': true, 'vexpand': true});
        scrollingWindow.add_with_viewport(this._grid);
        scrollingWindow.width_request = 700;
        scrollingWindow.height_request = 650;
        scrollingWindow.show_all();
		scrollingWindow.unparent();
        return scrollingWindow;
    },

};

function init() {
}

function CurrencyConverterSettingsWidget() {
    this._init();
}

function buildPrefsWidget() {
    let widget = new CurrencyConverterSettingsWidget();
	return widget._completePrefsWidget();
}

