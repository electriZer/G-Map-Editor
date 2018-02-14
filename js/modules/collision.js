define(function() {

	var Collision = {}, Editor;

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */

	Collision.initialize = function() {

		Editor = require("editor");
	};

	/* ==================== */
	/* ====== EVENTS ====== */
	/* ==================== */

	Collision.events = {
		
	    "click #collision_settings i": function () {
	        var $e = Editor.$(this);

	        var all = false;
	        if ($e.attr("data-block") == "all") {
	            all = true;
	        }

	        if ($e.hasClass("active")) {
	            if (all) {
	                Editor.$("#collision_settings i").removeClass("active");
	            } else {
	                Editor.$("#collision_settings i[data-block=all]").removeClass("active");
	            }
	            $e.removeClass("active");
	        } else {
	            if (all) {
	                Editor.$("#collision_settings i").addClass("active");
	            } 
	            $e.addClass("active");
	            if (Editor.$("#collision_settings i.active").length == 8) {
	                Editor.$("#collision_settings i[data-block=all]").addClass("active");
	            }
	        }
		}
	};


	return Collision;
});