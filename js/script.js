(function ($) {

	$(function () {

		var hypothesisTemplate = _.template($('#hypothesis').html());
    var template_options = {
      a_fortiori: false,
      fields: [
        {
          name: 'hb',
          label: 'P(H<%= num %>|B)'
        },
        {
          name: 'nhb',
          label: 'P(~H<%= num %>|B)'
        },
        {
          name: 'ehb',
          label: 'P(E|H<%= num %>.B)'
        },
        {
          name: 'eb',
          label: 'P(E|B)'
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
			$hypotheses_container.append(hypothesisTemplate($.extend(template_options, {num: $hypotheses_container.find('.hypothesis').length + 1})));
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
      $hypotheses_container.find('.hypothesis').each(function (index) {
        $(this).replaceWith(hypothesisTemplate($.extend(template_options, {num: index + 1})));
      });
		});

	});

}(jQuery));