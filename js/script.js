(function($, MathJax) {
    $(function() {
        var bayesapp = {
            templates: {
                hypothesis: _.template($('#hypothesis').html())
            },
            template_options: {
                a_fortiori: false,
                hide_remove: false,
                labels: {
                    hypothesis: 'Hypothesis',
                    evidence: 'Evidence'   
                },
                fields: [{
                    name: 'hb',
                    label: '\\(\\mathrm{\\Pr( H<% if (!single) { %><%= \'_\' + num %><% } %> \\mid b )}\\)',
                    className: 'hb',
                    val: 0,
                    title: 'Probability that \'<%= labels.hypothesis %>\' is true given the background evidence',
                    disabled: false
                }, {
                    name: 'nhb',
                    label: '\\(\\mathrm{\\Pr( \\neg{H}<% if (!single) { %><%= \'_\' + num %><% } %> \\mid b )}\\)',
                    className: 'nhb',
                    val: 1,
                    title: 'Probability that \'<%= labels.hypothesis %>\' is false given the background evidence',
                    disabled: false
                }, {
                    name: 'ehb',
                    label: '\\(\\mathrm{\\Pr( E \\mid H<% if (!single) { %><%= \'_\' + num %><% } %>.b )}\\)',
                    className: '',
                    val: 0,
                    title: 'Probability that \'<%= labels.evidence %>\' is true given that \'<%= labels.hypothesis %>\' is true and the background evidence',
                    disabled: false
                }, {
                    name: 'enhb',
                    label: '\\(\\mathrm{\\Pr( E \\mid \\neg{H}<% if (!single) { %><%= \'_\' + num %><% } %>.b )}\\)',
                    className: '',
                    val: 0,
                    title: 'Probability that \'<%= labels.evidence %>\' is true given that \'<%= labels.hypothesis %>\' is false and the background evidence',
                    disabled: false
                }, {
                    name: 'eb',
                    label: '\\(\\mathrm{\\Pr( E \\mid b )}\\)',
                    className: '',
                    val: 0,
                    title: 'Probability that \'<%= labels.evidence %>\' is true given the background evidence',
                    hint: 'Must be greater than 0',
                    disabled: false
                }, {
                    name: 'heb',
                    label: '\\(\\mathrm{\\Pr( H<% if (!single) { %><%= \'_\' + num %><% } %> \\mid E.b )}\\)',
                    className: '',
                    val: 0,
                    title: 'Probability that \'<%= labels.hypothesis %>\' is true given that \'<%= labels.evidence %>\' is true and the background evidence',
                    disabled: true
                }]
            },
            round: function(num, dec) {
                return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
            },
            add_hypothesis: function(e, $el) {
                if (e) e.preventDefault();
                var $hypotheses_container = ($el || $(this)).closest('form').find('.hypotheses');
                $hypotheses_container.find('.remove').hide();
                $hypotheses_container.append(bayesapp.templates.hypothesis($.extend(bayesapp.template_options, {
                    num: $hypotheses_container.find('.hypothesis').length + 1,
                    single: $hypotheses_container.hasClass('basic')
                })));
                if (MathJax) MathJax.Hub.Queue(["Typeset", MathJax.Hub, $hypotheses_container.get(0)]);
            },
            validate: function($form) {
                var data = $form.serializeObject(),
                    errors = [],
                    i, k, $input;
                $form.find('.error').removeClass('error');
                if (_.isArray(data['eb'])) {
                    for (i = 0; i < data['eb'].length; i++) {
                        errors = [];
                        if ((data['hb'][i] * data['ehb'][i]) / data['eb'][i] > 1) {
                            errors.push('hb');
                            errors.push('nhb');
                            errors.push('ehb');
                            errors.push('enhb');
                            errors.push('eb');
                        }
                        if (data['eb'][i] <= 0) errors.push('eb');
                        if (errors.length > 0) {
                            for (k in errors) {
                                $form.find('.field-' + errors[k] + ' .inputs:eq(' + i + ') input[name=' + errors[k] + ']').addClass('error');
                            }
                        }
                    }
                }
                else {
                    var $inputs = $form.find('input');
                    if ((data['hb'] * data['ehb']) / data['eb'] > 1) {
                        errors.push('hb');
                        errors.push('nhb');
                        errors.push('ehb');
                        errors.push('enhb');
                        errors.push('eb');
                    }
                    if (data['eb'] <= 0) errors.push('eb');
                    if (errors.length > 0) {
                        for (i in errors) {
                            $inputs.filter('[name=' + errors[i] + ']').addClass('error');
                        }
                    }
                }
            },
            calculate: function(calc) {
                if (calc.length == 1) {
                    if (calc[0].enhb > 0) {
                        return (parseFloat(calc[0].hb) * parseFloat(calc[0].ehb)) / (parseFloat(calc[0].hb) * parseFloat(calc[0].ehb) + parseFloat(calc[0].nhb) * parseFloat(calc[0].enhb));
                    }
                    else {
                        return parseFloat(calc[0].eb) != 0 ? (parseFloat(calc[0].hb) * parseFloat(calc[0].ehb)) / parseFloat(calc[0].eb) : 0;
                    }
                }
                else {
                    return false;
                }
            },
            update_calculation: function(e, $this) {
                if (e) e.preventDefault();
                $this = !$this ? $(this) : $this;
                bayesapp.validate($this);
                var data = $this.serializeObject();
                if (_.isArray(data['eb'])) {
                    for (var i = 0; i < data['eb'].length; i++) {
                        $this.find('.field-heb .inputs:eq(' + i + ') span').text(bayesapp.round(bayesapp.calculate([{
                            eb: data['eb'][i],
                            ehb: data['ehb'][i],
                            hb: data['hb'][i],
                            heb: data['heb'][i],
                            nhb: data['nhb'][i]
                        }]), 2));
                    }
                }
                else {
                    $this.find('.field-heb .inputs span').text(bayesapp.round(bayesapp.calculate([data]), 2));
                }
            },
            update_joined_fields: function($this, type) {
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
                bayesapp.update_calculation(false, $this.closest('form'));
            },
            init: function() {
                $('#tabs').find('a').click(function(e) {
                    e.preventDefault();
                    var $this = $(this);
                    $('#tabs .active').removeClass('active');
                    $this.addClass('active');
                    $('#panels').find('.panel').removeClass('active').eq($('#tabs').find('a').index($this)).addClass('active');
                });
                bayesapp.add_hypothesis(false, $('.basic'));
                //$('.add_hypothesis').click(bayesapp.add_hypothesis).click();
                $('.a_fortiori').click(function(e) {
                    e.preventDefault();
                    bayesapp.template_options.a_fortiori = !bayesapp.template_options.a_fortiori;
                    var $hypotheses_container = $(this).closest('form').find('.hypotheses'),
                        $hypotheses = $hypotheses_container.find('.hypothesis')
                        $hypotheses.each(function(index) {
                            $(this).replaceWith(bayesapp.templates.hypothesis($.extend(bayesapp.template_options, {
                                num: index + 1,
                                hide_remove: (index + 1) !== $hypotheses.length,
                                single: $hypotheses_container.hasClass('basic')
                            })));
                        });
                    if (MathJax) MathJax.Hub.Queue(["Typeset", MathJax.Hub, $hypotheses_container.get(0)]);
                });
                var $form = $('form');
                $form.delegate('input[type=range]', 'change', function() {
                    bayesapp.update_joined_fields($(this), 'number');
                });
                $form.delegate('input[type=number]', 'change', function() {
                    bayesapp.update_joined_fields($(this), 'range');
                });
                $form.delegate('.remove', 'click', function(event) {
                    event.preventDefault();
                    var $this = $(this),
                        $form = $this.closest('form'),
                        $hypothesis = $this.closest('.hypothesis'),
                        $hypotheses = $hypothesis.siblings('.hypothesis');
                    if ($hypotheses.length > 0) {
                        $hypothesis.remove();
                        $form.find('.remove:last').show();
                    }
                });
                $form.delegate('label[title],input[title],button[title]', 'mouseover', function() {
                    var $this = $(this);
                    if (!$this.data("tooltip")) {
                        $this.tooltip({
                            position: "center right"
                        }).trigger('mouseover');
                    }
                });
                $form.delegate('.labels input', 'keyup', function() {
                    var $this = $(this);
                    bayesapp.template_options.labels[$this.attr('name')] = $this.val();
                    var $hypotheses_container = $(this).closest('form').find('.hypotheses');
                    $hypotheses_container.find('.hypothesis').remove();
                    bayesapp.add_hypothesis(false, $hypotheses_container);
                });
            }
        }; //End bayesapp
        bayesapp.init();
    });
}(jQuery, MathJax));