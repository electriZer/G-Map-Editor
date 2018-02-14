define(function () {

    var Export = {}, Editor;

    /* ======================== */
    /* ====== INITIALIZE ====== */
    /* ======================== */

    Export.initialize = function () {

        Editor = require("editor");
    };

    /* ==================== */
    /* ====== EVENTS ====== */
    /* ==================== */

    Export.events = {
        "click #export_submit": function (e) { Export.process(e); }
    };

    /* ===================== */
    /* ====== PROCESS ====== */
    /* ===================== */

    // TODO comment this

    Export.process = function () {

        //type = Editor.$("select[name=export_format]").val(),
        var include_base64 = Editor.$("select[name=include_base64]").val() == "yes",
           format_output = Editor.$("select[name=format_output]").val() == "yes",
           tileset = Editor.activeTileset,
           anchor = document.createElement("a"),

           w = Editor.$("#canvas").width() / tileset.tilewidth,
           h = Editor.$("#canvas").height() / tileset.tileheight,

           output, layer, coords, y, x, query, elem, data, tile;

        anchor.setAttribute("download", "map.json");
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        output = {
            type: "map2d"
        };

        output.tilesets = [];
        for (tileset in Editor.Tilesets.collection) {
            tileset = Editor.Tilesets.collection[tileset];

            output.tilesets.push({
                name: tileset.name,
                image: include_base64 ? tileset.base64 : tileset.name,
                imagewidth: tileset.width,
                imageheight: tileset.height,
                tilewidth: tileset.tilewidth,
                tileheight: tileset.tileheight
            });
        }
        function GetTileSetId(name) {
            for (var i = 0; i < output.tilesets.length; i++) {
                if (output.tilesets[i].name === name) return i;
            }
            return null;
        }

        output.layers = [];
        Editor.$(".layer").each(function () {

            layer = {
                id: Editor.$(this).attr("id"),
                name: Editor.$(this).attr("data-name"),
                width: w,
                height: h,
                data: []
            };
            for (y = 0; y < h; y++) {
                for (x = 0; x < w; x++) {
                    query = Editor.$(this).find("*[data-coords='" + x + "." + y + "']");
                    if (!query.length) continue;
                    coords = query.length ? parseFloat(query.attr("data-coords-tileset"), 10) : -1;
                    tileset = coords != -1 ? GetTileSetId(query.attr("data-tileset")) : null;
                    tile = [coords, x, y, tileset];
                     layer.data.push(tile);
                }
            }

            output.layers.push(layer);
        });



        output.canvas = {
            width: window.parseInt(Editor.$("#canvas").css("width"), 10),
            height: window.parseInt(Editor.$("#canvas").css("height"), 10)
        };

        output.events = [];
        Editor.Events.each(function (entry) {
            output.events.push(entry);
        });
        output.events = JSON.stringify(output.events, function (k, v) { if (k === "Next") return undefined; return v; });

        output = JSON.stringify(output);
        anchor.href = "data:application/json;charset=UTF-8;," + encodeURIComponent(output);
        //console.log(anchor.href);
        anchor.click();
        document.body.removeChild(anchor);
    };

    return Export;
});