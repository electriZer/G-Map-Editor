define(function() {

	var Import = {}, Editor;

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */

	Import.initialize = function() {

		Editor = require("editor");
	};

	/* ==================== */
	/* ====== EVENTS ====== */
	/* ==================== */

	Import.events = {
		
		"change input[name=file_import]": function(e) { Import.cacheFile(e); },
		"click #import_submit": function(e) {

			if (!Import.tmp) { return alert("No file selected"); }

			//var type = Import.tmp.name.split(".").pop().toLowerCase(),
			 var   reader = new FileReader();

			if (window.FileReader) {
				reader.readAsText(Import.tmp);
				reader.onload = function(e) { Import.process(e.target.result); };
			} else { Import.process(Import.tmp); }

		}
	};

	/* ===================== */
	/* ====== PROCESS ====== */
	/* ===================== */

	Import.process = function(data/*, type*/) {
	    var tw = 32, th = 32;

	    data = JSON.parse(data);

		Editor.$("#layerlist li, #tilesets option, .layer").remove();

		var error = false;

		data.tilesets.forEach(function(tileset) {

			var id = tileset.name.replace(/[^a-zA-Z]/g, '_');
			var hasSrc = tileset.image.indexOf("data:image") === 0;

			if (!hasSrc && !Editor.$("#tileset_" + id).length) {

				alert(
					"Error: the source for the tileset \"" + tileset.name + "\" " + 
					"is not currently present and is not included in your map file either. " +
					"Importing will be aborted."
				);

				error = true;
				return false;

			} else if (hasSrc && !Editor.$("#tileset_" + id).length) {
				Editor.Tilesets.add(tileset);
			} else if (Editor.$("#tileset_" + id).length) {
				Editor.$("#tilesets select").append("<option>" + tileset.name + "</option>");
			}
		});

		if (error) { return; }
		Editor.Tilesets.set(data.tilesets[0].name);

		data.layers.forEach(function (layer) {
		    var $layer;
		    var event = false;
		    if (layer.id) {
		        $layer = Editor.$("<div id='event_layer' class='layer'></div>");
		        Editor.$("#tiles").append($layer);
		        event = true;
		    } else {
		        Editor.Layers.add(layer.name);
		        $layer = Editor.$(".layer[data-name=" + layer.name + "]");
		    }

		    function GetTileSet(name) {
		        var tilesetId;

		        data.tilesets.forEach(function (v, i) {
		            if (v.name == name) {
		                tilesetId = i;
		                return false;
		            }
		        });
		        return data.tilesets[tilesetId];
		    }

		    function GetTileSetName(id) {
		        return data.tilesets[id].name;
		    }

		    function getTileSetClassName(id) {
			    return "ts_" + data.tilesets[id].name.replace(/[^a-zA-Z]/g, '_');
			}

		    //var w = Math.round(data.canvas.width / tileset.tilewidth);

			layer.data.forEach(function(pixel, i) {

			    var coords = pixel[0],
                    x = parseInt(pixel[1]),
                    y = parseInt(pixel[2]),
                    data_tileset = GetTileSetName(pixel[3]),
                    tileset_id = pixel[3];
			    if (!event) {
			        if (coords == -1) { return true; }
			        if (coords % 10 == 0) { coords = coords.toString() + ".0"; }
			        else { coords = coords.toString();}
			    }

				var $box;
				if (!event) {
				    $box = Editor.$("<div>").css({
				        position: "absolute",
				        left: x * tw,
				        top: y * th
				    }).attr("data-coords", x + "." + y);
				    var bgpos = coords.split(".");
				    $box.attr("data-tileset", data_tileset);
				    $box.attr("class", getTileSetClassName(tileset_id));
				    $box.attr("data-coords-tileset", coords);
				    $box.css("background-position", (-(bgpos[0] * tw)) + "px" + " " + (-(bgpos[1] * th)) + "px");
				} else {
				    $box = Editor.$("<i>").css({
				        position: "absolute",
				        left: x * tw,
				        top: y * th
				    })
                    .attr("data-coords", x + "." + y)
				    .addClass("fa fa-bolt");
				}
				$layer.append($box);
			});
		});

		Editor.Events.clear();
		events = JSON.parse(data.events);
		events.forEach(function (entry) {
		    Editor.Events.addNode(entry);
		});
		console.dir(events);
		console.dir(Editor.Events);
		Editor.$("#dialog").dialog("close");

		delete Import.tmp;
	};

	Import.cacheFile = function(e) {

		if (!window.FileReader) {
			e.preventDefault();
			Import.tmp = prompt("Your browser doesn't support local file upload.\nPlease insert an image URL below:", "");
		} else if (e.type == "change") {
			Import.tmp = e.target.files[0];
			Editor.$("#dialog input[name=file_overlay]").val(Import.tmp.name);
		}
	};

	return Import;
});