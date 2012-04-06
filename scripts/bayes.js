//Depends on jQuery and underscore
define([
	"jquery",
	"underscore",
	"text!./templates/bayes.html",
	"text!./templates/hypothesis.html",
	"text!./css/bayes.css",
	"../scripts/jquery.tools.min.js",
	"../scripts/html5slider.js",
	"../scripts/d3.v2.min.js"
], function ($, _, bayes, hypothesis, style) {

	//$: jQuery
	//_: underscore
	//bayes: bayes main template
	//hypothesis: hypothesis template
	//style: less styles

	if (!_.isUndefined(MathJax)) {

		MathJax.Hub.Config({displayAlign: "left"});

	} else {

		var MathJax= false;
		console.log('math jax not found');

	}
	
	return function() {

		var self = {

			config: {

				type: "simple", //options ["simple", "full"]
				selector: false,
				el: false,
				templates: {
					bayes: _.template(bayes),
					hypothesis: _.template(hypothesis)
				},
				afortiori: false,
				num: 1,
				equation: true,
				css: {
					width: "500px"
				},
				graph: false

			},

			init: function (config) {

				if (_.isString(config)) {

					self.config.selector = config;

				} else {

					_.extend(self.config, config);

				}

				if (_.isUndefined(config.css) || _.isUndefined(config.css.width)) {

					var width = 500;

					if (self.config.num <= 2) {

						self.config.num = 1;

					} else {

						width = 290 * self.config.num;

					}

					if (self.config.graph) {

						width += 440;

					}

					self.config.css.width = width + "px";

				}

				self.render();

			},

			render: function () {

				//Render css

				if (!$('#bayes-calc-styles').length) {

					self.css(style);

				}

				//Render templates into selector.

				if (self.config.selector || self.config.el.length) {

					self.config.el = self.config.el.length ? self.config.el : $(self.config.selector);

					self.config.el.css(self.config.css);

					if (self.config.el.length) {

						self.config.el.html(self.template('bayes'));

						if (self.config.graph) {

							self.graph('hypotheses');
							self.graph('expected-evidence');
							self.graph('posteriors');

						}

						if (MathJax) MathJax.Hub.Queue(["Typeset", MathJax.Hub, self.config.el.get(0)]);

						//Attach events
						self.events();

					} else {

						self.error('Not configured correctly');

					}

				} else {

					self.error('Not configured correctly');

				}

			},

			events: function () {

				var $form = self.config.el.find('form');

				$form.delegate('input[type=range]', 'change', function() {
					self.sync_fields($(this), 'number');
					self.update_calc();
				});

				$form.delegate('input[type=number]', 'change', function() {
					self.sync_fields($(this), 'range');
					self.update_calc();
				});

				$form.delegate('label[title],input[title],button[title]', 'mouseover', function() {
					var $this = $(this);
					if (!$this.data("tooltip")) {
						$this.tooltip({
							position: "center right",
							tipClass: "bayes-tooltip"
						}).trigger('mouseover');
					}
				});

			},

			update_calc: function () {

				var data = self.data();

				if (self.config.num > 2) {

					var calc = [];

					for (var i = 1; i <= self.config.num; i++) {

						calc.push({
							eb: data['eb_' + i] ? data['eb_' + i] : 0,
							ehb: data['ehb_' + i] ? data['ehb_' + i] : 0,
							hb: data['hb_' + i] ? data['hb_' + i] : 0,
							heb: data['heb_' + i] ? data['heb_' + i] : 0,
							nhb: data['nhb_' + i] ? data['nhb_' + i] : 0,
							enhb: data['enhb_' + i] ? data['enhb_' + i] : 0,
						});

					}

					for (var i = 0; i < self.config.num; i++) {

						self.config.el.find('.field-heb .inputs:eq(' + i + ') span').text(self.round(self.calculate(_.sortBy(calc, function (val, index) {
							return index == i ? 0 : 1;
						})), 2));

					}

				} else {

					for (var i = 1; i <= self.config.num; i++) {

						if (_.isArray(data['hb_' + i])) {

							for (var j = 0; j < data['hb_' + i].length; j++) {

								self.config.el.find('.field-heb .inputs:eq(' + j + ') span').text(self.round(self.calculate({
									eb: data['eb_' + i] ? data['eb_' + i][j] : 0,
									ehb: data['ehb_' + i] ? data['ehb_' + i][j] : 0,
									hb: data['hb_' + i] ? data['hb_' + i][j] : 0,
									heb: data['heb_' + i] ? data['heb_' + i][j] : 0,
									nhb: data['nhb_' + i] ? data['nhb_' + i][j] : 0,
									enhb: data['enhb_' + i] ? data['enhb_' + i][j] : 0,
								}), 2));

							}

						} else {

							var calc = self.round(self.calculate({
								eb: data['eb_' + i],
								ehb: data['ehb_' + i],
								hb: data['hb_' + i],
								heb: data['heb_' + i],
								nhb: data['nhb_' + i],
								enhb: data['enhb_' + i],
							}), 2);

							self.config.el.find('.field-heb .inputs:eq(' + (i - 1) + ') span').text(calc);
							self.config.el.find('.field-heb .inputs:eq(' + (i - 1) + ') input').val(calc);

						}

					}

				}

				if (self.config.graph) {

					self.graph_redraw('hypotheses');
					self.graph_redraw('expected-evidence');
					self.graph_redraw('posteriors');

				}

			},

			calculate: function (calc) {

				var numerator = 0,
				denominator = [];

				if (_.isArray(calc)) {

					numerator = parseFloat(calc[0].hb) * parseFloat(calc[0].ehb);

					_.each(calc, function (val) {
						denominator.push(parseFloat(val.hb) * parseFloat(val.ehb));
					});

					return numerator / _.reduce(denominator, function (mem, val) {
						return mem + val;
					});

				} else {

					if (calc.enhb > 0) {

						return (parseFloat(calc.hb) * parseFloat(calc.ehb)) / (parseFloat(calc.hb) * parseFloat(calc.ehb) + parseFloat(calc.nhb) * parseFloat(calc.enhb));

					} else {

						return parseFloat(calc.eb) != 0 ? (parseFloat(calc.hb) * parseFloat(calc.ehb)) / parseFloat(calc.eb) : 0;

					}

				}

			},

			sync_fields: function($this, type) {

				var $field = $this.closest('.field'),
				$fields = $field.siblings('.field'),
				$inputs = $field.find('.inputs'),
				$input = $this.closest('.inputs'),
				i = $inputs.index($input);
				$this.siblings('input[type=' + type + ']').val($this.val());
				
				if ($field.hasClass('field-hb')) {
					$fields.filter('.field-nhb').find('.inputs:eq(' + i + ') input').val(self.round(1 - parseFloat($this.val()), 2));
				}
				if ($field.hasClass('field-nhb')) {
					$fields.filter('.field-hb').find('.inputs:eq(' + i + ') input').val(self.round(1 - parseFloat($this.val()), 2));
				}

			},

			data: function () {

				var data = {};

				_.each(self.config.el.find('form input[type=number],form input[type=hidden]').serializeArray(), function(obj) {

				  if (data.hasOwnProperty(obj.name)) {

						data[obj.name] = $.makeArray(data[obj.name]);
						data[obj.name].push(obj.value);

				  } else {

						data[obj.name] = obj.value;

					}

				});

				return data;

			},

			fields: function (num) {

				var fields = [],
				field_types = [
					{
						alias: 'hb single',
						name: 'hb',
						label: '\\(\\mathrm{\\Pr( H \\mid b )}\\)',
						className: 'hb',
						val: 0.5,
						title: 'Probability that the hypothesis is true given the background evidence',
						disabled: false,
						type: 'number' 
					}, {
						name: 'hb',
						label: '\\(\\mathrm{\\Pr( H_<%= num %> \\mid b )}\\)',
						className: 'hb',
						val: 0.5,
						title: 'Probability that the hypothesis is true given the background evidence',
						disabled: false,
						type: 'number' 
					}, {
						name: 'nhb',
						label: '\\(\\mathrm{\\Pr( \\neg{H} \\mid b )}\\)',
						className: 'nhb',
						val: 0.5,
						title: 'Probability that the hypothesis is false given the background evidence',
						disabled: false,
						type: 'number'
					}, {
						name: 'ehb',
						label: '\\(\\mathrm{\\Pr( E \\mid H_<%= num %>.b )}\\)',
						className: 'ehb',
						val: 0,
						title: 'Probability that the evidence is true given that the hypothesis is true and the background evidence',
						disabled: false,
						type: 'number'
					}, {
						alias: 'ehb single',
						name: 'ehb',
						label: '\\(\\mathrm{\\Pr( E \\mid H.b )}\\)',
						className: 'ehb',
						val: 0,
						title: 'Probability that the evidence is true given that the hypothesis is true and the background evidence',
						disabled: false,
						type: 'number'
					}, {
						name: 'eb',
						label: '\\(\\mathrm{\\Pr( E \\mid b )}\\)',
						className: 'eb',
						val: 0,
						title: 'Probability that the evidence is true given the background evidence',
						hint: 'Must be greater than 0',
						disabled: false,
						type: 'number'
					}, {
						alias: 'enhb single',
						name: 'enhb',
						label: '\\(\\mathrm{\\Pr( E \\mid \\neg{H}.b )}\\)',
						className: 'enhb',
						val: 0,
						title: 'Probability that the evidence is true given that the hypothesis is false and the background evidence',
						disabled: false,
						type: 'number'
					}, {
						name: 'enhb',
						label: '\\(\\mathrm{\\Pr( E \\mid H_<%= num %>.b )}\\)',
						className: 'enhb',
						val: 0,
						title: 'Probability that the evidence is true given that the hypothesis is false and the background evidence',
						disabled: false,
						type: 'number'
					}, {
						name: 'heb',
						label: '\\(\\mathrm{\\Pr( H_<%= num %> \\mid E.b )}\\)',
						className: 'heb',
						val: 0,
						title: 'Probability that the hypothesis is true given that the evidence is true and the background evidence',
						disabled: true,
						type: 'number'
					}, {
						alias: 'heb single',
						name: 'heb',
						label: '\\(\\mathrm{\\Pr( H \\mid E.b )}\\)',
						className: 'heb',
						val: 0,
						title: 'Probability that the hypothesis is true given that the evidence is true and the background evidence',
						disabled: true,
						type: 'number'
					}
				];

				switch (self.config.type) {

					case 'simple':

						var include = self.config.num > 2 ? [] : ['hb single', 'nhb', 'ehb single', 'eb', 'heb single'];

						fields = _.filter(field_types, function (value) {
							return _.include(include, value.alias ? value.alias : value.name);
						});

						break;

					case 'full':

						var include = self.config.num > 2 ? ['hb', 'ehb', 'heb'] : ['hb single', 'nhb', 'ehb single', 'enhb single', 'heb single'];

						fields = _.filter(field_types, function (value) {
							return _.include(include, value.alias ? value.alias : value.name)
						});

						break;

				}

				return fields;

			},

			//returns rendered template as html

			template: function (template, options) {

				return self.config.templates[template] && self.config.templates[template](_.extend({
					bayes: self,
					templates: self.config.templates
				}, options));

			},

			hypothesis: function (options) {

				return self.template('hypothesis', _.extend({ num: 1 }, options));

			},


			round: function(num, dec) {

				return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);

			},

			equation: function () {

				var left = '',
				numerator = '',
				denominator = [];

				if (self.config.num == 1) {

					var left = '\\Pr( H \\mid E.b )',
					numerator = '\\Pr( H \\mid b ) \\Pr( E \\mid H.b )',
					denominator = [];

					if (self.config.type == 'simple') {

						denominator.push('\\Pr( E \\mid b )');

					} else {

						denominator.push('\\Pr( H \\mid b ) \\Pr( E \\mid H.b )');
						denominator.push('\\Pr(\\neg{H} \\mid b ) \\Pr( E \\mid \\neg{H}.b )');

					}

				} else {

					left = '\\Pr( H_1 \\mid E.b )';
					numerator = '\\Pr( H_1 \\mid b )Pr( E \\mid H_1.b )';

					for (var i = 1; i <= self.config.num; i++) {

						denominator.push('\\Pr( H_' + i + ' \\mid b ) \\Pr( E \\mid H_' + i + '.b )');

					}

				}

				return '$$\\mathrm{' + left + ' = \\frac{' + numerator + '}{' + denominator.join(' + ') + '}}$$';


			},

			graph_data: function (class_name) {
				
				var raw = self.data();

				var data = [],
				labels = [];

				switch (class_name) {

					case 'hypotheses':
						if (self.config.num == 1) {
							data = [raw['hb_1'], raw['nhb_1']];
							labels = ['Pr(H|b)', 'Pr(¬H|b)'];
						}
						break;

					case 'expected-evidence':
						if (self.config.num == 1) {
							if (self.config.type == 'simple') {
								data = [raw['ehb_1'], raw['eb_1'] != 0 ? (raw['eb_1'] - raw['hb_1'] * raw['ehb_1']) / raw['nhb_1'] : 0];
							} else {
								data = [raw['ehb_1'], raw['enhb_1']];
							}
							labels = ['Pr(E|H)', 'Pr(E|¬H)'];
						}
						break;

					case 'posteriors':
						if (self.config.num == 1) {
							data = [raw['heb_1'], 1 - raw['heb_1']];
							labels = ['Pr(H|E.b)', 'Pr(¬H|E.b)'];
						}
						break;

				}

				return [_.map(data, function (val) {
					return self.round(val, 2);
				}), labels];

			},

			graph: function (class_name) {

				var data_labels = self.graph_data(class_name),
				data = data_labels[0],
				labels = data_labels[1],
				markers = [0, 0.25, 0.5, 0.75, 1],
				width = 400,
				height = 100;

				var chart = d3.select(self.config.el.find('.bayes-graph').get(0))
					.append("svg")
					.attr("class", class_name)
					.attr("width", width + 20)
					.attr("height", height + 20)
					.append("g")
					.attr("transform", "translate(10,15)");

				var x = function (d) {
					return d * width;
				}

				chart.selectAll("line")
					.data(markers)
					.enter().append("line")
					.attr("x1", x)
					.attr("x2", x)
					.attr("y1", 0)
					.attr("y2", height)
					.style("stroke", "#ccc");

				chart.selectAll(".rule")
					.data(markers)
					.enter().append("text")
					.attr("class", "rule")
					.attr("x", x)
					.attr("y", 0)
					.attr("dy", -3)
					.attr("text-anchor", "middle")
					.text(String);

				chart.selectAll("rect")
					.data(data)
					.enter().append("rect")
					.attr("y", function(d, i) { return i * (height / data.length); } )
					.attr("width", x)
					.attr("height", (height / data.length));

				chart.selectAll(".bar")
					.data(data)
					.enter().append("text")
					.attr("class", "bar")
					.attr("x", x)
					.attr("dx", -3) // padding-right
					.attr("y", function(d, i) { return i * (height / data.length) + (height / data.length / 2); } )
					.attr("dy", ".35em") // vertical-align: middle
					.attr("text-anchor", "end") // text-align: right
					.text(String);

				chart.selectAll(".eq")
					.data(labels)
					.enter().append("text")
					.attr("class", "eq")
					.attr("x", 0)
					.attr("dx", 3) // padding-left
					.attr("y", function(d, i) { return i * (height / data.length) + (height / data.length / 2); } )
					.attr("dy", ".35em") // vertical-align: middle
					.attr("text-anchor", "start") // text-align: right
					.text(String);

			},

			graph_redraw: function (class_name) {

				var chart = d3.select(self.config.el.find(".bayes-graph ." + class_name).get(0));

				var data_labels = self.graph_data(class_name),
				data = data_labels[0];

				chart.selectAll("rect")
					.data(data)
					.transition()
					.duration(1000)
					.attr("width", function (d) {
						return d * 400;
					});

				chart.selectAll(".bar")
					.data(data)
					.transition()
					.duration(1000)
					.attr("x", function (d) {
						return d * 400;
					})
					.text(String);

			},

			//adds less text to dom

			css: function (css) {

				style = document.createElement('style');
				style.type = 'text/css';
				style.id = "bayes-calc-styles";

				if (style.styleSheet) {

					style.styleSheet.cssText = css;

				} else {

					style.appendChild( document.createTextNode( css ) );

				}
				
				document.getElementsByTagName("head")[0].appendChild( style );

			},

			error: function (msg) {

				console.log('Bayes app error: ' + msg);

			}

		};

		return self;

	};

});