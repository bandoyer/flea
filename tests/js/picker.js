.import "../../ui/js/Picker.js" as Picker
.import "../../ui/js/Sort.js" as Sort

function run(check) {
    // The shape tools/flea-portal writes for an OpenFile with two filters, taken from its request_for().
    var asked = JSON.stringify({
        mode: "open", title: "Send to unraid", app: "", accept: "Send", multiple: true,
        directory: false, folder: "/home/gm/Pictures", file: "", name: "", files: [],
        filters: [{ label: "Images", globs: ["*.png", "*.jpg"], mimes: [] },
                  { label: "Any text", globs: [], mimes: ["text/plain"] }],
        current: "Images"
    })
    var req = Picker.request(asked)
    check("the mode is read", req.mode, "open")
    check("the caller's title is read", req.title, "Send to unraid")
    check("multiple is read", req.multiple, true)
    check("the starting folder is read", req.folder, "/home/gm/Pictures")

    var empty = Picker.request("not json")
    check("a request that is not JSON still opens a window", empty.mode, "open")
    check("a request with nothing in it has no filters", empty.filters.length, 0)
    check("a request with nothing in it is not multiple", empty.multiple, false)
    check("an absent mode is never save", Picker.request('{"mode":"nonsense"}').mode, "open")

    check("the caller's title wins", Picker.title(req), "Send to unraid")
    check("a titleless open says what the window is for", Picker.title(Picker.request("{}")), "Choose file")
    check("a titleless directory request says folder", Picker.title(Picker.request('{"directory":true}')), "Choose folder")
    check("a titleless save says save", Picker.title(Picker.request('{"mode":"save"}')), "Save file")

    // A host application has no portal identity, and nothing else may be shown as one.
    check("no app id draws no requester line", Picker.subtitle(req), "")
    check("an app id is named", Picker.subtitle(Picker.request('{"app":"org.gnome.gedit"}')), "Requested by org.gnome.gedit")

    check("the accept label carries the count", Picker.acceptLabel(req, 3), "Send 3")
    check("one file does not carry a count", Picker.acceptLabel(req, 1), "Send")
    check("no accept label falls back to Open", Picker.acceptLabel(Picker.request("{}"), 0), "Open")
    check("a folder request falls back to Choose folder", Picker.acceptLabel(Picker.request('{"directory":true}'), 0), "Choose folder")

    // Recent is a location and not a directory: no path this window ever holds can equal its token,
    // and a row inside it is identified by its own path under the listing base "/".
    check("Recent is not a path", Picker.RECENT.charAt(0) === "/", false)
    check("the location is recognised", Picker.isRecent(Picker.RECENT), true)
    check("a real directory is not Recent", Picker.isRecent("/home/gm"), false)
    check("a row in a directory joins onto it", Picker.rowPath("/home/gm", "a.png"), "/home/gm/a.png")
    check("a row in Recent is its own path", Picker.rowPath(Picker.RECENT, "home/gm/Pictures/a.png"), "/home/gm/Pictures/a.png")
    check("a row at the root still joins once", Picker.rowPath("/", "etc"), "/etc")
    check("a symlink directory remains navigable without changing link identity", Picker.directory({d:false,p:0o120777,i:"folder"}), true)
    check("a regular file with a folder-like name stays a file", Picker.directory({d:false,p:0o100644,i:"folder"}), false)

    check("nothing checked says so", Picker.statusLine(0, 0), "0 selected")
    check("what is checked and what it weighs", Picker.statusLine(3, 2100000), "3 selected · 2.1 MB")
    check("the open hints name Space and Enter", Picker.hints(req), "Space select · Enter open/send · Esc cancel")
    check("the save hints name neither", Picker.hints(Picker.request('{"mode":"save"}')), "Enter save · Esc cancel")

    var chips = Picker.chips(req)
    check("every filter gets a chip, and All files after them", chips.length, 3)
    check("the first chip is the caller's first filter", chips[0].label, "Images")
    check("All files is last and is not a filter", chips[2].label + " " + chips[2].index, "All files -1")
    check("no filters means no chip row at all", Picker.chips(Picker.request("{}")).length, 0)
    check("current_filter chooses the active chip", Picker.currentChip(req), 0)
    check("an unknown current_filter falls back to the first", Picker.currentChip(Picker.request('{"filters":[{"label":"A"}],"current":"Z"}')), 0)
    check("no filters has no active chip", Picker.currentChip(Picker.request("{}")), -1)
    check("duplicate filter labels keep the caller's rule identity", Picker.currentChip(Picker.request('{"filters":[{"label":"A"},{"label":"A"}],"current":"A","currentIndex":1}')), 1)

    var marks = Picker.reviewedMarks([], [{path: "/x/a #.png", bytes: 10}, {path: "/x/b.png", bytes: 20}])
    check("reviewed marks retain order", Picker.paths(marks).join(","), "/x/a #.png,/x/b.png")
    check("reviewed byte totals are live", Picker.totalBytes(marks), 30)
    check("a mark is found by its path", Picker.marked(marks, "/x/b.png"), true)
    check("a reviewed path gets one URI encoding", marks[0].uri, "file:///x/a%20%23.png")
    marks = Picker.reviewedMarks(marks, [{path: "/x/a #.png", bytes: 15}])
    check("removed identities leave the result", marks.length, 1)
    check("review updates the bytes", marks[0].bytes, 15)
    check("review preserves the original URI", marks[0].uri, "file:///x/a%20%23.png")
    check("reply carries retained URI and selected filter", Picker.reply(0, marks, 1),
          '{"response":0,"uris":["file:///x/a%20%23.png"],"filter":1}')

    // The save name is a client string, and the answer it builds must stay inside the folder the
    // user was shown. Same cases as src/backend/ops.rs's own valid_name test, so a drift shows here.
    check("an ordinary name is a name", Picker.validName("ordinary.txt"), true)
    check("a dotfile is a name", Picker.validName(".bashrc"), true)
    check("spaces are a name", Picker.validName("a name with spaces"), true)
    check("an empty name would answer with the directory", Picker.validName(""), false)
    check("a single dot is the directory itself", Picker.validName("."), false)
    check("two dots climb out of the directory", Picker.validName(".."), false)
    check("a separator moves the answer out of the folder", Picker.validName("../escape"), false)
    check("a leading separator is an absolute path", Picker.validName("/etc/passwd"), false)
    check("a subdirectory is still a separator", Picker.validName("sub/child"), false)
    check("the reviewer's own exploit is refused", Picker.validName("../../.config/autostart/pwn.desktop"), false)
    check("an interior NUL truncates the path at the syscall", Picker.validName("nul\0byte"), false)
    // tools/flea-portal reads current_name verbatim, so a traversal reaches Picker.request() intact
    // and the window has to be the thing that refuses it.
    check("a traversal survives the request unchanged", Picker.request('{"name":"../../pwn"}').name, "../../pwn")
    check("and the request's own name is then refused", Picker.validName(Picker.request('{"name":"../../pwn"}').name), false)

    check("a path joins under its directory", Picker.join("/home/gm", "a.txt"), "/home/gm/a.txt")
    check("the root does not double its slash", Picker.join("/", "etc"), "/etc")
    check("the parent of a path is its directory", Picker.parentOf("/home/gm/a.txt"), "/home/gm")
    check("the root is its own parent, so Parent stops there", Picker.parentOf("/"), "/")

    check("a picked path leaves as a file URI", Picker.uris(["/home/gm/a.txt"])[0], "file:///home/gm/a.txt")
    check("a space is encoded, because GLib refuses a bad one", Picker.uris(["/home/gm/my file.txt"])[0], "file:///home/gm/my%20file.txt")
    check("a hash is encoded rather than read as a fragment", Picker.uris(["/home/gm/a#b.txt"])[0], "file:///home/gm/a%23b.txt")

    // The chooser offers Name, Size and Modified and no others: ui/js/Picker.js hides the Mode and
    // Kind columns, and an order with no column to mark it is an order the window cannot report.
    // ui/js/Sort.js decides; the routes in ui/PickerList.qml and ui/picker.qml carry it out.
    var offered = Picker.SORT_ORDERS
    check("the chooser offers exactly the three columns it draws", offered.join(","), "name,size,mtime")

    check("a click on another column starts it ascending",
          JSON.stringify(Sort.clicked(offered, "name", false, "size")), '{"key":"size","desc":false}')
    check("a click on another column starts ascending whatever direction the last one was in",
          JSON.stringify(Sort.clicked(offered, "name", true, "size")), '{"key":"size","desc":false}')
    check("a click on the sorted column reverses it",
          JSON.stringify(Sort.clicked(offered, "size", false, "size")), '{"key":"size","desc":true}')
    check("and a second click returns it to ascending",
          JSON.stringify(Sort.clicked(offered, "size", true, "size")), '{"key":"size","desc":false}')
    // Mode and Kind head no column here, so a click aimed at one decides nothing at all.
    check("a column the chooser does not offer decides nothing", Sort.clicked(offered, "name", false, "kind"), null)
    check("and neither does a key the backend would refuse", Sort.clicked(offered, "name", false, "mode"), null)

    check("s steps from name to size", JSON.stringify(Sort.stepped(offered, "name")), '{"key":"size","desc":false}')
    check("s steps from size to mtime", JSON.stringify(Sort.stepped(offered, "size")), '{"key":"mtime","desc":false}')
    check("s wraps from mtime back to name", JSON.stringify(Sort.stepped(offered, "mtime")), '{"key":"name","desc":false}')
    // The window can leave kind in ui.json, and the chooser reads that preference on its first
    // listing. s must step off it rather than wedge on an order it has no column to draw.
    check("s from an inherited kind lands on name", JSON.stringify(Sort.stepped(offered, "kind")), '{"key":"name","desc":false}')
    check("s always starts a new column ascending", Sort.stepped(offered, "mtime").desc, false)

    check("S reverses the order the listing is in", JSON.stringify(Sort.flipped("size", false)), '{"key":"size","desc":true}')
    check("S turns a reversed order back", JSON.stringify(Sort.flipped("size", true)), '{"key":"size","desc":false}')
    // S asks for the reverse of what is shown, and an inherited kind is shown even without an arrow.
    check("S reverses an inherited kind rather than refusing it",
          JSON.stringify(Sort.flipped("kind", false)), '{"key":"kind","desc":true}')

    // ...but only for an order the backend will really produce. ui.json is merged into the window's
    // state without this build validating the key, so a hand-edited or foreign state file can leave
    // a key here that no sort answers. ui/PickerList.qml refuses to spend the listing on one.
    check("kind is an order the backend produces, so S may reverse it", Sort.supported("kind"), true)
    check("and so are the three the chooser heads",
          [Sort.supported("name"), Sort.supported("size"), Sort.supported("mtime")].join(","), "true,true,true")
    check("a key no sort answers is refused before the listing is spent", Sort.supported("nonsense"), false)
    // date is ui.json's spelling; Backend.resetSort normalizes it to mtime before it ever gets here.
    check("and so is ui.json's own date, which is normalized long before this", Sort.supported("date"), false)

    check("a pick answers with its URIs", Picker.reply(0, ["/home/gm/a.txt"]),
          '{"response":0,"uris":["file:///home/gm/a.txt"]}')
    check("a refusal answers with no URI at all", Picker.reply(1, ["/home/gm/a.txt"]), '{"response":1}')
}
