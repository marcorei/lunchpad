/*
 * Lunchpad Onboarding
 *
 * @author Markus Riegel <riegel.markus@googlemail.com>
 */
/*
(function(window,Shepherd,undefined){

	function createCookie(name, value, days) {
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		}
		else var expires = "";
		document.cookie = name+"="+value+expires+"; path=/";
	}

	function readCookie(name) {
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	}

	function eraseCookie(name) {
		createCookie(name,"",-1);
	}

	function sComplete(){
		createCookie("onboardingLanding", "completed", 999999);
	}

	function init(){
		//eraseCookie("onboardingLanding");
		// cookie set?
		if(readCookie("onboardingLanding") !== "completed"){
			shepherd = new Shepherd.Tour({
				defaults: {
					//classes: "shepherd-element shepherd-open shepherd-theme-arrows",
					classes: "shepherd-element shepherd-open",
					showCancelLink: true
				}
			});

			shepherd.addStep("welcome",{
				title: "Even Better!",
				text: "Welcome to the new Lunchpad!",
				buttons: [
					{
						text: 'Next',
						classes: 'lunch-button',
						action: shepherd.next
					}
				]
			});

			shepherd.addStep("detail",{
				title: "Venue Detail",
				text: "Click on a venue name! <br>You can add comments on the detail page!",
				attachTo: ".lunch-venue-title bottom",
				buttons: [
					{
						text: 'Back',
						classes: 'lunch-button shepherd-button-secondary',
						action: shepherd.back
					}, {
						text: 'Next',
						classes: 'lunch-button',
						action: shepherd.next
					}
				]
			});

			shepherd.addStep("notifications",{
				title: "Improved Notifications",
				text: "We added new and improved notifications! <br>Go to your profile to update your settings.",
				attachTo: ".lunch-fn-settings left",
				buttons: [
					{
						text: 'Back',
						classes: 'lunch-button shepherd-button-secondary',
						action: shepherd.back
					}, {
						text: 'Next',
						classes: 'lunch-button',
						action: shepherd.next
					}
				]
			});

			shepherd.addStep("profile",{
				title: "Items",
				text: "Pimp your Character with items! <br>You can earn new items through contests and on special occasions.",
				attachTo: ".lunch-fn-settings left",
				buttons: [
					{
						text: 'Back',
						classes: 'lunch-button shepherd-button-secondary',
						action: shepherd.back
					}, {
						text: 'Done',
						classes: 'lunch-button',
						action: shepherd.next
					}
				]
			});

			shepherd.on("complete", sComplete);
			shepherd.on("cancel", sComplete);

			shepherd.start();
		}
	}
	

	window.addEventListener("load", function load(event){
		init();
	});

})(window,Shepherd);
*/