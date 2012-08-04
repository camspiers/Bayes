/*
 * Bayes Calculator
 * by Cam Spiers
 * MIT http://camspiers.mit-license.org/
 */

/*global define: false, MathJax: false, document: false, d3: false */
define([
    "jquery",
    "underscore",
    "tpl!./templates/bayes.html",
    "tpl!./templates/hypothesis.html",
    "text!./css/bayes.css",
    "jquery.tools",
    "html5slider",
    "d3"
], function ($, und, bayes, hypothesis, style) {
    'use strict';

    var js_promises = {};

    return function () {

        var self = {

            config: {

                type: "simple",
                selector: false,
                el: false,
                templates: {
                    bayes: bayes,
                    hypothesis: hypothesis
                },
                afortiori: false,
                num: 1,
                dp: 2,
                equation: true,
                css: {
                    "display": "none",
                    "font-size": "14px",
                    "color": "#222"
                },
                graph: false,
                styleSelector: "bayes-calc-styles"

            },

            init: function (config) {

                if (und.isString(config)) {

                    self.config.selector = config;

                } else {

                    und.extend(self.config, config);

                }

                if (self.config.num <= 2) {

                    self.config.num = 1;

                }

                if (und.isUndefined(config.css) || und.isUndefined(config.css.width)) {

                    var width = 500;

                    if (self.config.num !== 1) {

                        width = 290 * self.config.num;

                    }

                    if (self.config.graph) {

                        width += 440;

                    }

                    self.config.css.width = width + "px";

                }

                if (und.isBoolean(self.config.graph) && self.config.graph) {

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

                    if (self.config.el.length) {

                        self.config.el.css(self.config.css);

                        self.config.el.show().html('Bayes calculator loading...');

                        self.load_js(('https:' === document.location.protocol ? 'https:' : 'http:') + '//cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML', function () {

                            if (!self.range_test()) {

                                self.config.el.addClass('no-range');

                            }

                            self.config.el.hide().html(self.template('bayes'));

                            if (self.config.graph) {

                                self.graph();

                            }

                            //Attach events
                            self.events();

                            //If mathjax doesn't load then neither does the calc
                            MathJax.Hub.Register.StartupHook("TeX Jax Ready", function () {
                                MathJax.Hub.Config({
                                    displayAlign: "left"
                                });
                                MathJax.Hub.Queue(["Typeset", MathJax.Hub, self.config.el.get(0)]);
                                MathJax.Hub.Queue(["fadeIn", self.config.el]);
                            });

                        }, function () {

                            self.config.el.html('Bayes calculator failed to load');

                        });

                    }

                }

            },

            events: function () {

                var $form = self.config.el.find('form'),
                    $hypotheses,
                    hypotheses,
                    sum;

                $form.find('input[type=range]').change(function () {
                    self.sync_range_fields($(this), 'number');
                    self.update_calc();
                });

                $form.find('input[type=number]').change(function () {
                    self.sync_range_fields($(this), 'range');
                    self.update_calc();
                });

                $form.find('label[title],input[title],button[title]').mouseover(function () {
                    var $this = $(this);
                    if (!$this.data("tooltip")) {
                        $this.tooltip({
                            position: "center right",
                            tipClass: "bayes-tooltip"
                        }).trigger('mouseover');
                    }
                });

                if (self.config.num > 2) {

                    $hypotheses = $form.find('.field-hb input[type=number]');
                    hypotheses = $hypotheses.toArray();
                    sum =  function (mem, el) {
                        return mem + parseFloat($(el).val());
                    };

                    $hypotheses.bind('change bayes-change', function () {
                        var $this,
                            $gt,
                            index,
                            gt_sum,
                            to_fill;

                        if (und.reduce(hypotheses, sum, 0) !== 1) { //sum is not 1
                            $this = $(this);
                            index = $hypotheses.index($this);

                            if (und.reduce(hypotheses.slice(0, index + 1), sum, 0) > 1) { //Left of interacted hypothesis including

                                $this.siblings().andSelf().val(self.round(1 - und.reduce(hypotheses.slice(0, index), sum, 0)));

                            }

                            $gt = $hypotheses.filter(':gt(' + index + ')');
                            gt_sum = und.reduce($gt.toArray(), sum, 0);
                            to_fill = 1 - und.reduce(hypotheses.slice(0, index + 1), sum, 0);

                            $gt.each(function () {
                                var $this = $(this);
                                if (to_fill > 0) {
                                    if (parseFloat($this.val()) > 0 && gt_sum > 0) {
                                        $this.siblings().andSelf().val(self.round((parseFloat($this.val()) / gt_sum) * to_fill));
                                    } else {
                                        $this.siblings().andSelf().val(self.round(to_fill));
                                    }
                                } else {
                                    $this.siblings().andSelf().val(0);
                                }
                            });

                        }

                    }).trigger('change');

                }

            },

            step: function () {
                return 1 / Math.pow(10, self.config.dp);
            },

            min: function () {
                return self.step();
            },

            max: function () {
                return 1 - self.step();
            },

            sync_range_fields: function ($this, type) {

                var $field = $this.closest('.bayes-field'),
                    $fields = $field.siblings('.bayes-field'),
                    $inputs = $field.find('.bayes-inputs'),
                    $input = $this.closest('.bayes-inputs'),
                    i = $inputs.index($input);
                $this.siblings('input[type=' + type + ']').val(self.round($this.val())).trigger('bayes-change');

                if ($field.hasClass('field-hb')) {
                    $fields.filter('.field-nhb').find('.bayes-inputs:eq(' + i + ') input').val(self.round(1 - parseFloat($this.val())));
                }
                if ($field.hasClass('field-nhb')) {
                    $fields.filter('.field-hb').find('.bayes-inputs:eq(' + i + ') input').val(self.round(1 - parseFloat($this.val())));
                }

            },

            constrain_data: function () {

                if (self.config.type === 'simple') {

                    var data = self.data(),
                        min = parseFloat(data.hb_1) * parseFloat(data.ehb_1),
                        max = min + parseFloat(data.nhb_1),
                        $inputs = self.config.el.find('.field-eb .bayes-inputs:eq(0) input');

                    if (parseFloat(data.eb_1) < min) {

                        $inputs.val(min);

                    }

                    if (parseFloat(data.eb_1) > max) {

                        $inputs.val(max);

                    }

                    $inputs.attr('min', self.round(min)).attr('max', self.round(max));

                }

            },

            update_calc: function () {

                self.constrain_data();

                var data = self.data(),
                    i,
                    j,
                    calc,
                    val,
                    indexCheck;

                if (self.config.num > 2) {

                    calc = [];

                    for (i = 1; i <= self.config.num; i += 1) {

                        calc.push({
                            eb: data['eb_' + i] || 0,
                            ehb: data['ehb_' + i] || 0,
                            hb: data['hb_' + i] || 0,
                            heb: data['heb_' + i] || 0,
                            nhb: data['nhb_' + i] || 0,
                            enhb: data['enhb_' + i] || 0
                        });

                    }

                    indexCheck = function (val, index) {
                        return index !== i;
                    };

                    for (i = 0; i < self.config.num; i += 1) {

                        val = self.round(self.calculate(und.sortBy(calc, indexCheck)));

                        self.config.el.find('.field-heb .bayes-inputs:eq(' + i + ') span').text(val);
                        self.config.el.find('.field-heb .bayes-inputs:eq(' + i + ') input').val(val);

                    }

                } else {

                    for (i = 1; i <= self.config.num; i += 1) {

                        if (und.isArray(data['hb_' + i])) {

                            for (j = 0; j < data['hb_' + i].length; j += 1) {

                                self.config.el.find('.field-heb .bayes-inputs:eq(' + j + ') span').text(self.round(self.calculate({
                                    eb: data['eb_' + i] ? data['eb_' + i][j] : 0,
                                    ehb: data['ehb_' + i] ? data['ehb_' + i][j] : 0,
                                    hb: data['hb_' + i] ? data['hb_' + i][j] : 0,
                                    heb: data['heb_' + i] ? data['heb_' + i][j] : 0,
                                    nhb: data['nhb_' + i] ? data['nhb_' + i][j] : 0,
                                    enhb: data['enhb_' + i] ? data['enhb_' + i][j] : 0
                                })));

                            }

                        } else {

                            calc = self.round(self.calculate({
                                eb: data['eb_' + i],
                                ehb: data['ehb_' + i],
                                hb: data['hb_' + i],
                                heb: data['heb_' + i],
                                nhb: data['nhb_' + i],
                                enhb: data['enhb_' + i]
                            }));

                            self.config.el.find('.field-heb .bayes-inputs:eq(' + (i - 1) + ') span').text(calc);
                            self.config.el.find('.field-heb .bayes-inputs:eq(' + (i - 1) + ') input').val(calc);

                        }

                    }

                }

                if (self.config.graph) {

                    self.graph_redraw();

                }

            },

            calculate: function (calc) {

                var numerator = 0,
                    denominator = [];

                if (und.isArray(calc)) {

                    numerator = parseFloat(calc[0].hb) * parseFloat(calc[0].ehb);

                    und.each(calc, function (val) {
                        denominator.push(parseFloat(val.hb) * parseFloat(val.ehb));
                    });

                    return numerator / und.reduce(denominator, function (mem, val) {
                        return mem + val;
                    });

                } else {

                    if (calc.enhb > 0) {

                        return (parseFloat(calc.hb) * parseFloat(calc.ehb)) / (parseFloat(calc.hb) * parseFloat(calc.ehb) + parseFloat(calc.nhb) * parseFloat(calc.enhb));

                    } else {

                        return parseFloat(calc.eb) !== 0 ? (parseFloat(calc.hb) * parseFloat(calc.ehb)) / parseFloat(calc.eb) : 0;

                    }

                }

            },

            serializeArray: function ($el) {

                return $el.map(function () {
                    return this.elements ? $.makeArray(this.elements) : this;
                }).map(function (i, elem) {

                    var val = $(this).val();

                    return val === null ?
                            null :
                            $.isArray(val) ?
                                    $.map(val, function (val, i) {
                                        return {
                                            name: elem.name,
                                            value: val
                                        };
                                    }) :
                                    {
                                        name: elem.name,
                                        value: val
                                    };
                }).get();
            },

            data: function () {

                var data = {};

                und.each(self.serializeArray(self.config.el.find('form input[type=number],form input[type=hidden]')), function (obj) {

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
                    include,
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

                    include = self.config.num > 2 ? [] : ['hb single', 'nhb', 'ehb single', 'eb', 'heb single'];

                    fields = und.filter(field_types, function (value) {
                        return und.include(include, value.alias || value.name);
                    });

                    break;

                case 'full':

                    include = self.config.num > 2 ? ['hb', 'ehb', 'heb'] : ['hb single', 'nhb', 'ehb single', 'enhb single', 'heb single'];

                    fields = und.filter(field_types, function (value) {
                        return und.include(include, value.alias || value.name);
                    });

                    break;

                }

                return fields;

            },

            //returns rendered template as html

            template: function (template, options) {

                return self.config.templates[template] && self.config.templates[template](und.extend({
                    bayes: self,
                    templates: self.config.templates
                }, options));

            },

            hypothesis: function (options) {

                return self.template('hypothesis', und.extend({
                    num: 1
                }, options));

            },


            round: function (num, dec) {

                if (und.isUndefined(dec)) {
                    dec = self.config.dp;
                }

                return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);

            },

            equation: function () {

                var left = '',
                    numerator = '',
                    denominator = [],
                    i;

                if (self.config.num === 1) {

                    left = '\P( H \\mid E.b )';
                    numerator = '\P( H \\mid b ) \P( E \\mid H.b )';
                    denominator = [];

                    if (self.config.type === 'simple') {

                        denominator.push('\P( E \\mid b )');

                    } else {

                        denominator.push('\P( H \\mid b ) \P( E \\mid H.b )');
                        denominator.push('\P(\\neg{H} \\mid b ) \P( E \\mid \\neg{H}.b )');

                    }

                } else {

                    left = '\P( H_1 \\mid E.b )';
                    numerator = '\P( H_1 \\mid b )P( E \\mid H_1.b )';

                    for (i = 1; i <= self.config.num; i += 1) {

                        denominator.push('\P( H_' + i + ' \\mid b ) \P( E \\mid H_' + i + '.b )');

                    }

                }

                return '$$\\mathrm{' + left + ' = \\frac{' + numerator + '}{' + denominator.join(' + ') + '}}$$';


            },

            graph_data: function (class_name) {

                var raw = self.data(),
                    data = [],
                    labels = [],
                    not = "¬",
                    i;

                switch (class_name) {

                case 'hypotheses':
                    if (self.config.num === 1) {
                        data = [raw.hb_1, raw.nhb_1];
                        labels = ['P(H|b)', 'P(' + not + 'H|b)'];
                    } else {
                        for (i = 1; i <= self.config.num; i += 1) {
                            data.push(raw['hb_' + i]);
                            labels.push('P(H' + i + '|b)');
                        }
                    }
                    break;

                case 'expected-evidence':
                    if (self.config.num === 1) {
                        if (self.config.type === 'simple') {
                            data = [raw.ehb_1, parseFloat(raw.eb_1) !== 0 ? (raw.eb_1 - raw.hb_1 * raw.ehb_1) / raw.nhb_1 : 0];
                        } else {
                            data = [raw.ehb_1, raw.enhb_1];
                        }
                        labels = ['P(E|H)', 'P(E|' + not + 'H)'];
                    } else {
                        for (i = 1; i <= self.config.num; i += 1) {
                            data.push(raw['ehb_' + i]);
                            labels.push('P(E|H' + i + '.b)');
                        }
                    }
                    break;

                case 'posteriors':
                    if (self.config.num === 1) {
                        data = [raw.heb_1, 1 - raw.heb_1];
                        labels = ['P(H|E.b)', 'P(' + not + 'H|E.b)'];
                    } else {
                        for (i = 1; i <= self.config.num; i += 1) {
                            data.push(raw['heb_' + i]);
                            labels.push('P(H' + i + '|E.b)');
                        }
                    }
                    break;

                }

                return [und.map(data, function (val) {
                    return self.round(val);
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
                    self.graph_circle(true);
                    break;

                case 'venn':
                    self.graph_venn(true);
                    break;

                }

            },

            graph_redraw: function () {

                switch (self.config.graph) {

                case 'bar':
                    self.graph_redraw_bar('hypotheses');
                    self.graph_redraw_bar('expected-evidence');
                    self.graph_redraw_bar('posteriors');
                    break;

                case 'circle':
                    self.graph_circle();
                    break;

                case 'venn':
                    self.graph_venn();
                    break;

                }

            },

            graph_venn: function (setup) {

                var hypotheses_data_labels = self.graph_data('hypotheses'),
                    expected_data_labels = self.graph_data('expected-evidence'),
                    dim = 400,
                    u_d = 0.7 * dim,
                    u_d_half = u_d / 2,
                    circle_area = function (r) {
                        return Math.PI * Math.pow(r, 2);
                    },
                    circle_radius = function (A) {
                        return Math.sqrt(A / Math.PI);
                    },
                    chart = d3.select(self.config.el.find('.bayes-graph').get(0)),

                    r = d3.scale.sqrt().domain([0, 1]).range([0, u_d_half]),
                    r_prior = r(hypotheses_data_labels[0][0]),
                    r_n_prior = r(hypotheses_data_labels[0][1]),

                    area_prior = circle_area(r_prior),
                    r_consequent_prior = circle_radius(((expected_data_labels[0][0] * area_prior) + (expected_data_labels[0][1] * circle_area(r_n_prior)))),
                    circle_lens_area = und.memoize(
                        function (r, R, d) {
                            return Math.pow(r, 2) * Math.acos((Math.pow(d, 2) + Math.pow(r, 2) - Math.pow(R, 2)) / (2 * d * r))
                                + Math.pow(R, 2) * Math.acos((Math.pow(d, 2) + Math.pow(R, 2) - Math.pow(r, 2)) / (2 * d * R))
                                - ((1 / 2) * Math.sqrt(((-1 * d) + r + R) * (d + r - R) * (d - r + R) * (d + r + R)));
                        },
                        function (r, R, d) {
                            return [r, R, d].join('-');
                        }
                    ),

                    d = (function () {
                        var d,
                            closest;
                        und.each(und.range(Math.abs(r_consequent_prior - r_prior), r_prior + r_consequent_prior, 1), function (num) {
                            var t = Math.abs((area_prior * expected_data_labels[0][0]) - circle_lens_area(r_prior, r_consequent_prior, num));
                            if (!closest || t < closest) {
                                closest = t;
                                d = num;
                            }
                        });
                        return d;
                    }()),

                    margin = (dim - (r_prior + d + r_consequent_prior)) / 2,
                    svg,
                    prior,
                    consequent_prior,
                    fill;

                if (setup) {

                    chart.append("svg")
                        .attr('class', 'venn')
                        .attr("width", dim)
                        .attr("height", dim);

                }

                svg = chart.select('svg');

                if (setup) {

                    svg.append('circle').attr('class', 'prior');

                }

                prior = svg.selectAll(".prior");

                prior.transition()
                    .duration(1000)
                    .attr("cx", margin + r_prior)
                    .attr("cy", dim / 2)
                    .attr("r", r_prior);

                if (setup) {

                    svg.append("circle").attr('class', 'consequent_prior');

                }

                consequent_prior = svg.selectAll(".consequent_prior");

                consequent_prior.transition()
                    .duration(1000)
                    .attr("cx", margin + r_prior + d)
                    .attr("cy", dim / 2)
                    .attr("r", r_consequent_prior);

                if (setup) {

                    svg.selectAll(".label")
                        .data(['H', 'E∩H', 'E'])
                        .enter().append("text")
                        .attr("class", "label")
                        .attr("x", 25)
                        .attr("y", function (v, i) {
                            return (i * 25) + 3;
                        })
                        .attr("dy", "1em")
                        .text(String);

                    fill = function (v, i) {

                        var gradient;

                        if (und.isString(v)) {
                            return v;
                        }

                        gradient = svg.append("svg:defs")
                            .append("svg:linearGradient")
                            .attr("id", "gradient-" + i)
                            .attr("x1", "50%")
                            .attr("y1", "0%")
                            .attr("x2", "51%")
                            .attr("y2", "0%")
                            .attr("spreadMethod", "pad");

                        gradient.append("svg:stop")
                            .attr("offset", "0%")
                            .attr("stop-color", v.start)
                            .attr("stop-opacity", 1);

                        gradient.append("svg:stop")
                            .attr("offset", "100%")
                            .attr("stop-color", v.stop)
                            .attr("stop-opacity", 1);

                        return 'url(#gradient-' + i + ')';

                    };

                    svg.selectAll(".color-key")
                        .data([
                            {
                                start: '#20B2AA',
                                stop: '#8F59D4'
                            },
                            '#8F59D4',
                            {
                                start: '#8F59D4',
                                stop: '#FE7FFE'
                            }
                        ])
                        .enter().append("circle")
                        .attr("class", 'color-key')
                        .style('fill', fill)
                        .attr("cy", function (v, i) {
                            return (i * 25) + 11;
                        })
                        .attr("cx", 11)
                        .attr("r", 10);

                }

            },

            graph_circle: function (setup) {

                var hypotheses_data_labels = self.graph_data('hypotheses'),
                    expected_data_labels = self.graph_data('expected-evidence'),
                    posteriors_data_labels = self.graph_data('posteriors'),
                    width = 400,
                    height = 400,
                    width_div = width / 3,
                    height_div = height / hypotheses_data_labels[0].length,
                    r_factor = 0.85,
                    max_r = Math.min(width_div, height_div),
                    chart,
                    expected_start = 0.15 * height,
                    expected_height = 0.70 * height,
                    expected_heights = [],
                    expected_sum = und.reduce(expected_data_labels[0], function (mem, v) {
                        return mem + v;
                    }),
                    circle_hypotheses,
                    prior_label,
                    prior_eq_label,
                    circle_expecteds,
                    expected_label,
                    circle_posterior,
                    post_label,
                    post_eq_label;

                if (setup) {

                    chart = d3.select(self.config.el.find('.bayes-graph').get(0)).append("svg")
                        .attr("width", width)
                        .attr("height", height);

                } else {

                    chart = d3.select(self.config.el.find('.bayes-graph').get(0));

                }

                if (setup) {

                    circle_hypotheses = chart.selectAll(".circle-hypotheses")
                        .data(hypotheses_data_labels[0])
                        .enter().append("circle")
                        .attr('class', function (v, i) {
                            return 'circle-hypotheses circle-hypotheses-' + i;
                        })
                        .attr("cx", width_div - (width_div / 2))
                        .attr("cy", function (v, i) {
                            return (height_div * (i + 1)) - (height_div / 2);
                        });

                } else {

                    circle_hypotheses = chart.selectAll(".circle-hypotheses")
                        .data(hypotheses_data_labels[0])
                        .transition()
                        .duration(1000);

                }

                circle_hypotheses
                    .attr("r", function (v) {
                        return Math.sqrt(v) * (max_r / 2) * r_factor;
                    });

                if (setup) {

                    prior_label = chart.selectAll(".prior-label")
                        .data(hypotheses_data_labels[0])
                        .enter().append("text")
                        .attr("class", "prior-label")
                        .attr("x", width_div - (width_div / 2))
                        .attr("y", function (v, i) {
                            return (height_div * (i + 1)) - (height_div / 2);
                        })
                        .attr("dy", "0.35em")
                        .attr("text-anchor", "middle");

                } else {

                    prior_label = chart.selectAll(".prior-label")
                        .data(hypotheses_data_labels[0]);

                }

                prior_label.text(function (v) {
                    return String(self.round(v * 100), 2) + '%';
                });

                if (setup) {

                    prior_eq_label = chart.selectAll(".prior-eq-label")
                        .data(hypotheses_data_labels[1])
                        .enter().append("text")
                        .attr("class", "prior-eq-label")
                        .attr("x", width_div - (width_div / 2))
                        .attr("dy", "-0.5em")
                        .attr("text-anchor", "middle")
                        .text(String);

                } else {

                    prior_eq_label = chart.selectAll(".prior-eq-label")
                        .data(hypotheses_data_labels[1])
                        .transition()
                        .duration(1000);

                }

                prior_eq_label
                    .attr("y", function (v, i) {
                        return (height_div * (i + 1)) - (height_div / 2) - (Math.sqrt(hypotheses_data_labels[0][i]) * (max_r / 2) * r_factor);
                    });

                und.each(expected_data_labels[0], function (v) {
                    expected_heights.push(expected_sum ? (v / expected_sum) * expected_height : 0);
                });

                if (setup) {

                    circle_expecteds = chart.selectAll(".circle-expecteds")
                        .data(expected_data_labels[0])
                        .enter().append("rect")
                        .attr('class', function (v, i) {
                            return 'circle-expecteds circle-expected-' + i;
                        })
                        .attr("x", (width_div * 2) - (width_div / 2) - 30)
                        .attr("width", 60);

                } else {

                    circle_expecteds = chart.selectAll(".circle-expecteds")
                        .data(expected_data_labels[0])
                        .transition();

                }

                circle_expecteds
                    .attr("y", function (v, i) {
                        return expected_start + und.reduce(expected_heights.slice(0, i), function (mem, v) {
                            return mem + v;
                        }, 0);
                    }).attr("height", function (v, i) {
                        return expected_heights[i];
                    });

                if (setup) {

                    chart.selectAll(".expected-main-label")
                        .data(['likelihood ratios'])
                        .enter().append("text")
                        .attr("class", "expected-main-label")
                        .attr("x", (width_div * 2) - (width_div / 2))
                        .attr("y", expected_start)
                        .attr("dy", "-10px")
                        .attr("text-anchor", "middle")
                        .text(String);

                }

                if (setup) {

                    expected_label = chart.selectAll(".expected-label")
                        .data(expected_data_labels[1])
                        .enter().append("text")
                        .attr("class", "expected-label")
                        .attr("x", (width_div * 2) - (width_div / 2))
                        .attr("dy", "20px")
                        .attr("text-anchor", "middle")
                        .text(String);

                } else {

                    expected_label = chart.selectAll(".expected-label")
                        .data(expected_data_labels[1])
                        .transition();

                }

                expected_label
                    .attr("y", function (v, i) {
                        return expected_start + und.reduce(expected_heights.slice(0, i), function (mem, v) {
                            return mem + v;
                        }, 0);
                    });

                if (setup) {

                    circle_posterior = chart.selectAll(".circle-posterior")
                        .data(posteriors_data_labels[0])
                        .enter().append("circle")
                        .attr('class', function (v, i) {
                            return 'circle-posterior circle-posterior-' + i;
                        })
                        .attr("cx", (width_div * 3) - (width_div / 2))
                        .attr("cy", function (v, i) {
                            return (height_div * (i + 1)) - (height_div / 2);
                        });

                } else {

                    circle_posterior = chart.selectAll(".circle-posterior")
                        .data(posteriors_data_labels[0])
                        .transition();

                }

                circle_posterior
                    .attr("r", function (v) {
                        return Math.sqrt(v) * (max_r / 2) * r_factor;
                    });

                if (setup) {

                    post_label = chart.selectAll(".post-label")
                        .data(posteriors_data_labels[0])
                        .enter().append("text")
                        .attr("class", "post-label")
                        .attr("x", (width_div * 3) - (width_div / 2))
                        .attr("y", function (v, i) {
                            return (height_div * (i + 1)) - (height_div / 2);
                        })
                        .attr("dy", ".35em")
                        .attr("text-anchor", "middle");

                } else {

                    post_label = chart.selectAll(".post-label")
                        .data(posteriors_data_labels[0]);

                }

                post_label.text(function (v) {
                    return String(self.round(v * 100, 2)) + '%';
                });

                if (setup) {

                    post_eq_label = chart.selectAll(".post-eq-label")
                        .data(posteriors_data_labels[1])
                        .enter().append("text")
                        .attr("class", "post-eq-label")
                        .attr("x", (width_div * 3) - (width_div / 2))
                        .attr("dy", "-0.5em")
                        .attr("text-anchor", "middle")
                        .text(String);

                } else {

                    post_eq_label = chart.selectAll(".post-eq-label")
                        .data(posteriors_data_labels[1])
                        .transition()
                        .duration(1000);

                }

                post_eq_label
                    .attr("y", function (v, i) {
                        return (height_div * (i + 1)) - (height_div / 2) - (Math.sqrt(posteriors_data_labels[0][i]) * (max_r / 2) * r_factor);
                    });

            },

            graph_bar: function (class_name) {

                var data_labels = self.graph_data(class_name),
                    data = data_labels[0],
                    labels = data_labels[1],
                    markers = [0, 0.25, 0.5, 0.75, 1],
                    width = 400,
                    height = 100,
                    chart,
                    x = function (d) {
                        return d * 400;
                    };

                chart = d3.select(self.config.el.find('.bayes-graph').get(0))
                    .append("svg")
                    .attr("class", class_name)
                    .attr("width", width + 20)
                    .attr("height", height + 20)
                    .append("g")
                    .attr("transform", "translate(10,15)");

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
                    .attr("y", function (d, i) {
                        return i * (height / data.length);
                    })
                    .attr("width", x)
                    .attr("height", (height / data.length));

                chart.selectAll(".bar")
                    .data(data)
                    .enter().append("text")
                    .attr("class", "bar")
                    .attr("x", x)
                    .attr("dx", -3) // padding-right
                    .attr("y", function (d, i) {
                        return i * (height / data.length) + (height / data.length / 2);
                    })
                    .attr("dy", ".35em") // vertical-align: middle
                    .attr("text-anchor", "end") // text-align: right
                    .text(String);

                chart.selectAll(".eq")
                    .data(labels)
                    .enter().append("text")
                    .attr("class", "eq")
                    .attr("x", 0)
                    .attr("dx", 3) // padding-left
                    .attr("y", function (d, i) {
                        return i * (height / data.length) + (height / data.length / 2);
                    })
                    .attr("dy", ".35em") // vertical-align: middle
                    .attr("text-anchor", "start") // text-align: right
                    .text(String);

            },

            graph_redraw_bar: function (class_name) {

                var chart = d3.select(self.config.el.find(".bayes-graph ." + class_name).get(0)),
                    data_labels = self.graph_data(class_name),
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

            range_test: function () {
                var test = document.createElement('input');
                try {
                    test.type = 'range';
                    return test.type === 'range' || (document.mozSetImageElement && ('MozAppearance' in test.style));
                } catch (e) {
                    return false;
                }
            },

            css: function (css) {

                style = document.createElement('style');
                style.type = 'text/css';
                style.id = self.config.styleSelector;

                if (style.styleSheet) {
                    style.styleSheet.cssText = css;
                } else {
                    style.appendChild(document.createTextNode(css));
                }
                document.getElementsByTagName("head")[0].appendChild(style);

            },

            load_js: function (url, cs, err) {

                if (und.isUndefined(js_promises[url])) {
                    js_promises[url] = $.getScript(url);
                }

                js_promises[url].done(cs).fail(err);

            }

        };

        return self;

    };

});