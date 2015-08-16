const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const JsonParser = GObject.JsonParser;
const Lang = imports.lang;
const Soup = imports.gi.Soup;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Currencies = Me.imports.currencies;
const Convenience = Me.imports.convenience;
const Settings = Convenience.getSettings();


CurrencyConverterSettingsWidget.prototype = {
	_init: function() {		
		this._grid = new Gtk.Grid({ orientation: Gtk.Orientation.VERTICAL,
                                  row_spacing: 6,
                                  column_spacing: 6 });

		/* API key field */
		this.api_key_field = new Gtk.Entry({hexpand: true});
		this._grid.attach(new Gtk.Label({label: 'API Key'}), 0, 0, 1, 1);
		this.api_key_field.set_text(Settings.get_string('api-key'));
		this._grid.attach(this.api_key_field, 1, 0, 5, 1);

		/* Link to currencylayer.com */
		this._grid.attach(new Gtk.LinkButton({label: 'Currency Layer website', uri: 'https://currencylayer.com/'}), 0, 1, 6, 1);

		/* Favorite currencies field */
		let fav_currencies = Settings.get_string('favorite-currencies').split(',');
		this._grid.attach(new Gtk.Label({label: 'Favorite currencies'}), 0, 2, 1, 1);
		let fav_currencies_field = new Gtk.Entry({hexpand: true, editable: false});
		fav_currencies_field.set_text(Settings.get_string('favorite-currencies'));
		this._grid.attach(fav_currencies_field, 1, 2, 5, 1);

		/* Currency list */
		this._currencyTreeView = new Gtk.TreeView();
		this._currencyTreeView.get_selection().set_mode(Gtk.SelectionMode.SINGLE);

		let columns = { IS_FAVORITE: 0, CODE: 1, NAME: 2 };

		this._treeViewModel = new Gtk.ListStore();
		this._treeViewModel.set_column_types([GObject.TYPE_BOOLEAN, GObject.TYPE_STRING, GObject.TYPE_STRING]);
		this._currencyTreeView.model = this._treeViewModel;

		let favoriteColumn = new Gtk.TreeViewColumn({'title': 'Favorite', 'expand': false, 'resizable': true, 'clickable': true});
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

		let codeColumn = new Gtk.TreeViewColumn({'title': 'Code', 'expand': false, 'resizable': true});
		let codeCell = new Gtk.CellRendererText();
		codeColumn.pack_start(codeCell, true);
        codeColumn.add_attribute(codeCell, 'text', columns.CODE);
		this._currencyTreeView.append_column(codeColumn);

		let nameColumn = new Gtk.TreeViewColumn({'title': 'Name', 'expand': true, 'resizable': true});
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
		this._grid.attach(this._currencyTreeView, 0, 4, 6, 1);
		return;
	},
	
	_get_fav_currencies: function() {
		return this.api_key_field.get_text();
	},
	
	_completePrefsWidget: function() {
        let scollingWindow = new Gtk.ScrolledWindow({
                                 'hscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                 'vscrollbar-policy': Gtk.PolicyType.AUTOMATIC,
                                 'hexpand': true, 'vexpand': true});
        scollingWindow.add_with_viewport(this._grid);
        scollingWindow.width_request = 700;
        scollingWindow.show_all();
        return scollingWindow;
    }
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
