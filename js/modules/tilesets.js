define(["views/tileset_view", "jquery.mousewheel", "jquery.jscrollpane"], function(TilesetView) {

	var Tilesets = {}, Editor;
	Tilesets.collection = {};

	/* ======================== */
	/* ====== INITIALIZE ====== */
	/* ======================== */

	Tilesets.initialize = function() {

		Editor = require("editor");
		this.view = TilesetView.initialize();

		this.add({
			image: "img/tilesets/mage_city.png",
			tilewidth: 32,
			tileheight: 32
		});
		
	};

	/* ================= */
	/* ====== SET ====== */
	/* ================= */

	Tilesets.set = function(name) {

		var tileset = Tilesets.collection[name];
		Editor.activeTileset = tileset;

		Editor.$("#tileset_container").css({
			width: tileset.width,
			height: tileset.height,
		}).attr("class", "ts_" + tileset.id);

		Editor.$("#tilesets select").val(name);
		Editor.$("#tilesets .loading").remove();
		this.resetSelection();
	};

	/* ================= */
	/* ====== ADD ====== */
	/* ================= */

	Tilesets.add = function(data) {

		var img = new Image(),
		    bfr = document.createElement("canvas").getContext("2d"),
		    name = data.name || data.image.match(/(?:.+)\/([^\/]+)/)[1],
		    style = document.createElement("style"),
		    id = name.replace(/[^a-zA-Z]/g, '_'), css;

		img.src = data.image;
		img.addEventListener("load", function() {

			bfr.canvas.width = data.width = this.width;
			bfr.canvas.height = data.height = this.height;

			// Process tileset
			if (data.alpha) { data.base64 = Tilesets.setAlpha(this, data.alpha); }
			if (data.margin) { data.base64 = Tilesets.slice(this, data); }

			if (!data.alpha && !data.margin) {
				bfr.drawImage(this, 0, 0);
				data.base64 = bfr.canvas.toDataURL();
			}

			data.id = id;
			data.name = name;
			data.IMG = img;

			Tilesets.collection[name] = data;
			Tilesets.set(name);

			// Add a global css class so tiles can use
			// it in conjunction with background-position
			Editor.$(style).attr("id", "tileset_" + id);
			Editor.$(style).attr("class", "tileset");

			css = ".ts_" + id + ", .ts_" + id + " > div {\n";
			css += "\twidth: " + data.tilewidth + "px;\n";
			css += "\theight: " + data.tileheight + "px;\n";
			css += "\tbackground-image: url('" + data.base64 + "');\n";
			css += "}";
			Editor.$(style).append(css);

			Editor.$("head").append(style);

			// Update select element
			Editor.$("#tilesets select").append("<option>" + name + "</option>");
			Editor.$("#tilesets select").val(name);

			// Update custom scrollbars and grid
			Editor.$("#tileset").jScrollPane();
			Editor.Canvas.updateGrid();

		}, false);
	};

	/* ======================= */
	/* ====== SET ALPHA ====== */
	/* ======================= */

	// Filters specified color and makes it transparent
	Tilesets.setAlpha = function(img, alpha) {
		var bfr = document.createElement("canvas").getContext("2d"),
		    imgData, red, i, l;

		bfr.canvas.width = img.width;
		bfr.canvas.height = img.height;
		bfr.drawImage(img, 0, 0);

		imgData = bfr.getImageData(0, 0, img.width, img.height);
		tolerance = 10;

		for (i = 0, l = imgData.data.length; i < l; i++) {
			red = i%4 === 0 ? true : false;

			if (red) {
				if (
					imgData.data[i] >= alpha[0]-tolerance && imgData.data[i] <= alpha[0]+tolerance &&
					imgData.data[i+1] >= alpha[1]-tolerance && imgData.data[i+1] <= alpha[1]+tolerance &&
					imgData.data[i+2] >= alpha[2]-tolerance && imgData.data[i+2] <= alpha[2]+tolerance

				) {
					imgData.data[i+3] = 0;
				}
			}
		}

		bfr.clearRect(0, 0, img.width, img.height);
		bfr.putImageData(imgData, 0, 0);
		return bfr.canvas.toDataURL();
	};

	/* =================== */
	/* ====== SLICE ====== */
	/* =================== */

	// Slices the tileset according to tile size and margin
	Tilesets.slice = function(img, data) {

		var bfr = document.createElement("canvas").getContext("2d"),
		    tw = data.tilewidth,
		    th = data.tileheight,
		    imgData, red,
		    x, y, xl, yl,
		    m = data.margin;

		bfr.canvas.width = img.width - (img.width/tw)*data.margin;
		bfr.canvas.height = img.height - (img.height/th)*data.margin;

		for (y = 0, ly = Math.floor(bfr.canvas.height / th); y < ly; y++) {
			for (x = 0, lx = Math.floor(bfr.canvas.width / tw); x < lx; x++) {
				bfr.drawImage(
					img,

					(x * (tw+m)) + m,
					(y * (th+m)) + m,

					tw, th,

					x*tw,
					y*th,
					tw, th
				);
			}
		}

		return bfr.canvas.toDataURL();
	};

	/* ============================= */
	/* ====== RESET SELECTION ====== */
	/* ============================= */

	Tilesets.resetSelection = function() {
		Editor.$(".selection").remove();
		delete Editor.selection;
	};

	/* ======================== */
	/* ====== GET ACTIVE ====== */
	/* ======================== */

	Tilesets.getActive = function() { return Tilesets.collection[	Editor.$("#tilesets select option:selected").val()]; }

	return Tilesets;
});
