#Bayesian Calculator

This project provides an easy method for internet authors to add a bayesian calculator to their web pages. It is still in development, so bugs do exist. If you find any or if you have any suggestions to make you can log them [here](https://github.com/camspiers/Bayes/issues).

This project uses [Underscore.js](http://documentcloud.github.com/underscore/), [RequireJS](http://requirejs.org/), [almond.js](https://github.com/jrburke/almond), [jQuery](http://jquery.com/), [d3.js](http://mbostock.github.com/d3/), [jQuery tools](http://jquerytools.org/), [MathJax](http://www.mathjax.org/) and [less](http://lesscss.org/). Thanks to all those awesome developers.

##Configuration

To include any of the following calculators on your page, first you must include these script tags in the head of your document:

	<script src="http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
	<script src="http://camspiers.github.com/Bayes/javascripts/bayes-calc-so.js" charset="utf-8"></script>

Once these are included on the page, adding a calculator is as easy as adding a small html snippet into the desired location on your page.

##Examples

To see a demo of the following examples, visit [the demo page](http://camspiers.github.com/Bayes/)

###Simple
	<div class="bayes-calc" data-config='{"type": "simple"}'></div>

###Simple with graph
	<div class="bayes-calc" data-config='{"type": "simple", "graph": true}'></div>

###Full
	<div class="bayes-calc" data-config='{"type": "full"}'></div>

###Full without equation
	<div class="bayes-calc" data-config='{"type": "full", "equation": false}'></div>

###Full with bar graph
	<div class="bayes-calc" data-config='{"type": "full", "graph": true}'></div>

###Full with circle graph
	<div class="bayes-calc" data-config='{"type": "full", "graph": "circle"}'></div>

###Full with *area-proportional* venn graph
	<div class="bayes-calc" data-config='{"type": "full", "graph": "venn"}'></div>

###Full with 4 decimal place rounding
	<div class="bayes-calc" data-config='{"type": "full", "dp": 4}'></div>

###Simple *a fortiori*
	<div class="bayes-calc" data-config='{"type": "simple", "afortiori": true}'></div>

###Full *a fortiori*
	<div class="bayes-calc" data-config='{"type": "full", "afortiori": true}'></div>

###3 Hypotheses
	<div class="bayes-calc" data-config='{"type": "full", "num": 3}'></div>

###3 Hypotheses with circle graph
	<div class="bayes-calc" data-config='{"type": "full", "num": 3, "graph": "circle"}'></div>


##Building the project

###Almond build
	node ../r.js -o name=almond.js include=main out=bayes-calc-so.js baseUrl=.

###Standard require js build
	node ../r.js -o name=main out=bayes-calc.js baseUrl=.