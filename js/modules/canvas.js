define(function () {

    var Canvas = {}, Editor;

    Canvas.cursor = [];
    Canvas.cursor.last = {};

    /* ======================== */
    /* ====== INITIALIZE ====== */
    /* ======================== */

    Canvas.initialize = function () {

        Editor = require("editor");

        Editor.$("#canvas").draggable({
            mouseButton: 2,
            cursor: "move",
            containment : '#canvas_wrapper',
            /*start: function () {
                if (!Editor.keystatus.spacebar) {
                    Editor.$("body").css("cursor", "");
                    return false;
                }
            }*/
        });

        this.reposition();
        Editor.$("#canvas").fadeIn();
        Editor.$(window).on("resize", this.reposition);

        // Hide selection on leave
        Editor.$("#canvas").mouseleave(function () { Editor.$("#canvas .selection").hide(); });
        // Show selection on enter
        Editor.$("#canvas").mouseenter(function () { Editor.$("#canvas .selection").show(); });

    };

    Canvas.Working = false;

    /* ==================== */
    /* ====== EVENTS ====== */
    /* ==================== */
    Canvas.events = {
        "keyup": function(e){
            if (e.ctrlKey && e.keyCode == 90) { // STRG + Z
                $("#UnDo").click();
            }
        },

        // Selection movement
        "mousedown|mousemove|mouseup #canvas": function (e) {

            if (!Editor.activeTileset) { return; }
            if (e.which == 3) { Editor.Tilesets.resetSelection(); return; } // Rightclick : Reset Selection

            var tileset = Editor.activeTileset,
		        tw = tileset.tilewidth,
		        th = tileset.tileheight;

            var offset = Editor.$("#canvas").offset(),
            x = Math.floor((e.pageX - offset.left) / tw),
            y = Math.floor((e.pageY - offset.top) / th);

            Canvas.cursor[0] = x;
            Canvas.cursor[1] = y;

            // Move selection
            Editor.$("#canvas .selection").css({
                top: y * th,
                left: x * tw
            });
           
            if (e.which != 2) {

                if (Editor.selection && ((e.type == "mousedown" && e.which == 1) || ((Editor.mousedown) && e.type=="mousemove"))) {
                    
                    if (Editor.tool == "draw") {
                        
                        // Prevent redrawing of previous drawn tiles.
                        // Start x, Start y, End x, End y
                        var sx = Editor.selection[0][0],
					        sy = Editor.selection[0][1],
					        ex = Editor.selection[1][0],
					        ey = Editor.selection[1][1],

					        // Length for iterated x and y variables
					        lx = ex - sx,
					        ly = ey - sy;

                        // Iterate through selected tiles check to see if they have been previously drawn.
                        for (y = 0; y <= ly; y++) {
                            for (x = 0; x <= lx; x++) {
                                if ([Canvas.cursor[0] + x, Canvas.cursor[1] + y] in Canvas.cursor.last) { return; }
                            }
                        }
                        Canvas.draw();
                    }
                   
                    else if (Editor.tool == "drawBox") {
                        Canvas.drawBox(e);
                    }
                    else if (Editor.tool == "fill") { 
                        if (!Canvas.Working) {	// Anti Double click for high latency dom manipulation
                            Canvas.Working = true;
                            Canvas.fill();
                        }
						
                    }
                   
                }
				else if (Editor.selection && Editor.tool == "fill" && e.type=="mousemove"){
					// remove multi selection tiles
					
					// Start x, Start x, End x, End y
					sx = Editor.selection[0][0],
					sy = Editor.selection[0][1],
					ex = Editor.selection[1][0],
					ey = Editor.selection[1][1],

					// Length for iterated x and y variables
					lx = ex - sx,
					ly = ey - sy;

					var tiles = $("#canvas .selection");
					if(( lx > 0 || ly > 0)){
						if( Editor.selection.custom){
							// Custom selection means "div.selection" contains child elements
							// Get first Tile in selection 
							// (you can create a custom selection if you select elements from the canvas)
							var $first = $("#canvas .selection div").first().clone();
							
							$("#canvas .selection div").remove();	// clear selection
							Editor.selection.custom = false // reset selection type
							
							var $selection = $("#canvas .selection");
							
							
							$selection.css({	// format selection (size and background image[=> Tile])
									width:32,
									height:32,
									"background-position": $first.css("background-position"),
									"background-image" : $first.css("background-image"),
									"display":"box"
							})
							.addClass($first.attr("class"))
							.removeClass("nobg");
														
						}else{
							// "div.selection" is cropped from the tileset
							// just resize to 32x32
							$("#canvas .selection").css({width:32,height:32});
						}
						
						
					} 
					
				}
                else if ((Editor.tool == "draw" || Editor.tool=="collision") && e.type == "mouseup") {
					if (Canvas.DrawHistElements.length > 0) {
						// History
                        Editor.History.push(Canvas.DrawHistElements, "bulk");
                        Canvas.DrawHistElements = [];
						// /History
                    }else {
                        Canvas.makeSelection(e);
                    }
                }
               
                else if (Editor.tool == "erase") {
                    Editor.Tilesets.resetSelection();
                    if(Editor.mousedown){
						Canvas.erase();
					}
					else if(!Editor.selection) {
						Canvas.makeSelection(e);
					}
                }
                else if (Editor.tool == "events" && Editor.mousedown) {
                    Editor.Tilesets.resetSelection();
                    Canvas.editEvent()
                }
                else if (Editor.tool == "collision") {
                    // Clear Selection (removes tiles etc.)
                    Editor.Tilesets.resetSelection();
                   
                    if (Editor.mousedown) {
                        // Collision part
                        Canvas.editCollision();
                    } else {
                        // Create selection Box
                        Canvas.makeSelection(e);
                    }
                }
                else if (Editor.tool == "drawBox") {
					Canvas.drawBox(e);
                }
                else if (!Editor.selection ) {
                    Canvas.makeSelection(e);
                }

                //On mouseup with selection clear last draw cache.
                if (Editor.selection && !Editor.mousedown) {
                    Canvas.cursor.last = {};
                    //Canvas.cursor = {};
                }
            }
        }
    };

    /* =================== */
    /* ====== ERASE ====== */
    /* =================== */

    Canvas.erase = function () {

        var layer = Editor.Layers.getActive(),

		    // Cursor position
		    cx = this.cursor[0],
		    cy = this.cursor[1];

        $tile = Editor.$(layer.elem).find("div[data-coords='" + cx + "." + cy + "']");
        // History
        var HistElem = $tile.clone().data("layer", layer.elem).get(0);
        Editor.History.push(HistElem, "remove");
        // /History

        if ($tile.length) { $tile.remove(); }
    };

    /* =================== */
    /* == EVENT DIALOG === */
    /* =================== */
    
    Canvas.editEvent = function () {
        if ($("#edit_event_dialog").length) {
            $("#edit_event_dialog").remove();
        }
            // Cursor position
            var cx = this.cursor[0],
            cy = this.cursor[1];
            // tile id with coordinates
            tile_id = cx + "." + cy;
            // load edit dialog and send information
            Editor.Menubar._openDialog("edit_event", "Event Editor", false, tile_id, function () {
                edit_event_ready();
            });
        
    }
    /* =================== */
    /* ===== COLLISION === */
    /* =================== */

    Canvas.editCollision = function () {
        $layer = Editor.$("#collision_layer");
        
        // Cursor position
        var cx = this.cursor[0],
        cy = this.cursor[1];
        
        // History Type
        var HistType = "change";    // default (=> Tile already existed and was changed)

        $tile = $layer.find("div[data-coords='" + cx + "." + cy + "']");
        var blocks = Canvas.parseCollision();
        if (!$tile.length) {    // If no tile exists
            // Create tile if it doesn't exist
            $tile = $("<div></div>").css({
                position: "absolute",
                top: cy * 32,
                left: cx * 32,
            }).attr("data-coords", cx + "." + cy);
            $layer.append($tile);
            HistType = "add";   // Tile was created
        }
        if (blocks.length == 0)
        {
            $tile.remove();
            return;
        }
        // raw settings obj
        $set = $("<i></i>").css({
            position: "absolute"
        }).addClass("fa fa-bold");
        $tile.empty();

        ////// Add all block arrows
        // up-up
        var $ud = $set.clone().css({top: 0,left: 13}).addClass("fa-chevron-down").appendTo($tile);
        // up-down
        var $uu = $set.clone().css({ top: 5, left: 13 }).addClass("fa-chevron-up").appendTo($tile);

        // down-up
        var $du = $set.clone().css({ top: 26, left: 13 }).addClass("fa-chevron-up").appendTo($tile);
        // down-down
        var $dd = $set.clone().css({top: 21,left: 13}).addClass("fa-chevron-down").appendTo($tile);
        
        // left-left
        var $lr = $set.clone().css({top: 13,left: 0}).addClass("fa-chevron-right").appendTo($tile);
        // left-right
        var $ll = $set.clone().css({ top: 13, left: 5}).addClass("fa-chevron-left").appendTo($tile);

        // right-left
        var $rl = $set.clone().css({ top: 13, left: 21 }).addClass("fa-chevron-right").appendTo($tile);
        // right-right
        var $rr = $set.clone().css({ top: 13, left: 26 }).addClass("fa-chevron-left").appendTo($tile);

        // all
        var $all = $set.clone().css({ top: 13, left: 13 }).addClass("fa-crosshairs").appendTo($tile);

        ///////////////////////////////
        //// Check each block setting
        if (blocks.contains("up-down")) { $ud.addClass("active"); }
        if (blocks.contains("up-up")) { $uu.addClass("active"); }
        if (blocks.contains("down-up")) { $du.addClass("active"); }
        if (blocks.contains("down-down")) { $dd.addClass("active"); }
        if (blocks.contains("left-left")) { $ll.addClass("active"); }
        if (blocks.contains("left-right")) { $lr.addClass("active"); }
        if (blocks.contains("right-left")) { $rl.addClass("active"); }
        if (blocks.contains("right-right")) { $rr.addClass("active"); }
        if (blocks.contains("all")) { $all.addClass("active"); }
        
        // Save Settings
        $tile.data("data-block", blocks);

        // Save to History
        var HistElem = $tile.clone().data("layer", $layer.get(0)).get(0);
        Canvas.DrawHistElements.push(Editor.History.NewNode(HistElem, HistType));
    }

    Array.prototype.contains = function (entry) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] === entry) return true;
        }
        return false;
    }

    Canvas.parseCollision = function () {
        // Parse Collision Settings
        $settings = $("#collision_settings .setting i.active");
        var block = [];
        $.each($settings, function () {
            // Get data-* attribute 
            block.push(Editor.$(this).attr("data-block"));
        });
        return block;
    }

    /* ================== */
    /* ====== DRAW ====== */
    /* ================== */
    Canvas.DrawHistElements = [];

    Canvas.draw = function () {

        var tileset = Editor.activeTileset,
		    layer = Editor.Layers.getActive(),

		    // Cursor position
		    cx = this.cursor[0],
		    cy = this.cursor[1],

		    // Tilsize
		    tw = tileset.tilewidth,
		    th = tileset.tileheight,

		    // Start x, Start x, End x, End y
		    sx = Editor.selection[0][0],
		    sy = Editor.selection[0][1],
		    ex = Editor.selection[1][0],
		    ey = Editor.selection[1][1],

		    // Length for iterated x and y variables
		    lx = ex - sx,
		    ly = ey - sy,

		    // Background position
		    bgpos = Editor.$("#canvas .selection").css("background-position").split(" "),
		    bgx = parseInt(bgpos[0], 10),
		    bgy = parseInt(bgpos[1], 10),
            

		    // Tile position on the canvas
		    pos_x, pos_y, coords,

		    // Misc
		    $div, x, y, query, cxp, cyp, $tile, top, left;

        if (Editor.selection.custom) {

            cxp = cx * tw;                                                  
            cyp = cy * th;

            Editor.$("#canvas .selection").find("div").each(function () {
                top = parseInt(Editor.$(this).css("top"), 10);
                left = parseInt(Editor.$(this).css("left"), 10);

                $tile = Editor.$(this).clone();
                
                coords = ((left + cxp) / tw) + "." + ((top + cyp) / th);
                query = Editor.$(layer.elem).find("div[data-coords='" + coords + "']");

                // History
                var HistElem = null;
                var HistType = "";
                // /History

                if (query.length) {
                    // History
                    HistElem = query.first().clone().data("layer", layer.elem).get(0);
                    HistType = "change";
                    // /History
                    Editor.$(query)
                        //.attr("style", $tile.attr("style"))
                        .css({
                            "background-position": $tile.css("background-position")
                        })
                        .attr("class", $tile.attr("class"))
                        .attr("data-tileset", $tile.attr("data-tileset"))
                        .attr("data-coords-tileset", $tile.attr("data-coords-tileset"));
                } else {
                    $tile
                        .attr("data-coords", coords)
                        .css({
                            position:"absolute",
                            top: top + cyp,
                            left: left + cxp
                        })
                        .appendTo(layer.elem);
                    // History
                    HistElem = $tile.clone().data("layer", layer.elem).get(0);
                    HistType = "add";
                    // /History
                }
                Canvas.DrawHistElements.push(Editor.History.NewNode(HistElem, HistType));
            });
        } else {
            // Iterate through selected tiles
            for (y = 0; y <= ly; y++) {
                for (x = 0; x <= lx; x++) {

                    pos_x = cx + x;
                    pos_y = cy + y;
                    Canvas.cursor.last[[pos_x, pos_y]] = true;
                    coords = pos_x + "." + pos_y;
                    query = Editor.$(layer.elem).find("div[data-coords='" + coords + "']");

                    // Update existing tile or create a new one and position it
                    $div = (query.length ? query.first() : Editor.$("<div>").css({
                        position: "absolute",
                        left: pos_x * tw,
                        top: pos_y * th
                    })).attr("data-coords", coords);

                    // History
                    var HistElem = $div.clone().data("layer", layer.elem).get(0);
                    var HistType = "change";  
                    // /History

                    $div.attr("data-coords-tileset", (Math.abs(bgx / tw) + x) + "." + (Math.abs(bgy / th) + y))
                        .css("background-position", (bgx - (x * tw)) + "px" + " " + (bgy - (y * th)) + "px")
                        .attr("class", "ts_" + tileset.id)
                        .attr("data-tileset", tileset.name);

                    // Append the tile if it didn't on that coordinate
                    if (!query.length) {
                        Editor.$(layer.elem).append($div);
                        HistElem = $div.clone().data("layer", layer.elem).get(0);
                        HistType = "add";   // History
                    }
                    Canvas.DrawHistElements.push(Editor.History.NewNode(HistElem, HistType));

                }
            }
            
        }
        
    };

    Array.prototype.contains = function (elem) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == elem) return true;
        }
        return false;
    };

    /* ================== */
    /* ====== FILL ====== */
    /* ================== */

    Canvas.fill = function (e) {
        // Zustaende und Werte
        var tileset = Editor.activeTileset,
		    layer = Editor.Layers.getActive(),

		    // Cursor position
		    cx = this.cursor[0],
		    cy = this.cursor[1],

		    // Tilsize
		    tw = tileset.tilewidth,
		    th = tileset.tileheight,

		    // Start x, Start x, End x, End y
		    sx = Editor.selection[0][0],
		    sy = Editor.selection[0][1],
		    ex = Editor.selection[1][0],
		    ey = Editor.selection[1][1],

		    // Field size in tiles
		    fx = Editor.$("#canvas").width() / tw,
		    fy = Editor.$("#canvas").height() / th,

		    bgpos = Editor.$("#canvas .selection").css("background-position").split(" "),
		    bgx = parseInt(bgpos[0], 10),
		    bgy = parseInt(bgpos[1], 10),
            
		    query = Editor.$(layer.elem).find("div[data-coords='" + cx + "." + cy + "']"),
		    search_bgpos = query.length ? query.attr("data-coords-tileset") : null,
		    replace_bgpos = Math.abs(bgx / tw) + "." + Math.abs(bgy / th),

		    documentFragment = document.createDocumentFragment(),
            //documentFragment = layer.elem,
		    closedList = [];

        // Temp History Bulk
        var HistElements = [];

        var recursive_deepness = 0;
        var removal = [];
        //// 4x4 FILL ALGORYTHM
		// this is a recursive fill algorythm
		
        fill_recursive = function (o,first) {

            /*var coords = [
                [ox, oy - 1], // top
                [ox, oy + 1], // bottom
                [ox - 1, oy], // left
                [ox + 1, oy]  // right
            ];*/
            function fill(arg) {
               // setTimeout(_fill, 1, arg);
                _fill(arg);
            }
            var ox = o[0], oy = o[1];

            fill([ox, oy - 1]);
            fill([ox,oy+1]);
            fill([ox -1,oy]);
            fill([ox +1,oy]);

            //coords.asyncEach(function (arr,resume) {
            function _fill(arr) {
                recursive_deepness++;
                if (!arr) {
                    return;
                }
                var x = arr[0],
                    y = arr[1],
                    $elem;
                if ((x < 0 || x >= fx || y < 0 || y >= fy)
                    || (closedList.contains(x + "." + y))) {
                    return;
                }

                $query = Editor.$(layer.elem).find("div[data-coords='" + x + "." + y + "']");
                var exists = (!$query.length) ? false : true;
                // History
                var HistElem = exists ? $query.clone().data("layer", layer.elem).get(0) : null;
                var HistType = "change";
                // /History

                // Wenn das aktuelle Element nicht existiert und keine such Tile definiert wurde ("search_bgpos")
                // ODER wenn das aktuelle tile ("$query") equivalent zum such Tile ist und ersetzt werden soll
                if ((!exists && !search_bgpos) || ($query.attr("data-coords-tileset") == search_bgpos)) {
                    // Wenn das aktuelle Element nicht existiert
                    //if (!$elem.length) {
                        // Element anlegen
                        $elem = Editor.$("<div>").css({
                            position: "absolute",
                            left: x * tw,
                            top: y * th
                        })
                            // Daten zuweisen
                        .attr("data-coords", x + "." + y);
                        // und das Element im documentFragment an die tree haengen 
                        documentFragment.appendChild($elem[0]);
                    
                    // Hintergrund des Tiles aktualisieren (mit ersetz Tile)
                    $elem.css("background-position", bgx + "px" + " " + bgy + "px")
                        .attr("data-coords-tileset", replace_bgpos)
                        .attr("class","ts_" + tileset.id)
                        .attr("data-tileset", tileset.name)
                        .attr("data-coords", x + "." + y);
                    if (!exists) {
                        // History
                        HistElem = $elem.clone().data("layer", layer.elem).get(0);
                        HistType = "add";
                        // /History
                    } else {
                        //$query.remove();
                        removal.push($query);
                    }
                    // Merken dass diese Position aktualisiert wurde
                    closedList.push(x + "." + y);
                    // An die naechsten 4 weitergeben
                    setTimeout(fill_recursive,1,[x,y]);

                    // Push to Temp History Bulk
                    HistElements.push(Editor.History.NewNode(HistElem, HistType));
                }
                return;
            };
            
            

        };
        /////////////////////////////
        // Start the recursive search
        fill_recursive([cx, cy],true);
        /////////////////////////////
        
        var recursive_deepness_old = 0;
        var finish = false;
        function checkFinish() {
            if (recursive_deepness == recursive_deepness_old) {
                if (finish) {
                    // Add new created Elements to DOM Tree
                    Editor.$(layer.elem).append(documentFragment);
                    Editor.$.each(removal, function () { $(this).remove();});
                    Canvas.Working = false;
                    /////////////////////////////
                    // Add All changes and addititions to History
                    Editor.History.push(HistElements, "bulk");
                    return;
                } else {
                    finish = true;
                    recursive_deepness_old = recursive_deepness;
                    setTimeout(checkFinish, 100);
                    return;
                }
            }
            recursive_deepness_old = recursive_deepness;
            finish = false;
            setTimeout(checkFinish, 10);
        }
        checkFinish();

    };

    /* ============================ */
    /* ====== MAKE SELECTION ====== */
    /* ============================ */

    Canvas.makeSelection = function (e) {

        var tileset, tw, th, ex, ey, $selection, layer, top, left, $tile;

        Editor.Utils.makeSelection(e, "#canvas");

        if (e.type == "mousedown") {

            Editor.$("#canvas .selection").css("background-color", "rgba(0, 0, 0, 0.3)");

        } else if (e.type == "mouseup") {
            tileset = Editor.activeTileset;
            tw = tileset.tilewidth;
            th = tileset.tileheight;

            sx = Editor.selection[0][0] * tw;
            sy = Editor.selection[0][1] * th;
            ex = Editor.selection[1][0] * tw;
            ey = Editor.selection[1][1] * th;

            $selection = Editor.$("#canvas .selection");
            layer = Editor.Layers.getActive();
            if (!layer.elem) return;

            // Find all elements that are in range of
            // the selection and append a copy of them
            Editor.$(layer.elem).find("div").each(function () {

                top = parseInt(Editor.$(this).css("top"), 10);
                left = parseInt(Editor.$(this).css("left"), 10);

                if (left >= sx && left <= ex && top >= sy && top <= ey) {
                    $tile = Editor.$(this).clone();

                    $tile.css({
                        //position:"relative",
                        top: top - sy,
                        left: left - sx
                    });

                    $selection.append($tile);
                }
            });

            $selection.css("background-color", "transparent");
            $selection.addClass(Editor.$(layer.elem).attr("class").replace("layer", "nobg"));
            Editor.selection.custom = true;

        }
    };

    /* ============================ */
    /* ====== DRAW  BOX      ====== */
    /* ============================ */
    Canvas.drawBoxTile = null;
    Canvas.drawBox = function (e) {

        var tileset, tw, th, ex, ey, $selection, layer, top, left, $tile;
        Editor.Utils.makeSelection(e, "#canvas");

        if (e.type == "mousedown") {
            Editor.$("#canvas .selection").css("background-color", "rgba(0, 5, 255, 0.7)");
        } else if (e.type == "mouseup") {
            tileset = Editor.activeTileset;
            tw = tileset.tilewidth;
            th = tileset.tileheight;

            sx = Editor.selection[0][0];
            sy = Editor.selection[0][1];
            ex = Editor.selection[1][0];
            ey = Editor.selection[1][1];

            $selection = Editor.$("#canvas .selection");
            layer = Editor.Layers.getActive();
            if (!layer.elem) return;

            bgpos = Canvas.drawBoxTile.css("background-position").split(" "),
		    bgx = parseInt(bgpos[0], 10),
		    bgy = parseInt(bgpos[1], 10),
            replace_bgpos = Math.abs(bgx / tw) + "." + Math.abs(bgy / th),

            documentFragment = document.createDocumentFragment();

            // Temp History Bulk
            var HistElements = [];
            
            for (x = sx; x <= ex; x++) {
                for (y = sy; y <= ey; y++) {
                    var $elem = Editor.$(layer.elem).find("div[data-coords='" + x + "." + y + "']");

                    // History
                    var HistElem = $elem.clone().data("layer", layer.elem).get(0);
                    var HistType = "change";
                    // /History

                    if (!$elem.length) {
                        // Element anlegen
                        $elem = Editor.$("<div>").css({
                            position: "absolute",
                            left: x * tw,
                            top: y * th
                        })
                        // Daten zuweisen
                        .attr("data-coords", x + "." + y);

                        // History 
                        HistElem = $elem.clone().data("layer", layer.elem).get(0);
                        HistType = "add";
                        // /History

                        documentFragment.appendChild($elem[0]);
                    }
                    $elem.attr("class", "ts_" + tileset.id)
                        .attr("data-tileset", tileset.name)
                        .css("background-position", bgx + "px" + " " + bgy + "px")
                        .attr("data-coords-tileset", replace_bgpos);

                    if (HistType == "add") {
                        HistElem = $elem.clone().data("layer", layer.elem).get(0);
                    }
                    // Push to Temp History Bulk
                    HistElements.push(Editor.History.NewNode(HistElem, HistType));
                }
            }
            Editor.$(layer.elem).append(documentFragment);
            Editor.$("#canvas .selection").remove();
            //Editor.$("#canvas").append(Canvas.drawBoxTile.clone()); // ??
            
            // History
            Editor.History.push(HistElements, "bulk");

            Canvas.makeSelection(e);
        }
    };

    /* ======================== */
    /* ====== REPOSITION ====== */
    /* ======================== */

    Canvas.reposition = function (e) {
        var wrapper_width = Editor.$(window).innerWidth() - Editor.$("#toolbar").outerWidth();
        var wrapper_height = Editor.$(window).innerHeight() - Editor.$("#topbar").outerHeight() - Editor.$("#topbar_extra").outerHeight();

        // Canvas top position bestimmen (geht nicht so gut über css)
        var top_margin = (wrapper_height - Editor.$("#canvas").height()) / 2;
        Editor.$("#canvas").css({ position: "relative", top: top_margin });


        // Die Arbeitsfläche an fenstergröße anpassen
        Editor.$("#canvas_wrapper_jsp").css({
            position:"absolute",
            top: Editor.$("#topbar").outerHeight() + Editor.$("#topbar_extra").outerHeight(),
            left: 0,
            width: wrapper_width ,
            height: wrapper_height
        });
        Editor.$("#canvas_wrapper").jScrollPane();

    };

    Canvas.cropTile = function (x,y) {
        var buffer = document.createElement("canvas"),
            gl = buffer.getContext("2d"),
            tileset = Editor.activeTileset,
            tw = tileset.tilewidth,
		    th = tileset.tileheight,
            img = tileset.IMG;

        gl.drawImage(img, x * tw, y * th, tw, th, 0, 0, tw, th);
        return buffer.toDataURL();
    }

    /* ========================= */
    /* ====== UPDATE GRID ====== */
    /* ========================= */

    // Creates a base64 image with two borders
    // resulting in a grid when used as a repeated background

    Canvas.updateGrid = function () {

        var buffer = document.createElement("canvas"),
		    bfr = buffer.getContext("2d"),
		    tileset = Editor.activeTileset,
		    tw = tileset.tilewidth,
		    th = tileset.tileheight;

        buffer.width = tw;
        buffer.height = th;

        bfr.fillStyle = "rgba(0, 0, 0, 0.1)";
        bfr.fillRect(0, th - 1, tw, 1);
        bfr.fillRect(tw - 1, 0, 1, th);

        Editor.$("#canvas").css("backgroundImage", "url(" + buffer.toDataURL() + ")");

        Editor.$(".selection").css({
            width: tw,
            height: th
        });
    };

    return Canvas;
});