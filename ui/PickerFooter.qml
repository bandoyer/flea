import QtQuick
import "js/Picker.js" as Picker

// The footer: what is checked on the left, the keys that act on it on the right.
Item {
    id: root
    required property var picker
    // What the right side says, whole; the drawn text elides and this does not.
    readonly property string hints: root.picker.backendUnavailable ? "Esc cancel" : Picker.hints(root.picker.req)
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
        color: root.picker.edge
    }

    Text {
        id: statusMessage
        anchors.left: parent.left
        anchors.leftMargin: Theme.spacing.rowPaddingX
        anchors.right: statusHints.left
        anchors.rightMargin: Theme.spacing.gap
        anchors.verticalCenter: parent.verticalCenter
        text: root.picker.message.length > 0 ? root.picker.message
            : Picker.statusLine(root.picker.marks.length, Picker.totalBytes(root.picker.marks))
        color: root.picker.messageError ? Theme.color.error : Theme.color.foreground
        font.family: Theme.font.family
        font.pixelSize: Theme.font.caption
        textFormat: Text.PlainText
        elide: Text.ElideRight
    }

    Text {
        id: statusHints
        anchors.right: parent.right
        anchors.rightMargin: Theme.spacing.rowPaddingX
        width: Math.min(implicitWidth, Math.max(0, parent.width - 2 * Theme.spacing.rowPaddingX
            - Theme.spacing.gap - Math.min(statusMessage.implicitWidth, parent.width / 2)))
        anchors.verticalCenter: parent.verticalCenter
        text: root.hints
        color: Theme.color.foreground
        font.family: Theme.font.family
        font.pixelSize: Theme.font.caption
        textFormat: Text.PlainText
        elide: Text.ElideRight
    }
}
