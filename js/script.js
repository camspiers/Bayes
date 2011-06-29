(function ($) {

	$(function () {

		$('#tabs').find('a').click(function (e) {
			e.preventDefault();
			$('#panels').find('.panel').removeClass('active').eq($('#tabs').find('a').index($(this))).addClass('active');
		});

		var hypothesisTemplate = _.template($('#hypothesis').html());

		$('.add_hypothesis').click(function (e) {
			e.preventDefault();
      var $hypotheses = $(this).closest('form').find('.hypotheses');
			$hypotheses.append(hypothesisTemplate({num: $hypotheses.find('.hypothesis').length + 1}));
		}).click();
    
    $('form').delegate('input[type=range]', 'change', function () {
      var $this = $(this);
      $this.siblings('input[type=number]').val($(this).val());
    });
    
    $('form').delegate('input[type=number]', 'change', function () {
      var $this = $(this);
      $this.siblings('input[type=range]').val($(this).val());
    });

	});

}(jQuery));