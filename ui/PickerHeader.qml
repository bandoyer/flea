import QtQuick
import "." as Flea
import "js/Picker.js" as Picker

// The chooser's column header: the window's own ui/Header.qml over the narrower set of columns a
// chooser draws, and the policy that comes with it. It heads the listing alone, so the caller
// anchors it where the rail ends, and it stands outside ui/PickerList.qml because that view counts
// rows off its own contentY and a header inside it would be row zero.
Item {
    id: root

    property var picker: null
    property var backend: null
    property var list: null

    implicitHeight: header.implicitHeight
    // Sorting is the one thing this strip does, so it goes down whole where there is nothing to
    // sort: a history in its own order, a submission under way, no backend to ask, or a listing
    // still in flight. That last one is picker.requestSort's own guard, and the strip has to report
    // it or a click during a size pass would be dropped by a control still drawn as live.
    enabled: !root.picker.recent && !root.picker.submitting && !root.picker.backendUnavailable
        && root.picker.listingState !== "loading"

    Flea.Header {
        id: header
        anchors.fill: parent
        hiddenCols: Picker.HIDDEN_COLS
        // The same two adjustments ui/PickerList.qml hands every row, or the titles stand off the
        // cells they head: the check box ahead of the name, and SendPicker.html's 80px date.
        leadingSlot: root.list.checkSize + Theme.spacing.gap
        compactDate: true
        // Recent is in the desktop's own history order, which no column mark can describe.
        sortBy: root.picker.recent ? "" : root.backend.sortBy
        sortDesc: root.backend.sortDesc
        // The click takes the keyboard with it, so the keys that move the cursor keep working.
        onSortRequested: function (key) { root.list.forceActiveFocus(); root.list.sortColumn(key) }
    }

    // What the header is actually marking, which is not always the order the backend recorded:
    // Recent is a listpaths listing that leaves that value standing, and draws no mark over it.
    function mark() { return header.sortBy }

    // The sortable titles as controls, for a harness that has to click a real header centre. Mode
    // and Kind head no sort here, and a title the width has dropped reports itself invisible rather
    // than going missing, so a case can assert a narrow layout offers no pointer route at all.
    function controls(host) {
        return [["name", "Sort by Name"], ["size", "Sort by Size"], ["date", "Sort by Modified"]]
            .map(function (named) { return host.control(named[1], header.cell(named[0]), root.enabled) })
    }
}
