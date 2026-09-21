import QtQuick

// The chooser's footer: what is checked on the left, the keys that act on it on the right. Both
// sides arrive already resolved, because ui/picker.qml owns what a chooser has to say and this owns
// how the two lines share one strip when either of them is longer than half of it.
Item {
    id: root

    property string message: ""
    // An error takes the message's own slot rather than a second line, so it carries the ink instead.
    property bool error: false
    property string hint: ""
    // The rule above the strip, the picker's own lift rather than Theme.color.surface; see ui/picker.qml.
    property color edge: "transparent"

    height: Theme.chromeHeight

    // The footer takes the chrome plane, the same strip the ask above it stands on.
    Rectangle {
        anchors.fill: parent
        color: Theme.color.surface
    }

    Rectangle {
        anchors.top: parent.top
        width: parent.width
        height: Theme.spacing.hairline
        color: root.edge
    }

    Text {
        id: messageLine
        anchors.left: parent.left
        anchors.leftMargin: Theme.spacing.rowPaddingX
        anchors.right: hintLine.left
        anchors.rightMargin: Theme.spacing.gap
        anchors.verticalCenter: parent.verticalCenter
        text: root.message
        color: root.error ? Theme.color.error : Theme.color.foreground
        font.family: Theme.font.family
        font.pixelSize: Theme.font.caption
        textFormat: Text.PlainText
        elide: Text.ElideRight
    }

    Text {
        id: hintLine
        anchors.right: parent.right
        anchors.rightMargin: Theme.spacing.rowPaddingX
        width: Math.min(implicitWidth, Math.max(0, parent.width - 2 * Theme.spacing.rowPaddingX
            - Theme.spacing.gap - Math.min(messageLine.implicitWidth, parent.width / 2)))
        anchors.verticalCenter: parent.verticalCenter
        text: root.hint
        color: Theme.color.foreground
        font.family: Theme.font.family
        font.pixelSize: Theme.font.caption
        textFormat: Text.PlainText
        elide: Text.ElideRight
    }
}
