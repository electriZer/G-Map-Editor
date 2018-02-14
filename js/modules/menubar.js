define(function() {

	var Menubar = {}, Editor;

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */

	Menubar.initialize = function() {

		Editor = require("editor");
	};

	/* ==================== */
	/* ====== EVENTS ====== */
	/* ==================== */

	Menubar.events = {
		
		"click *[data-template]": function(e) { Menubar.openDialog(e); },
		"click *[data-toggle]": function(e) { Menubar.toggle(e); },
		"keydown|keyup|change #canvas_settings input": function(e) { Menubar.canvasSettings(e); },
		"keydown|keyup|change #viewport_settings input": function(e) { Menubar.viewportSettings(e); }
	};

	/* ========================= */
	/* ====== OPEN DIALOG ====== */
	/* ========================= */

	// Elements with a data-template attribute will
	// automaticly open a dialog with the correspondig template

	Menubar.openDialog = function(e) {

		var template = Editor.$(e.currentTarget).attr("data-template"),
		    title = Editor.$(e.currentTarget).text();
		var modal = Editor.$(e.currentTarget).attr("data-template-modal") == "false" ? false : true;
		var args = null;
		var callback = null;
		if (typeof Editor.$(e.currentTarget).attr("data-template-args") == "string") {
		    args = Editor.$(e.currentTarget).attr("data-template-args");
		}
		if (typeof Editor.$(e.currentTarget).attr("data-template-onload") == "string") {
		    callback = this.CallbackWaiter(Editor.$(e.currentTarget).attr("data-template-onload"));
		}
		Menubar._openDialog(template, title, modal,args,callback);
	};

	Menubar._openDialog = function(template,title,modal,args,callback){
	    if ($("#" + template).length) return;
	    
	    $.get("dialog/" + template + ".html", function (data) {
	        Editor.$(document.body).append("<div id='"+template+"' class='dialog'></div>");
	        Editor.$("#" + template).html(data).dialog({
	            title: title,
	            modal: modal==undefined?true:modal,
	            closeText: "<span class='fa fa-times-circle ui-close-Text'></span>",
	            resizable: false,
	            width: "auto",
	            close: function (e, ui) {
	                $(this).dialog('destroy').remove();
	            }
	        });
            
	        Editor.$("#" + template).find("input[data-value]").each(function () {
	            var pair = Editor.$(this).attr("data-value").split(":"),
				    type = Editor.$(this).attr("type"),
				    value = Editor.$(pair[0]).css(pair[1]);

	            if (type == "number") { value = parseInt(value, 10); }
	            if (pair[2] == "tiles") { value = Math.floor(value / Editor.activeTileset["tile" + pair[1]]); }
	            Editor.$(this).val(value);
	        });

	        Editor.$("#" + template).find("input[data-args]").each(function () {
	            //if (Editor.$(this).attr("data-args") == "tile") {
                    Editor.$(this).val(args)
	            //}
	        });
	        if (typeof callback == 'function') {
	            callback();
	        } 
	    });
	}

    /* ==================== */
    /* = CALLBACK WAITER == */
    /* ==================== */
    /*
        Description : 
        This is a callback waiter.
        It returns a Waiter Function that u can use as a Callback.
        The Waiter Function will fire the given Function ( @FunctionName ) when it exists.
        
        Why this?
        Because when a script is loaded dynamically, not every js function is loaded as fast as the content.

    */
	Menubar.CallbackWaiter = function (FunctionName) {
	    var waiter = function () {
	        if ($.isFunction(window[FunctionName])) {
	            window[FunctionName]();
	        } else {
	            window.setTimeout(waiter, 50);
	        }
	    }

	    return waiter;
	}

	/* ==================== */
	/* ====== TOGGLE ====== */
	/* ==================== */

	// Elements with a data-toggle attribute will
	// automaticly be toggled when clicked

	Menubar.toggle = function(e) {

		var value = Editor.$(e.currentTarget).attr("data-toggle"),
		    extra = value.split(":"), status, elem;

		// data-toggle="visibility:elem">
		if (extra[0] == "visibility") {

			status = Editor.$(extra[1]).toggle();
			Editor.$(e.currentTarget).find("span").toggleClass("fa-square-o", "fa-check-square-o");

		// data-toggle="class:classname:elem"dddd
		} else if (extra[0] == "class") {

			status = Editor.$(extra[2]).toggleClass(extra[1]);
			Editor.$(e.currentTarget).find("span").toggleClass("fa-square-o", "fa-check-square-o");

		} else if (extra[0] == "fullscreen") {

			elem = Editor.$(extra[1])[0];

			if (!Editor.fullscreen) {
				if (elem.requestFullscreen) { elem.requestFullscreen(); }
				else if (elem.mozRequestFullScreen) { elem.mozRequestFullScreen(); }
				else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen(); }
			} else {
				if (document.cancelFullScreen) { document.cancelFullScreen(); }
				else if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); }
				else if (document.webkitCancelFullScreen) { document.webkitCancelFullScreen(); }
			}

			Editor.$(e.currentTarget).find(".text").html(Editor.fullscreen ? "Fullscreen" : "Windowed");
			Editor.$(e.currentTarget).find("span:eq(0)").toggleClass("fa-compress", "fa-expand");
			Editor.fullscreen = !Editor.fullscreen;

		} else { Menubar.toggleFunctions[value](); }
	};

	/* ============================= */
	/* ====== CANVAS SETTINGS ====== */
	/* ============================= */

	Menubar.canvasSettings = function(e) {

		var name = Editor.$(e.currentTarget).attr("name"),
		    value = Editor.$(e.currentTarget).val(),
		    tileset = Editor.activeTileset;

		if (name == "width") { value = (+value) * tileset.tilewidth; }
		if (name == "height") { value = (+value) * tileset.tileheight; }

		Editor.$("#canvas").css(name, value);
		Editor.Canvas.reposition();
	};

	/* =============================== */
	/* ====== VIEWPORT SETTINGS ====== */
	/* =============================== */

	Menubar.viewportSettings = function(e) {

		var name = Editor.$(e.currentTarget).attr("name"),
		    value = + Editor.$(e.currentTarget).val();

		Editor.$("#viewport").css(name, value);
		Editor.Canvas.reposition();
	};

	Menubar.toggleFunctions = {};

	return Menubar;
});