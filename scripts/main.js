require(["bayes"], function(bayes) {
    $(function() {
    	(new bayes).init({
    		selector: "#simple",
    		type: 'simple'
    	});
    	(new bayes).init({
    		selector: "#full",
    		type: 'full',
    		styles: false
    	});
    });
});