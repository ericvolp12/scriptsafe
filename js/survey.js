'use strict';
var version = '1.0.9.3';
var bkg = chrome.extension.getBackgroundPage();
var settingnames = [];
var syncstatus;
var submitFeedback = function(userid, survey) {
	var body = {
		"userid":userid,
		"survey": survey,

	};
	$.ajax({
		type: "POST",
		url: "http://api.3ric.co/feedback",
		data: body,
		complete: function(xhr, textStatus){
			console.log(xhr)
			if(xhr.status === 201){
				$(".feedback_form").remove();
				$("#surveyElement").append("<div class='success_message'><br /><h2>Your feedback has been successfully submitted</h2></div>");
				setTimeout(function() {
					$(".success_message").remove();
				}, 5000);
			} else {
				$("#surveyElement").append("<div class='success_message'><br /><h2>There was an error submitting your feedback, please try again!</h2></div>");
				setTimeout(function() {
					$(".success_message").remove();
				}, 5000);
			}
		},
		dataType: "application/json"
	})
}
function getRandomToken() {
    // E.g. 8 * 32 = 256 bits token
    var randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    var hex = '';
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }
    // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
    return hex;
}

document.addEventListener('DOMContentLoaded', function () {
    if (typeof(localStorage["feedbackList"])==='undefined') localStorage["feedbackList"] = JSON.stringify([]);
    var feedbackList = JSON.parse(localStorage["feedbackList"]);
    if (feedbackList.length === 0) {
        $("#survey-error-message").text("You haven't allowed any domains in the collection period (past 24 hours)");
    }else{
        Survey.defaultBootstrapCss.navigationButton = "btn btn-green";
        Survey.defaultBootstrapCss.rating.item = "btn btn-default my-rating";
        Survey.Survey.cssType = "bootstrap";
        
        var pages = [];
        var uniqueDomains = [];

        for(var i = 0; i < feedbackList.length; i++){
            var item = feedbackList[i];
            var dup = 0;
            for (var j = 0; j < uniqueDomains.length; j++){
                var kid = uniqueDomains[j];
                if (j!==i && kid === item.visibleDomain){
                    dup ++;
                }
            }
            if (!dup){
                uniqueDomains.push(item.visibleDomain);
            }else{
                continue;
            }

            var domains = [];
            domains.push(
                { value: item.allowingDomain, text: item.allowingDomain }
            )

            for(var j = 0; j < feedbackList.length; j++){
                var kid = feedbackList[j];
                if (item.visibleDomain === kid.visibleDomain && item.allowingDomain !== kid.allowingDomain){
                    domains.push(
                        { value: kid.allowingDomain, text: kid.allowingDomain }
                    )
                }
            }
            pages.push( 
                {questions: [
                { type: "matrix", name: "Quality", title: "How are the following domain(s) related to: " + item.visibleDomain,
                    columns: [{ value: 1, text: "They share a domain" }, 
                            { value: 2, text: "They are owned by the same people" }, 
                            { value: 3, text: "This domain provides functionality necessary to use the site" }, 
                            { value: 4, text: "This domain serves ads for the site" }, 
                            { value: 5, text: "This domain tracks me but might not serve ads" }, 
                            { value: 6, text: "I'm not sure how this domain is related" }, 
                            { value: 7, text: "I would prefer not to answer" }],
                    rows: domains
                }]
            });
        }
        
        var json = { pages: pages};
        
        window.survey = new Survey.Model(json);
        
        
        survey.onComplete.add(function(result) {
            chrome.storage.sync.get('userid', function(items) {
                var userid = items.userid;
                if (userid) {
                    useToken(userid);
                } else {
                    userid = getRandomToken();
                    chrome.storage.sync.set({userid: userid}, function() {
                        useToken(userid);
                    });
                }
                function useToken(userid) {
                    submitFeedback(userid,result.data);
                }
            });
        });
        
        
        $("#surveyElement").Survey({ 
            model: survey 
        });
    }   
});