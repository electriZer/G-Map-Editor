define(function() {

	var NewFile = {}, Editor;

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */

	NewFile.initialize = function() {

		Editor = require("editor");
	};

	/* ==================== */
	/* ====== EVENTS ====== */
	/* ==================== */

	NewFile.events = {
		
	    "click #NewFile": function (e) {
            // Get Parameters
	        var MapName = Editor.$('input[name=MapName]').val();
	        var MapWidth = Editor.$('input[name=MapWidth]').val();
	        var MapHeight = Editor.$('input[name=MapHeight]').val();
            // Pass Parameters and process
	        NewFile.process(MapName, MapWidth, MapHeight);
		}
	};

	/* ===================== */
	/* ====== PROCESS ====== */
	/* ===================== */

	NewFile.process = function (MapName, MapWidth, MapHeight) {
	    Editor.$("#canvas").css("width", MapWidth * Editor.activeTileset.tilewidth);
	    Editor.$("#canvas").css("height", MapHeight * Editor.activeTileset.tileheight);

	    // Reset Layers
	    Editor.$("#layerlist li, #tilesets option, .layer").remove();
	    // Add predefined layers
	    Editor.Layers.add("background");
	    Editor.Layers.add("world");

	    Editor.Canvas.updateGrid()
	    Editor.Canvas.reposition();
	};
	return NewFile;
});