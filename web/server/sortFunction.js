function sortFunction(a,b){
	switch(a.number) {
		case "J":
			var num_a = 11;
			break;
		case "Q":
			var num_a = 12
			break;
		case "K":
			var num_a = 13;
			break;
		case "ACE":
			var num_a = 14
			break;
		default:
			var num_a = parseInt(a.number)
	}
	switch(b.number) {
		case "J":
			var num_b = 11;
			break;
		case "Q":
			var num_b = 12;
			break;
		case "K":
			var num_b = 13;
			break;
		case "ACE":
			var num_b = 14;
			break;
		default:
			var num_b = parseInt(b.number)
	}
	return num_a - num_b
}

module.exports = {
	sortFunction: sortFunction
};