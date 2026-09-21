.pragma library

.import "DirSizes.js" as DirSizes
.import "Thumbs.js" as Thumbs

// What the header's click and the s and S keys do, taking ui/Pane.qml's root the way Nav.js and
// Ops.js do: the pane holds the state, this holds what the state does. ui/Backend.qml records the
// order the listing is actually in, because list re-sorts by name ascending and only this file
// changes it after that.

// The orders the backend can actually produce, in the order s steps through them, and the only keys
// that may move the recorded order. It is not the list of what gets refused: docs/protocol.md "sort"
// refuses every other key by name, and the backend is the one that says so, see ui/js/Errors.js.
var ORDERS = ["name", "size", "mtime", "kind"]

// What a click, s and S decide, read from the order the listing is in and the orders the surface in
// front of the user actually offers. The decision is returned rather than carried out, because the
// two surfaces offer different columns and keep different things when one lands: a pane drops every
// cache keyed by a row index, and the chooser, whose marks are paths, drops none of them. Each
// answers {key, desc}, or null where there is nothing to ask the backend for.

// ui/Header.qml's click. The column already sorted reverses; any other column starts ascending,
// which is the order the canvas's own header draws beside "Name".
function clicked(orders, by, desc, key) {
    // A column this surface does not offer stays a label rather than sending a sort to be refused.
    if (orders.indexOf(key) < 0)
        return null
    return {key: key, desc: by === key ? !desc : false}
}

// s: the next order in the list, always ascending, because the column and the direction are
// separate choices. An order the list does not hold wraps to the first, so an order recorded by
// something this surface cannot draw, such as a chooser opened on the window's saved kind, can
// never wedge the key.
function stepped(orders, by) {
    return {key: orders[(orders.indexOf(by) + 1) % orders.length], desc: false}
}

// Whether the backend will really produce an order, which is what may move a recorded one. The
// window sends a refused key anyway and lets the error line answer for it; a chooser cannot, since
// tearing its listing down for a refusal it can do nothing with would leave the dialog blank.
function supported(key) {
    return ORDERS.indexOf(key) >= 0
}

// S: reverse whichever order the listing is in, the capital-is-the-variant pair g/G and j/J use.
// The order on screen is turned around whether or not this surface heads it with a column, because
// the backend produces it either way and the reversal is of what the user can see.
function flipped(by, desc) {
    return {key: by, desc: !desc}
}

// ui/Pane.qml's three, over every order the backend can produce. Only ORDERS may leave this file.
function column(pane, key) {
    apply(pane, clicked(ORDERS, pane.backend.sortBy, pane.backend.sortDesc, key))
}

function next(pane) {
    apply(pane, stepped(ORDERS, pane.backend.sortBy))
}

function reverse(pane) {
    apply(pane, flipped(pane.backend.sortBy, pane.backend.sortDesc))
}

function apply(pane, decision) {
    if (decision)
        resort(pane, decision.key, decision.desc)
}

// The request goes out for every key, so the refusal is the backend's alone. Only an order it will
// really produce moves the recorded one, or the mark would describe a listing that never changed.
function resort(pane, key, desc) {
    // Asking for the order the listing is already in would drop every row-indexed cache and put the
    // cursor back to redraw the rows already on screen, so it is not asked for at all.
    if (pane.backend.sortBy === key && pane.backend.sortDesc === desc) {
        return
    }
    pane.backend.sort(key, desc)
    if (ORDERS.indexOf(key) < 0) {
        return
    }
    pane.backend.sortBy = key
    pane.backend.sortDesc = desc
    // A reorder moves every row, so the caches keyed by a row index are as stale as a new listing's,
    // and a selection of row indices would silently come to name different files.
    pane.thumbState = Thumbs.empty()
    pane.dirSizeState = DirSizes.empty()
    pane.clearSelection()
    pane.setCursor(0)
    // sort emits no rows of its own, so the reordered window is asked for here; see docs/protocol.md.
    pane.backend.window(0, pane.windowSize)
}
