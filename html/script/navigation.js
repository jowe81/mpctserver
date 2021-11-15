//Highlight selected nav item (if exists) and update config.hui.currentView
function setView(view){
	$("[data-view=\""+view+"\"]").addClass('nav_highlighted');
	if (config){
		config.hui.currentView=view;
	}
}
