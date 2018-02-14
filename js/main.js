require.config({

    shim: {
        "editor":{
            exports: "Editor",
            deps: [
                "jquery.draggable",
                "jquery.context-menu"
            ]
        },
        "jquery":{
            exports:"$"
        },
        "jquery-ui": {
            exports: "$",
            deps: [
				"jquery",
				"jquery.mousewheel",
				"jquery.jscrollpane"
            ]
        },

        "jquery.mousewheel": { deps: ["jquery"] },
        "jquery.jscrollpane": { deps: ["jquery"] },
        "jquery.draggable": { deps: ["jquery","jquery-ui"] },
        "jquery.context-menu": { deps: ["jquery"] },

        "underscore": {
            exports: "_"
        }
    },

    paths: {
        "jquery": "libs/jquery",
        "jquery-ui": "libs/jquery-ui.min",
        "jquery.mousewheel": "plugins/jquery.mousewheel",
        "jquery.jscrollpane": "plugins/jquery.jscrollpane",
        "jquery.draggable": "plugins/jquery.draggable",
        "jquery.context-menu": "plugins/jquery.context-menu",
        "editor": "modules/editor",
        "underscore": "libs/underscore",
        "text": "plugins/text",
        "dialog": "../dialog"
    }
});
var GL = {};
require(["jquery","editor"], function ($,Editor) {
    GL.Editor = Editor;
    Editor.$ = $;
    $(document).ready(Editor.initialize);
});