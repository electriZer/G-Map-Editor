define(function() {

	var Tools = {}, Editor;

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */

	Tools.initialize = function() {

		Editor = require("editor");
	};

	/* ==================== */
	/* ====== EVENTS ====== */
	/* ==================== */

	Tools.events = {
		"click *[data-tool]": function(e) { Tools.select(e); }
	};

	/* ==================== */
	/* ====== SELECT ====== */
	/* ==================== */

	Tools.select = function(e) {
		var $target = Editor.$(e.currentTarget);

		Editor.$("#tools").find("span").removeClass("active");
		$target.addClass("active");
		Editor.tool = $target.attr("data-tool");

		if (Editor.tool == "erase" || Editor.tool == "events") { Editor.Tilesets.resetSelection(); }
		switch (Editor.tool) {
		    case "fill":
		    case "drawBox":
		    case "draw":
		    case "erase":
		        // enable layer selection and tools
		        Editor.$("#layerlist > li").removeClass("disabled");
		        Editor.$("#layers div.buttons a").removeClass("disabled");
		        Editor.$("#tilesets").removeClass("disabled");
                // Deactivate collision layer and settings
		        Editor.$("#collision_layer").hide();
		        Editor.$("#collision_settings").hide();

                // deactivate event layer
		        Editor.$("#event_layer").removeClass("active");
		        break;
		    case "events":
		        // set all layers to background
		        Editor.$(".layer").removeClass("active");
		        Editor.$("#layerlist > li").removeClass("active");
		        // disable layer selection and tools
		        Editor.$("#layerlist > li").addClass("disabled");
		        Editor.$("#layers div.buttons a").addClass("disabled");
		        // disable tile selection
		        Editor.$("#tilesets").addClass("disabled");
                // activate event layer
		        Editor.$("#event_layer").addClass("active");
		        // Deactivate collision layer and settings
		        Editor.$("#collision_layer").hide();
		        Editor.$("#collision_settings").hide();
		        break;
		    case "collision":
		        // set all layers to background
		        Editor.$(".layer").removeClass("active");
		        Editor.$("#layerlist > li").removeClass("active");
		        // disable layer selection and tools
		        Editor.$("#layerlist > li").addClass("disabled");
		        Editor.$("#layers div.buttons a").addClass("disabled");
		        // disable tile selection
		        Editor.$("#tilesets").addClass("disabled");
		        // Activate collision layer and settings
		        Editor.$("#collision_layer").hide();
		        Editor.$("#collision_settings").hide();
		        Editor.$("#collision_layer").show();
		        Editor.$("#collision_settings").show();
		        break;
		}
	};

	return Tools;
});