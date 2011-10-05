var bayes = {
  //
	calc: {
		prior: function (calc) {
			//figure out prior
			var hypotheses = calc.length;
			
		},
		conditional: function (calc) {
			//figure out conditional
			var hypotheses = calc.length;
			
		},
		posterior: function (calc) {
			//figure out posterior
			var hypotheses = calc.length;
			
		}
	},
	validateCalcObject: function (calc) {

		var index, result = true;

		for (index in calc) {
			if (!((calc[index].prior && calc[index].conditional) || (calc[index].prior && calc[index].posterior) || (calc[index].conditional && calc[index].posterior))) {
				result = false;
			}
		}

		return result;

	}
};