# gnome-shell-extensions-currency-converter

###DESCRIPTION

This gnome-shell extension allows you to quickly convert an amount from a currency to another one.
The currency rates are the current ones proposed on the website www.currencylayer.com. The implementation of the requests is based on the RESTful API available on the website, and ensures an accurate currency rate.

###REQUIREMENTS

Create your free account on www.currencylayer.com. Insert then your personal and unique API key in the Preferences menu.

###FIRST USE
Go to the Preferences window to set your favorite currencies that will be available in the extension.
When the extension starts, the SOURCE currency is based on the FIRST of the favorite currencies list, and the TARGET currency is based on the SECOND of the favorite currencies list. This favorite list is easily cahnged by selecting the checkboxes of the currencies you want.

After changing the favorite currencies, refresh Gnome-shell by Alt+F2 and type 'r', or disable/enable in the extensions of Gnome Tweak Tool.

###CUSTOM CURRENCIES (optional)
The extension allows the user to write the currency code of his choice (e.g. AUD for AUstralian Dollar). If the currency code doesn't exist, the extension will clear the current result and not perform anything.. If the custom currency is valid, it is highlighted in green, and red otherwise.

###RESULT IN THE PANEL MENU
In the preferences, the user can activate the option to display the result of a conversion in the panel menu bar (instead of the original extension's icon). The user can at anytime then clear the result in the panel menu with the Clear button in the bottom rigth corner of the extension menu. 

Valid custom currency:  
![valid_custom](./valid_custom.png)

Invalid custom currency (DKK is then used):  
![invalid_custom](./invalid_custom.png)

###CHANGELOG

2015/10/01: option allowing to enter manually FROM and TO currencies.  
2015/11/23: grabs the focus to the FROM field automatically when the menu is open.  
2016/05/08: version 3.20
2016/09/25: update for the versions 3.21 and 3.22, and displaying the result in the top bar feature
