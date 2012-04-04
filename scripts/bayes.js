//Depends on jQuery and underscore
define([
	"jquery",
	"underscore",
	"text!./templates/bayes.html",
	"text!./templates/hypothesis.html",
	"text!./css/bayes.css",
	"../scripts/jquery.tools.min.js",
	"../scripts/html5slider.js"
], function ($, _, bayes, hypothesis, style) {

	//_: underscore
	//l: nothing
	//bayes: bayes main template
	//hypothesis: hypothesis template
	//style: less styles

	if (MathJax) {

		MathJax.Hub.Config({displayAlign: "left"});

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
				css: {
					width: "400px"
				}

			},

			init: function (config) {

				if (_.isString(config)) {

					self.config.selector = config;

				} else {

					_.extend(self.config, config);

				}

				if (self.config.num == 2) {

					self.config.num = 1;

				}

				self.render();

			},

			render: function () {

				//Render css

				if (!$('#bayes-calc-styles').length) {

					self.css(style);
					// self.less(style);

				}

				//Render templates into selector.

				if (self.config.selector || self.config.el.length) {

					self.config.el = self.config.el ? self.config.el : $(self.config.selector);

					self.config.el.css(self.config.css);

					if (self.config.el.length) {

						self.config.el.html(self.template('bayes'));

						if (MathJax) MathJax.Hub.Queue(["Typeset", MathJax.Hub, self.config.el.get(0)]);

						//Attach events

						self.events();

					} else {

						self.error('No configured');

					}

				} else {

					self.error('No configured');

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

							self.config.el.find('.field-heb .inputs:eq(' + (i - 1) + ') span').text(self.round(self.calculate({
								eb: data['eb_' + i],
								ehb: data['ehb_' + i],
								hb: data['hb_' + i],
								heb: data['heb_' + i],
								nhb: data['nhb_' + i],
								enhb: data['enhb_' + i],
							}), 2));

						}

					}

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
					})

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
				_.each(self.config.el.find('form input[type=number]').serializeArray(), function(obj) {
				  if (data.hasOwnProperty(obj.name)) {
				    data[obj.name] = $.makeArray(data[obj.name]);
				    data[obj.name].push(obj.value);
				  }
				  else {
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
						label: '\\(\\mathrm{\\Pr( E \\mid \\neg{H}_<%= num %>.b )}\\)',
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
				//$$\mathrm{\Pr( H \mid E.b ) = \frac{\Pr( H \mid b ) \Pr( E \mid H.b )}{\Pr( H \mid b ) \Pr( E \mid H.b) + \Pr(\neg{H} \mid b ) \Pr( E \mid \neg{H}.b )}}$$

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
					numerator = '\\Pr( H_1 \\mid E.b )';

					for (var i = 1; i <= self.config.num; i++) {

						denominator.push('\\Pr( H_' + i + ' \\mid b ) \\Pr( E \\mid H_' + i + '.b )');

					}

				}

				return '$$\\mathrm{' + left + ' = \\frac{' + numerator + '}{' + denominator.join(' + ') + '}}$$';


			},

			//adds less text to dom

			less: function (lessText) {

				(new less.Parser()).parse(lessText, function (err, css) {
					if (err) {
						if (typeof console !== 'undefined' && console.error) {
							console.error(err);
						}
					} else {
						self.css(css.toCSS());
					}
				});

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