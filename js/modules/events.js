define(function () {

    var Events = {}, Editor;

    Events.PREFIX = "OBJ_";
    Events.Count = 0;
    Events.First = null;
    Events.Last = null;

    function EventNode(Key, Name, NextNode) {
        this.Key = Key;
        this.Name = Name;
        this.Next = (NextNode != undefined) ? NextNode : null;

        this.ReplaceInCode = function(OldName,NewName){
            Editor.$.each(this.Code, function (i, entry) {
                entry.replace(OldName, NewName);
            });
        }
    }

    /* ======================== */
    /* ====== INITIALIZE ====== */
    /* ======================== */
    Events.initialize = function () {
        Editor = require("editor");
    };

    Events.NextSimpleName = function () {
        return this.PREFIX + this.Count;
    }

    Events.getByKey = function(Key){
        if (this.First == null) { return null; }
        var current = this.First
        while(current != null){
            if (current.Key == Key) { return current; }
            else { current = current.Next; }
        }
        return null;
    }
    /* Events.each
    Description:
    Iterates through all Elements and calls callback function.

    Usage : 
    GL.Editor.Events.each( function( EventNode ) {
        // your code here 
    } );
    
    */
    Events.each = function (func1) {
        if (this.First == null) { return null; }
        var current = this.First
        while (current != null||current!=undefined) {
            func1(current)
            current = current.Next;
        }
    }
    Events.ContainsKey = function (Key) {
        if (this.getByKey(Key) != null) { return true; }
        return false;
    }

    Events.rename = function (OldName, NewName) {
        if (this.First == null) { return null; }
        var current = this.First
        while (current != null) {
            if (current.Key == OldName) {
                current.Key = NewName;
                break;
            }
            else {
                current = current.Next;
            }
        }
        return current;
    }

    Events.add = function (Key, Name) {
        var node = new EventNode(Key, Name);
        if (this.First == null) {
            this.First = node;
            this.Last = node;
        } else {
            this.Last.Next = node;
            this.Last = node;
        }
        Events.Count++;

        return node;
    }

    Events.addNode = function (node){
        if (this.First == null) {
            this.First = node;
            this.Last = node;
        } else {
            this.Last.Next = node;
            this.Last = node;
        }
        node.Next = null;
        Events.Count++;
    }

    Events.remove = function(Name){
        if (this.First == null) return null;
        var current = this.First
        var last = null;
        while (current != null) {
            if (current.Key == Key) {
                if (last == null) {
                    this.First = null;
                } else {
                    last.Next = current.Next;
                }
            }
            else {
                last = current;
                current = current.Next;
            }
        }
    }

    Events.clear = function () {
        this.First = null;
        this.Last = null;
        this.Count = 0;
    }


   

    return Events;
});