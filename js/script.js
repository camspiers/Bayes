(function ($, bayes, MathJax) {

	$(function () {
    
    var round = function (num, dec) {
       return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
    };

		var hypothesisTemplate = _.template($('#hypothesis').html());
    
    var template_options = {
      a_fortiori: false,
      hide_remove: false,
      fields: [
        {
          name: 'hb',
          label: '\\(\\mathrm{\\Pr( H<% if (!single) { %><%= \'_\' + num %><% } %> \\mid b )}\\)',
          className: 'hb',
          val: 0,
          title: 'Probability of the hypothesis given the background evidence',
          disabled: false
        },
        {
          name: 'nhb',
          label: '\\(\\mathrm{\\Pr( \\neg{H}<% if (!single) { %><%= \'_\' + num %><% } %> \\mid b )}\\)',
          className: 'nhb',
          val: 1,
          title: 'Probability of not the hypothesis given the background evidence',
          disabled: false
        },
        {
          name: 'ehb',
          label: '\\(\\mathrm{\\Pr( E \\mid H<% if (!single) { %><%= \'_\' + num %><% } %>.b )}\\)',
          className: '',
          val: 0,
          title: 'Probability of the evidence given the hypothesis and the background evidence',
          disabled: false
        },
        {
          name: 'eb',
          label: '\\(\\mathrm{\\Pr( E \\mid b )}\\)',
          className: '',
          val: 0,
          title: 'Probability of the evidence given the background evidence',
          hint: 'Must be greater than 0',
          disabled: false
        },
        {
          name: 'heb',
          label: '\\(\\mathrm{\\Pr( H<% if (!single) { %><%= \'_\' + num %><% } %> \\mid E.b )}\\)',
          className: '',
          val: 0,
          title: 'Probability of the hypothesis given the evidence and given the background evidence',
          disabled: true
        }
      ]
    };

		$('#tabs').find('a').click(function (e) {
			e.preventDefault();
			$('#panels').find('.panel').removeClass('active').eq($('#tabs').find('a').index($(this))).addClass('active');
		});
    
    var add_hypothesis = function (e, $el) {
			if (e) e.preventDefault();
      var $hypotheses_container = ($el || $(this)).closest('form').find('.hypotheses');
      $hypotheses_container.find('.remove').hide();
			$hypotheses_container.append(hypothesisTemplate($.extend(template_options, {num: $hypotheses_container.find('.hypothesis').length + 1, single: $hypotheses_container.hasClass('basic')})));
      if (MathJax) MathJax.Hub.Queue(["Typeset", MathJax.Hub, $hypotheses_container.get(0)]);
		};
    
    add_hypothesis(false, $('.basic'));
    
    var validate = function ($form) {
      var calc = $form.serializeObject(),
      $inputs = $form.find('input'),
      errors = [],
      i;
      
      if ((calc['hb'] * calc['ehb']) / calc['eb'] > 1) {
        errors.push('hb');
        errors.push('nhb');
        errors.push('ehb');
        errors.push('eb');
      }
       
      if (calc['eb'] <= 0) errors.push('eb');
      
      $inputs.filter('.error').removeClass('error');
      if (errors.length > 0) {
       for (i in errors) {
         $inputs.filter('[name=' + errors[i] + ']').addClass('error');
       } 
      }
    };
    
    var updateCalculation = function (e, $this) {
      if (e) e.preventDefault();
      $this = !$this ? $(this) : $this;
      validate($this);
      var data = $this.serializeObject();
      
      $this.find('.field-heb .inputs span').text(round(bayes.calc.posterior([data]), 2));  
    };

		$('.add_hypothesis').click(add_hypothesis).click();

		$('.a_fortiori').click(function (e) {
			e.preventDefault();
      template_options.a_fortiori = !template_options.a_fortiori;
      var $hypotheses_container = $(this).closest('form').find('.hypotheses'),
      $hypotheses = $hypotheses_container.find('.hypothesis')
      $hypotheses.each(function (index) {
        $(this).replaceWith(hypothesisTemplate($.extend(template_options, {num: index + 1, hide_remove: (index + 1) !== $hypotheses.length, single: $hypotheses_container.hasClass('basic')})));
      });
      if (MathJax) MathJax.Hub.Queue(["Typeset", MathJax.Hub, $hypotheses_container.get(0)]);
		});
    
    var $form = $('form');
    
    var updateJoinedFields = function ($this, type) {
      var $field = $this.closest('.field'),
      $fields = $field.siblings('.field'),
      $inputs = $field.find('.inputs'),
      $input = $this.closest('.inputs'),
      i = $inputs.index($input);
      $this.siblings('input[type=' + type + ']').val($this.val());
      if ($field.hasClass('field-hb')) {
        $fields.filter('.field-nhb').find('.inputs:eq('+ i + ') input').val(1 - parseFloat($this.val()));
      }
      if ($field.hasClass('field-nhb')) {
        $fields.filter('.field-hb').find('.inputs:eq('+ i + ') input').val(1 - parseFloat($this.val()));
      }
      updateCalculation(false, $this.closest('form'));
    };
    
    $form.delegate('input[type=range]', 'change', function () {
      updateJoinedFields($(this), 'number');
    });
    
    $form.delegate('input[type=number]', 'change', function () {
      updateJoinedFields($(this), 'range');
    });
    
    $form.delegate('.remove', 'click', function (event) {
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
    
    $form.delegate('label[title],input[title],button[title]', 'mouseover', function () {
      var $this = $(this);
      if (!$this.data("tooltip")) {
        $this.tooltip().trigger('mouseover');
      }
    });

	});

}(jQuery, bayes, MathJax));