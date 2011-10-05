(function ($) {

	$(function () {

		var hypothesisTemplate = _.template($('#hypothesis').html());
    var template_options = {
      a_fortiori: false,
      hide_remove: false,
      fields: [
        {
          name: 'hb',
          label: '\\(\\mathrm{\\Pr( H_<%= num %> \\mid b )}\\)'
        },
        {
          name: 'nhb',
          label: '\\(\\mathrm{\\Pr( \\bar{H}_<%= num %> \\mid b )}\\)'
        },
        {
          name: 'ehb',
          label: '\\(\\mathrm{\\Pr( E \\mid H_{<%= num %>}b )}\\)'
        },
        {
          name: 'eb',
          label: '\\(\\mathrm{\\Pr( E \\mid b )}\\)'
        }
      ]
    };

		$('#tabs').find('a').click(function (e) {
			e.preventDefault();
			$('#panels').find('.panel').removeClass('active').eq($('#tabs').find('a').index($(this))).addClass('active');
		});

		$('.add_hypothesis').click(function (e) {
			e.preventDefault();
      var $hypotheses_container = $(this).closest('form').find('.hypotheses');
      $hypotheses_container.find('.remove').hide();
			$hypotheses_container.append(hypothesisTemplate($.extend(template_options, {num: $hypotheses_container.find('.hypothesis').length + 1})));
      MathJax.Hub.Queue(["Typeset", MathJax.Hub, $hypotheses_container.get(0)]);
		}).click();
    
    $('form').delegate('input[type=range]', 'change', function () {
      var $this = $(this);
      $this.siblings('input[type=number]').val($(this).val());
    });
    
    $('form').delegate('input[type=number]', 'change', function () {
      var $this = $(this);
      $this.siblings('input[type=range]').val($(this).val());
    });

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
    
    $('form').delegate('.remove', 'click', function () {
      var $this = $(this);
      var $form = $this.closest('form');
      $this.closest('.hypothesis').remove();
      $form.find('.remove:last').show();
    });

	});

}(jQuery));