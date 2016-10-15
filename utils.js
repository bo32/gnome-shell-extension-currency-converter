/* From http://blog.tompawlak.org/number-currency-formatting-javascript */
function formatCurrencyNumber (num) {
	return num
		.toFixed(get_nb_decimals(num))
		.replace(".", ",") // replace decimal point character with ,
		.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.") // use . as a separator
}

function get_nb_decimals(amount) {
	if (amount >= 1000) {
		return 0;
	} else if(amount > 1) {
		return 2;
	} else if (amount > 0.01) {
		return 3;
	} else {
		return 5;
	}
}

function split_every_offset(string, offset) {
	let result = new Array();
	let i = 0;
	
	while(i < string.length) {
		result.push(string.substr(i, offset));
		i += 3;
	}
	return result;
}
