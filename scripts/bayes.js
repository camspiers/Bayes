//Depends on jQuery and underscore
define([
	"underscore",
	"../scripts/less-1.1.3.min.js",
	"text!./templates/bayes.html",
	"text!./templates/hypothesis.html",
	"text!./css/bayes.less",
	"../scripts/jquery.tools.min.js"
], function (_, l, bayes, hypothesis, style) {

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
				styles: true,
				num: 1

			},

			init: function (config) {

				if (_.isString(config)) {

					self.config.selector = config;

				} else {

					_.extend(self.config, config);

				}

				self.render();

			},

			render: function () {

				//Render css

				if (self.config.styles) {

					self.less(style);

				}

				//Render templates into selector.

				if (self.config.selector) {

					self.config.el = $(self.config.selector);

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

				for (var i = 1; i <= self.config.num; i++) {

					if (_.isArray(data['eb_' + i])) {

						for (var j = 0; j < data['eb_' + i].length; j++) {

							self.config.el.find('.field-heb .inputs:eq(' + j + ') span').text(self.round(self.calculate({
								eb: data['eb_' + i][j],
								ehb: data['ehb_' + i][j],
								hb: data['hb_' + i][j],
								heb: data['heb_' + i][j],
								nhb: data['nhb_' + i][j],
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

			},

			calculate: function (calc) {
				if (calc.enhb > 0) {
					return (parseFloat(calc.hb) * parseFloat(calc.ehb)) / (parseFloat(calc.hb) * parseFloat(calc.ehb) + parseFloat(calc.nhb) * parseFloat(calc.enhb));
				} else {
					return parseFloat(calc.eb) != 0 ? (parseFloat(calc.hb) * parseFloat(calc.ehb)) / parseFloat(calc.eb) : 0;
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
					$fields.filter('.field-nhb').find('.inputs:eq(' + i + ') input').val(1 - parseFloat($this.val()));
				}
				if ($field.hasClass('field-nhb')) {
					$fields.filter('.field-hb').find('.inputs:eq(' + i + ') input').val(1 - parseFloat($this.val()));
				}

			},

			data: function () {

				var paramObj = {};
				_.each(self.config.el.find('form').serializeArray(), function(obj) {
				  if (paramObj.hasOwnProperty(obj.name)) {
				    paramObj[obj.name] = $.makeArray(paramObj[obj.name]);
				    paramObj[obj.name].push(obj.value);
				  }
				  else {
				    paramObj[obj.name] = obj.value;
				  }
				});

				return paramObj;

			},

			fields: function () {

				switch (self.config.type) {

					case 'simple':

						return [{
							name: 'hb',
							label: '\\(\\mathrm{\\Pr( H_<%= num %> \\mid b )}\\)',
							className: 'hb',
							val: 0.5,
							title: 'Probability that the hypothesis is true given the background evidence',
							disabled: false,
							type: 'number' 
						}, {
							name: 'nhb',
							label: '\\(\\mathrm{\\Pr( \\neg{H}_<%= num %> \\mid b )}\\)',
							className: 'nhb',
							val: 0.5,
							title: 'Probability that the hypothesis is false given the background evidence',
							disabled: false,
							type: 'number'
						},  {
							name: 'ehb',
							label: '\\(\\mathrm{\\Pr( E \\mid H_<%= num %>.b )}\\)',
							className: '',
							val: 0,
							title: 'Probability that the evidence is true given that the hypothesis is true and the background evidence',
							disabled: false,
							type: 'number'
						}, {
							name: 'eb',
							label: '\\(\\mathrm{\\Pr( E \\mid b )}\\)',
							className: '',
							val: 0,
							title: 'Probability that the evidence is true given the background evidence',
							hint: 'Must be greater than 0',
							disabled: false,
							type: 'number'
						}, {
							name: 'heb',
							label: '\\(\\mathrm{\\Pr( H_<%= num %> \\mid E.b )}\\)',
							className: '',
							val: 0,
							title: 'Probability that the hypothesis is true given that the evidence is true and the background evidence',
							disabled: true,
							type: 'number'
						}];

					case 'full':

						return [{
							name: 'hb',
							label: '\\(\\mathrm{\\Pr( H_<%= num %> \\mid b )}\\)',
							className: 'hb',
							val: 0.5,
							title: 'Probability that the hypothesis is true given the background evidence',
							disabled: false,
							type: 'number' 
						}, {
							name: 'nhb',
							label: '\\(\\mathrm{\\Pr( \\neg{H}_<%= num %> \\mid b )}\\)',
							className: 'nhb',
							val: 0.5,
							title: 'Probability that the hypothesis is false given the background evidence',
							disabled: false,
							type: 'number'
						},  {
							name: 'ehb',
							label: '\\(\\mathrm{\\Pr( E \\mid H_<%= num %>.b )}\\)',
							className: '',
							val: 0,
							title: 'Probability that the evidence is true given that the hypothesis is true and the background evidence',
							disabled: false,
							type: 'number'
						}, {
							name: 'enhb',
							label: '\\(\\mathrm{\\Pr( E \\mid \\neg{H}_<%= num %>.b )}\\)',
							className: '',
							val: 0,
							title: 'Probability that the evidence is true given that the hypothesis is false and the background evidence',
							disabled: false,
							type: 'number'
						}, {
							name: 'heb',
							label: '\\(\\mathrm{\\Pr( H_<%= num %> \\mid E.b )}\\)',
							className: '',
							val: 0,
							title: 'Probability that the hypothesis is true given that the evidence is true and the background evidence',
							disabled: true,
							type: 'number'
						}];

				}

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

			//adds less text to dom

			less: function (lessText) {

				(new less.Parser()).parse(lessText, function (err, css) {
					if (err) {
						if (typeof console !== 'undefined' && console.error) {
							console.error(err);
						}
					} else {
						var style = document.createElement('style');
						style.type = 'text/css';
						style.textContent = css.toCSS();
						document.getElementsByTagName("head")[0].appendChild( style );
					}
				});

			},

			error: function (msg) {

				console.log('Bayes app error: ' + msg);

			}

		};

		return self;

	};

});