(function ($) {

	$(function () {

		$('#tabs').find('a').click(function (e) {
			e.preventDefault();
			$('#panels').find('.panel').removeClass('active').eq($('#tabs').find('a').index($(this))).addClass('active');
		});

		var hypothesisTemplate = _.template($('#hypothesis').html());

		$('.addHypothesis').click(function (e) {
			e.preventDefault();
			$(this).closest('.panel').find('.hypotheses').append(hypothesisTemplate());
		});

	});

}(jQuery));