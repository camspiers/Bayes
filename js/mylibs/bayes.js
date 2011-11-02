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
      if (calc.length == 1) {
          if (calc[0].enhb > 0) {
            return (parseFloat(calc[0].hb) * parseFloat(calc[0].ehb)) / (parseFloat(calc[0].hb) * parseFloat(calc[0].ehb) + parseFloat(calc[0].nhb) * parseFloat(calc[0].enhb)); 
          } else {
            return parseFloat(calc[0].eb) != 0 ? (parseFloat(calc[0].hb) * parseFloat(calc[0].ehb)) / parseFloat(calc[0].eb) : 0; 
          }
      } else {
        return false;
      }
			
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