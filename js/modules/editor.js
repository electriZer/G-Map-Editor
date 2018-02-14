define([
	"underscore",
	"modules/utils",
	"modules/menubar",
	"modules/tools",
	"modules/canvas",
	"modules/tilesets",
	"modules/layers",
	"modules/import",
	"modules/export",
    "modules/newfile",
    "modules/events",
    "modules/history",
    "modules/collision"

], function() {

	var Editor = {};
	var args = arguments;
	var argNames = ["_", "Utils","Menubar", "Tools", "Canvas", "Tilesets", "Layers", "Export", "Import","NewFile","Events","History","Collision"];

	Editor.tool = "draw";
	Editor.keystatus = {};
	Editor.mousedown = false;
	Editor.selection = null;

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */

	Editor.initialize = function() {

		// Initialize sub modules
		argNames.forEach(function(v, i) {

			Editor[v] = args[i];

			if (typeof Editor[v].initialize == "function")
			{ Editor[v].initialize(); }
		});

		// Register module events
		Editor.registerEvents();

		// Menubar interaction
		$("#topbar > li").on("click mouseover", function(e) {
			if (e.type == "mouseover" && !$("#topbar > li.open").length) { return; }
			$("#topbar > li").removeClass("open");
			$(e.currentTarget).addClass("open");
		});

		$("body").on("mousedown", function(e) {
			if (!$("#topbar").find(e.target).length) {
				$("#topbar > li").removeClass("open");
			}
		});

		// Make toolbar resizable
		$("#toolbar").resizable({
		    minWidth: 250,
            right:0,
			mouseButton: 1,
			handles: "w",
			alsoResize: "#tileset, #tileset .jspPane, #tileset .jspContainer, #tileset .jspHorizontalBar *",
			stop: function () { Editor.Canvas.reposition(); $("#tileset").jScrollPane(); }
		});

		// Global mouse status
		$(document).on("mousedown mouseup", function(e) {
		    Editor.mousedown = e.type == "mousedown" && e.which == 1;
		    
		});
        
		// Disable selection
		$("#tileset, #canvas_wrapper").disableSelection();

        

		// Hide the loading screen
	    //$("#loading_screen").fadeOut();

	    // Misc

		if (typeof String.prototype.startsWith != 'function') {
		    String.prototype.startsWith = function (str) {
		        return this.slice(0, str.length) == str;
		    };
		}
	};


	/* ============================= */
	/* ====== REGISTER EVENTS ====== */
	/* ============================= */

	Editor.registerEvents = function() {

		// Register module events
		var pair, type, selector;

		argNames.forEach(function(v) {
			if (Editor[v].events) {
				for (var evt in Editor[v].events) {
					pair = evt.split(" ");
					type = pair.shift().replace(/\|/g, " ");
					selector = pair.join(" ");
					$("body").on(type, selector, Editor[v].events[evt]);
				}
			}
		});
	};

	return Editor;
});