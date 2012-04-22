//Depends on jQuery and underscore
define([
	"jquery",
	"underscore",
	"text!./templates/bayes.html",
	"text!./templates/hypothesis.html",
	"text!./css/bayes.css",
	"../scripts/modernizr-custom.js",
	"../scripts/jquery.tools.min.js",
	"../scripts/html5slider.js",
	"../scripts/d3.v2.min.js"
], function ($, _, bayes, hypothesis, style) {

	return function() {

		var self = {

			config: {

				type: "simple",
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
				graph: false,
				styleSelector: "bayes-calc-styles"

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

				if (_.isBoolean(self.config.graph) && self.config.graph) {

					self.config.graph = 'bar';

				}

				self.render();

			},

			render: function () {

				//Render css

				if (!$('#' + self.config.styleSelector).length) {

					self.css(style);

				}

				//Render templates into selector.

				if (self.config.selector || self.config.el.length) {

					self.config.el = self.config.el.length ? self.config.el : $(self.config.selector);

					self.config.el.css(self.config.css);

					if (self.config.el.length) {

						self.config.el.hide().html(self.template('bayes'));

						if (!Modernizr.inputtypes.range && !$.browser.mozilla) {

							self.config.el.addClass('no-range');

						}

						if (self.config.graph) {

							self.graph();

						}

						//Attach events
						self.events();

						MathJax.Hub.Register.StartupHook("TeX Jax Ready", function () {
							MathJax.Hub.Config({displayAlign: "left"});
							MathJax.Hub.Queue(["Typeset", MathJax.Hub, self.config.el.get(0)]);
							MathJax.Hub.Queue(["fadeIn", self.config.el]);
						});

					}

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

			constrain_data: function () {

				if (self.config.type == 'simple') {

					var data = self.data(),
					min = parseFloat(data['hb_1']) * parseFloat(data['ehb_1']),
					max = min + parseFloat(data['nhb_1']),
					$inputs = self.config.el.find('.field-eb .inputs:eq(0) input');

					if (parseFloat(data['eb_1']) < min) {

						$inputs.val(min);

					}

					if (parseFloat(data['eb_1']) > max) {

						$inputs.val(max);

					}

					$inputs.attr('min', self.round(min, 2)).attr('max', self.round(max, 2));

				}

			},

			update_calc: function () {

				self.constrain_data();

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

						var val = self.round(self.calculate(_.sortBy(calc, function (val, index) {
							return index == i ? 0 : 1;
						})), 2);

						self.config.el.find('.field-heb .inputs:eq(' + i + ') span').text(val);
						self.config.el.find('.field-heb .inputs:eq(' + i + ') input').val(val);

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
						label: '\\(\\mathrm{\P( H \\mid b )}\\)',
						className: 'hb',
						val: 0.5,
						title: 'Probability that the hypothesis is true given the background evidence',
						disabled: false,
						type: 'number' 
					}, {
						name: 'hb',
						label: '\\(\\mathrm{\P( H_<%= num %> \\mid b )}\\)',
						className: 'hb',
						val: 0.5,
						title: 'Probability that the hypothesis is true given the background evidence',
						disabled: false,
						type: 'number' 
					}, {
						name: 'nhb',
						label: '\\(\\mathrm{\P( \\neg{H} \\mid b )}\\)',
						className: 'nhb',
						val: 0.5,
						title: 'Probability that the hypothesis is false given the background evidence',
						disabled: false,
						type: 'number'
					}, {
						name: 'ehb',
						label: '\\(\\mathrm{\P( E \\mid H_<%= num %>.b )}\\)',
						className: 'ehb',
						val: 0.5,
						title: 'Probability that the evidence is true given that the hypothesis is true and the background evidence',
						disabled: false,
						type: 'number'
					}, {
						alias: 'ehb single',
						name: 'ehb',
						label: '\\(\\mathrm{\P( E \\mid H.b )}\\)',
						className: 'ehb',
						val: 0.5,
						title: 'Probability that the evidence is true given that the hypothesis is true and the background evidence',
						disabled: false,
						type: 'number'
					}, {
						name: 'eb',
						label: '\\(\\mathrm{\P( E \\mid b )}\\)',
						className: 'eb',
						val: 0,
						title: 'Probability that the evidence is true given the background evidence',
						hint: 'Must be greater than 0',
						disabled: false,
						type: 'number'
					}, {
						alias: 'enhb single',
						name: 'enhb',
						label: '\\(\\mathrm{\P( E \\mid \\neg{H}.b )}\\)',
						className: 'enhb',
						val: 0.5,
						title: 'Probability that the evidence is true given that the hypothesis is false and the background evidence',
						disabled: false,
						type: 'number'
					}, {
						name: 'enhb',
						label: '\\(\\mathrm{\P( E \\mid H_<%= num %>.b )}\\)',
						className: 'enhb',
						val: 0.5,
						title: 'Probability that the evidence is true given that the hypothesis is false and the background evidence',
						disabled: false,
						type: 'number'
					}, {
						name: 'heb',
						label: '\\(\\mathrm{\P( H_<%= num %> \\mid E.b )}\\)',
						className: 'heb',
						val: 0.5,
						title: 'Probability that the hypothesis is true given that the evidence is true and the background evidence',
						disabled: true,
						type: 'number'
					}, {
						alias: 'heb single',
						name: 'heb',
						label: '\\(\\mathrm{\P( H \\mid E.b )}\\)',
						className: 'heb',
						val: 0.5,
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

					var left = '\P( H \\mid E.b )',
					numerator = '\P( H \\mid b ) \P( E \\mid H.b )',
					denominator = [];

					if (self.config.type == 'simple') {

						denominator.push('\P( E \\mid b )');

					} else {

						denominator.push('\P( H \\mid b ) \P( E \\mid H.b )');
						denominator.push('\P(\\neg{H} \\mid b ) \P( E \\mid \\neg{H}.b )');

					}

				} else {

					left = '\P( H_1 \\mid E.b )';
					numerator = '\P( H_1 \\mid b )P( E \\mid H_1.b )';

					for (var i = 1; i <= self.config.num; i++) {

						denominator.push('\P( H_' + i + ' \\mid b ) \P( E \\mid H_' + i + '.b )');

					}

				}

				return '$$\\mathrm{' + left + ' = \\frac{' + numerator + '}{' + denominator.join(' + ') + '}}$$';


			},

			graph_data: function (class_name) {
				
				var raw = self.data();

				var data = [],
				labels = [],
				not = "¬";

				switch (class_name) {

					case 'hypotheses':
						if (self.config.num == 1) {
							data = [raw['hb_1'], raw['nhb_1']];
							labels = ['P(H|b)', 'P(' + not + 'H|b)'];
						} else {
							for (var i = 1; i <= self.config.num; i++) {
								data.push(raw['hb_' + i]);
								labels.push('P(H' + i + '|b)');
							}
						}
						break;

					case 'expected-evidence':
						if (self.config.num == 1) {
							if (self.config.type == 'simple') {
								data = [raw['ehb_1'], raw['eb_1'] != 0 ? (raw['eb_1'] - raw['hb_1'] * raw['ehb_1']) / raw['nhb_1'] : 0];
							} else {
								data = [raw['ehb_1'], raw['enhb_1']];
							}
							labels = ['P(E|H)', 'P(E|' + not + 'H)'];
						} else {
							for (var i = 1; i <= self.config.num; i++) {
								data.push(raw['ehb_' + i]);
								labels.push('P(E|H' + i + '.b)');
							}
						}
						break;

					case 'posteriors':
						if (self.config.num == 1) {
							data = [raw['heb_1'], 1 - raw['heb_1']];
							labels = ['P(H|E.b)', 'P(' + not + 'H|E.b)'];
						} else {
							for (var i = 1; i <= self.config.num; i++) {
								data.push(raw['heb_' + i]);
								labels.push('P(H' + i + '|E.b)');
							}
						}
						break;

				}

				return [_.map(data, function (val) {
					return self.round(val, 2);
				}), labels];

			},

			graph: function () {

				switch (self.config.graph) {

					case 'bar':
						self.graph_bar('hypotheses');
						self.graph_bar('expected-evidence');
						self.graph_bar('posteriors');
						break;

					case 'circle':
						self.graph_circle();
						break;

				}

			},

			graph_circle: function () {

				var hypotheses_data_labels = self.graph_data('hypotheses'),
					expected_data_labels = self.graph_data('expected-evidence'),
					posteriors_data_labels = self.graph_data('posteriors'),
					width = 400,
					height = 400,
					width_div = width / 3,
					height_div = height / hypotheses_data_labels[0].length,
					r_factor = 0.85,
					max_r = Math.min(width_div, height_div);

				var chart = d3.select(self.config.el.find('.bayes-graph').get(0))
					.append("svg")
					.attr("width", width)
					.attr("height", height);

				chart.selectAll(".circle-hypotheses")
					.data(hypotheses_data_labels[0])
					.enter().append("circle")
					.attr('class', function (v, i) {
						return 'circle-hypotheses circle-hypotheses-' + i;
					})
					.attr("cx", width_div - (width_div / 2))
					.attr("cy", function (v, i) {
						return (height_div * (i + 1)) - (height_div / 2);
					})
					.attr("r", function (v) {
						return Math.sqrt(v) * (max_r / 2) * r_factor; 
					});

				chart.selectAll(".prior-label")
					.data(hypotheses_data_labels[0])
					.enter().append("text")
					.attr("class", "prior-label")
					.attr("x", width_div - (width_div / 2))
					.attr("y", function (v, i) {
						return (height_div * (i + 1)) - (height_div / 2);
					})
					.attr("dy", "0.35em")
					.attr("text-anchor", "middle")
					.text(function (v) {
						return String(self.round(v * 100, 2)) + '%';
					});

				chart.selectAll(".prior-eq-label")
					.data(hypotheses_data_labels[1])
					.enter().append("text")
					.attr("class", "prior-eq-label")
					.attr("x", width_div - (width_div / 2))
					.attr("y", function (v, i) {
						return (height_div * (i + 1)) - (height_div / 2) - (Math.sqrt(hypotheses_data_labels[0][i]) * (max_r / 2) * r_factor);
					})
					.attr("dy", "-0.5em")
					.attr("text-anchor", "middle")
					.text(String);

				var expected_start = 0.15 * height,
					expected_height = 0.70 * height,
					expected_heights = [],
					expected_sum = _.reduce(expected_data_labels[0], function (mem, v) {
						return mem + v;
					});

				_.each(expected_data_labels[0], function (v) {
					expected_heights.push( expected_sum ? (v / expected_sum) * expected_height : 0);
				});

				chart.selectAll(".circle-expecteds")
					.data(expected_data_labels[0])
					.enter().append("rect")
					.attr('class', function (v, i) {
						return 'circle-expecteds circle-expected-' + i;
					})
					.attr("x", (width_div * 2) - (width_div / 2) - 30)
					.attr("y", function (v, i) {
						return expected_start + _.reduce(expected_heights.slice(0, i), function (mem, v) { return mem + v; }, 0);
					})
					.attr("width", 60)
					.attr("height", function (v, i) { return expected_heights[i]; });

				chart.selectAll(".expected-main-label")
					.data(['likelihood ratios'])
					.enter().append("text")
					.attr("class", "expected-main-label")
					.attr("x", (width_div * 2) - (width_div / 2))
					.attr("y", expected_start)
					.attr("dy", "-10px")
					.attr("text-anchor", "middle")
					.text(String);

				chart.selectAll(".expected-label")
					.data(expected_data_labels[1])
					.enter().append("text")
					.attr("class", "expected-label")
					.attr("x", (width_div * 2) - (width_div / 2))
					.attr("y", function (v, i) {
						return expected_start + _.reduce(expected_heights.slice(0, i), function (mem, v) { return mem + v; }, 0);
					})
					.attr("dy", "20px")
					.attr("text-anchor", "middle")
					.text(String);

				chart.selectAll(".circle-posterior")
					.data(posteriors_data_labels[0])
					.enter().append("circle")
					.attr('class', function (v, i) {
						return 'circle-posterior circle-posterior-' + i;
					})
					.attr("cx", (width_div * 3) - (width_div / 2))
					.attr("cy", function (v, i) {
						return (height_div * (i + 1)) - (height_div / 2);
					})
					.attr("r", function (v) {
						return Math.sqrt(v) * (max_r / 2) * r_factor;
					});

				chart.selectAll(".post-label")
					.data(posteriors_data_labels[0])
					.enter().append("text")
					.attr("class", "post-label")
					.attr("x", (width_div * 3) - (width_div / 2))
					.attr("y", function (v, i) {
						return (height_div * (i + 1)) - (height_div / 2);
					})
					.attr("dy", ".35em")
					.attr("text-anchor", "middle")
					.text(function (v) {
						return String(self.round(v * 100, 2)) + '%';
					});

				chart.selectAll(".post-eq-label")
					.data(posteriors_data_labels[1])
					.enter().append("text")
					.attr("class", "post-eq-label")
					.attr("x", (width_div * 3) - (width_div / 2))
					.attr("y", function (v, i) {
						return (height_div * (i + 1)) - (height_div / 2) - (Math.sqrt(posteriors_data_labels[0][i]) * (max_r / 2) * r_factor);
					})
					.attr("dy", "-0.5em")
					.attr("text-anchor", "middle")
					.text(String);

			},

			graph_bar: function (class_name) {

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

			graph_redraw: function () {

				switch (self.config.graph) {

					case 'bar':
						self.graph_redraw_bar('hypotheses');
						self.graph_redraw_bar('expected-evidence');
						self.graph_redraw_bar('posteriors');
						break;

					case 'circle':
						self.graph_redraw_circle();
						break;

				}

			},

			graph_redraw_circle: function () {

				var hypotheses_data_labels = self.graph_data('hypotheses'),
					expected_data_labels = self.graph_data('expected-evidence'),
					posteriors_data_labels = self.graph_data('posteriors'),
					width = 400,
					height = 400,
					width_div = width / 3,
					height_div = height / hypotheses_data_labels[0].length,
					r_factor = 0.85,
					max_r = Math.min(width_div, height_div);

				var chart = d3.select(self.config.el.find('.bayes-graph').get(0));

				chart.selectAll(".circle-hypotheses")
					.data(hypotheses_data_labels[0])
					.transition()
					.duration(1000)
					.attr("r", function (v) {
						return Math.sqrt(v) * (max_r / 2) * r_factor;
					});

				chart.selectAll(".prior-label")
					.data(hypotheses_data_labels[0])
					.text(function (v) {
						return String(self.round(v * 100, 2)) + '%';
					});

				chart.selectAll(".prior-eq-label")
					.data(hypotheses_data_labels[1])
					.transition()
					.duration(1000)
					.attr("y", function (v, i) {
						return (height_div * (i + 1)) - (height_div / 2) - (Math.sqrt(hypotheses_data_labels[0][i]) * (max_r / 2) * r_factor);
					})

				var expected_start = 0.15 * height,
					expected_height = 0.70 * height,
					expected_heights = [],
					expected_sum = _.reduce(expected_data_labels[0], function (mem, v) {
						return mem + v;
					});

				_.each(expected_data_labels[0], function (v) {
					expected_heights.push( expected_sum ? (v / expected_sum) * expected_height : 0);
				});

				chart.selectAll(".circle-expecteds")
					.data(expected_data_labels[0])
					.transition()
					.attr("y", function (v, i) {
						return expected_start + _.reduce(expected_heights.slice(0, i), function (mem, v) { return mem + v; }, 0);
					})
					.attr("height", function (v, i) { return expected_heights[i]; });

				chart.selectAll(".expected-label")
					.data(expected_data_labels[1])
					.transition()
					.attr("y", function (v, i) {
						return expected_start + _.reduce(expected_heights.slice(0, i), function (mem, v) { return mem + v; }, 0);
					});

				chart.selectAll(".circle-posterior")
					.data(posteriors_data_labels[0])
					.transition()
					.duration(1000)
					.attr("r", function (v) {
						return Math.sqrt(v) * (max_r / 2) * r_factor;
					});

				chart.selectAll(".post-label")
					.data(posteriors_data_labels[0])
					.text(function (v) {
						return String(self.round(v * 100, 2)) + '%';
					});

				chart.selectAll(".post-eq-label")
					.data(posteriors_data_labels[1])
					.transition()
					.duration(1000)
					.attr("y", function (v, i) {
						return (height_div * (i + 1)) - (height_div / 2) - (Math.sqrt(posteriors_data_labels[0][i]) * (max_r / 2) * r_factor);
					})

			},

			graph_redraw_bar: function (class_name) {

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
				style.id = self.config.styleSelector;

				if (style.styleSheet) {

					style.styleSheet.cssText = css;

				} else {

					style.appendChild( document.createTextNode( css ) );

				}
				
				document.getElementsByTagName("head")[0].appendChild( style );

			}

		};

		return self;

	};

});