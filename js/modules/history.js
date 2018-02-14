define(function () {
    var History = {}, Editor;
    History.NewNode = function (Elem, Type) {
        return new HistoryNode(Elem, Type);
    }
    function LinkedList() {
        First = null;
        Last = null;
        this.Count = 0;
        //MAX_SIZE = 1000;
        this.push = function (node) {
            if (this.First == null) {
                this.First = node;
                this.Last = node;
            } else {
                this.Last.Next = node;
                this.Last = node;
            }
            this.Count++;
           // if (this.Count >= this.MAX_SIZE) {
            //    this.RemoveFirst();  // Remove a Element at the bottom of the stack, to avoid a oversizing 
           // }
            return node;
        }
        this.pop = function () {
            if (this.First == null) {
                return null;
            }
            var _last = this.Last
            if (this.First == this.Last) {
                this.First = null;
                this.Last = null;
            } else {
                this.Last = this.FindNextLast();
            }
            this.Count--;
            return _last;
        }
        this.RemoveFirst = function () {
            if (this.First == null) {
                return;
            }
            if (this.First == this.Last) {
                this.First = null;
                this.Last = null;
            }
            else {
                this.First = this.First.Next;
            }
            this.Count--;
        }
        this.FindNextLast = function () {
            var current = this.First;
            while (current != null) {
                if (current.Next == this.Last) {
                    return current;
                }
                current = current.Next;
            }
            return null;
        }
        this.Clear = function () {
            this.First = null;
            this.Last = null;
            this.Count = 0;
        }
    }
    function HistoryNode(Elem, Type) {
        this.Elem = Elem;
        this.Type = Type;
        this.Next = null;
        this.coords = function () {
            return Editor.$(this.Elem).attr("data-coords");
        }
    }
    History.ReDo = null;
    History.UnDo = null;
    /* ======================== */
    /* ====== INITIALIZE ====== */
    /* ======================== */
    History.initialize = function () {
        Editor = require("editor");

        History.ReDo = new LinkedList();
        History.UnDo = new LinkedList();
    };
    /* ==================== */
    /* ====== EVENTS ====== */
    /* ==================== */
    History.Wait = false;
    History.events = {
        "click #UnDo": function (e) {
            if (e.handled === true) return;
            if (History.UnDo.Count == 0) { return };
            var Entry = History.UnDo.pop();
            Entry = ProcessUnDoEntry(Entry);
            if (Entry != null) History.ReDo.push(Entry);

            e.handled = true;
        },

        "click #ReDo": function (e) {
            if (e.handled === true) return;
            if (History.ReDo.Count == 0) return;
            var Entry = History.ReDo.pop();
            Entry = ProcessReDoEntry(Entry);
            if (Entry != null) History.UnDo.push(Entry);
            e.handled = true;
        }
    };
    function ProcessUnDoEntry(Entry) {
        if (!Entry || typeof Entry == 'undefined' || Entry.Elem == null) return;

        switch (Entry.Type) {
             /**
             * "add" : This Element has been added to the DOM Tree.
             * Remove it to come back to old state.
             **/
            case "add":
                var $layer = Editor.$(Editor.$(Entry.Elem).data("layer"));
                $layer.find("div[data-coords='" + Entry.coords() + "']").remove();
                break;
            case "remove":
                var $layer = Editor.$(Editor.$(Entry.Elem).data("layer"));
                $layer.append(Editor.$(Entry.Elem).clone());
                break;
            /**
             * "change" : This Element has been added to the  DOM Tree.
             * Replace current element with old one to come back to old state.
             **/
            case "change":
                var $layer = Editor.$($(Entry.Elem).data("layer"));
                var $div = $layer.find("div[data-coords='" + Entry.coords() + "']");
                if (!$div.length) { return null;}
                var backup = $div.clone();
                $div.remove();
                $layer.append(Entry.Elem);
                Entry.Elem = backup;
                $(Entry.Elem).data("layer", $layer.get(0));
                break;
            /**
             * "bulk" : 
             * 
            **/
            case "bulk":
                $.each(Entry.Elem, function (i, ChildEntry) { ProcessUnDoEntry(ChildEntry) });
                break;
            default:
                console.log("?" + Entry.Type);
                break;
        }
        return Entry;
    }
    function ProcessReDoEntry(Entry) {
        if (!Entry || typeof Entry == 'undefined' || Entry.Elem == null) return;

        switch (Entry.Type) {
            /**
            * "add" : This Element has been added to the DOM Tree.
            * Remove it to come back to old state.
            **/
            case "add":
                var $layer = Editor.$( Editor.$(Entry.Elem).data("layer"));
                $layer.append(Editor.$(Entry.Elem).clone());
                break;
            case "remove":
                var $layer = Editor.$(Editor.$(Entry.Elem).data("layer"));
                $layer.find("div[data-coords='" + Entry.coords() + "']").remove();
                break;
                /**
                 * "change" : This Element has been added to the  DOM Tree.
                 * Replace current element with old one to come back to old state.
                 **/
            case "change":
                var $layer = Editor.$($(Entry.Elem).data("layer"));
                var $div = $layer.find("div[data-coords='" + Entry.coords() + "']");
                if (!$div.length) { return null;}
                var backup = $div.clone();
                $div.remove();
                $layer.append(Entry.Elem);
                Entry.Elem = backup;

                $(Entry.Elem).data("layer", $layer.get(0));
                break;
                /**
                 * "bulk" : 
                 * 
                **/
            case "bulk":
                $.each(Entry.Elem, function (i, ChildEntry) { ProcessReDoEntry(ChildEntry) });
                break;
            default:
                console.log("?" + Entry.Type);
                break;
        }
        return Entry;
    }
    History.push = function (Elem, Type) {
        History.ReDo.Clear();
        History.UnDo.push(new HistoryNode(Elem, Type));
    }

    return History;
});