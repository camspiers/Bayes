(function ($) {

	$(function () {

		var hypothesisTemplate = _.template($('#hypothesis').html());
    var template_options = {
      a_fortiori: false,
      hide_remove: false,
      fields: [
        {
          name: 'hb',
          label: '\\(\\mathrm{\\Pr( H<% if (!single) { %><%= \'_\' + num %><% } %> \\mid b )}\\)',
          className: 'hb'
        },
        {
          name: 'nhb',
          label: '\\(\\mathrm{\\Pr( \\bar{H}<% if (!single) { %><%= \'_\' + num %><% } %> \\mid b )}\\)',
          className: 'nhb'
        },
        {
          name: 'ehb',
          label: '\\(\\mathrm{\\Pr( E \\mid H<% if (!single) { %><%= \'_\' + num %><% } %>.b )}\\)',
          className: ''
        },
        {
          name: 'eb',
          label: '\\(\\mathrm{\\Pr( E \\mid b )}\\)',
          className: ''
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
      MathJax.Hub.Queue(["Typeset", MathJax.Hub, $hypotheses_container.get(0)]);
		};
    
    add_hypothesis(false, $('.basic'));

		$('.add_hypothesis').click(add_hypothesis).click();

		$('.a_fortiori').click(function (e) {
			e.preventDefault();
      template_options.a_fortiori = !template_options.a_fortiori;
      var $hypotheses_container = $(this).closest('form').find('.hypotheses');
      var $hypotheses = $hypotheses_container.find('.hypothesis');
      $hypotheses.each(function (index) {
        $(this).replaceWith(hypothesisTemplate($.extend(template_options, {num: index + 1, hide_remove: (index + 1) !== $hypotheses.length})));
      });
      MathJax.Hub.Queue(["Typeset", MathJax.Hub, $hypotheses_container.get(0)]);
		});
    
    var $form = $('form');
    
    $form.delegate('input[type=range]', 'change', function () {
      var $this = $(this),
      $field = $this.closest('.field'),
      $fields = $field.siblings('.field');
      $this.siblings('input[type=number]').val($(this).val());
      if ($field.hasClass('field-hb')) {
        $fields.filter('.field-nhb').find('input[type=number],input[type=range]').val(1 - parseFloat($(this).val()));
      }
      if ($field.hasClass('field-nhb')) {
        $fields.filter('.field-hb').find('input[type=number],input[type=range]').val(1 - parseFloat($(this).val()));
      }
    });
    
    $form.delegate('input[type=number]', 'change', function () {
      var $this = $(this),
      $field = $this.closest('.field'),
      $fields = $field.siblings('.field');
      $this.siblings('input[type=range]').val($(this).val());
      if ($field.hasClass('field-hb')) {
        $fields.filter('.field-nhb').find('input[type=number],input[type=range]').val(1 - parseFloat($(this).val()));
      }
      if ($field.hasClass('field-nhb')) {
        $fields.filter('.field-hb').find('input[type=number],input[type=range]').val(1 - parseFloat($(this).val()));
      }
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

	});

}(jQuery));