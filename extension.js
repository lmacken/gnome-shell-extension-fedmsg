const St = imports.gi.St;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;
const Mainloop = imports.mainloop;
const Gio = imports.gi.Gio;
const DBus = imports.dbus;

const FEDMSG_NOTIFY_BUS = 'org.fedoraproject.fedmsg.notify';

const FedmsgNotificationObjectInterface = {
    name: 'org.fedoraproject.fedmsg.notify',
    methods: [
        {name: 'Status', inSignature: 's', outSignature: 's'},
        {name: 'Enable', inSignature: '', outSignature: ''},
        {name: 'Disable', inSignature: '', outSignature: ''},
    ],
    signals: [
        /*{name: 'StatusChanged', inSignature: 's'}*/
    ]
};

function Fedmsg() {
    this._init.apply(this, arguments);
}

Fedmsg.prototype = {
    __proto__: PanelMenu.SystemStatusButton.prototype,

    _init: function(){
        PanelMenu.SystemStatusButton.prototype._init.call(this, 'fedmsg');

        let icon = new St.Icon({
            icon_size: Main.panel.actor.height - 3,
            icon_name: 'fedora-logo-icon'
        });

        this.actor.get_children().forEach(function(c) {
            c.destroy()
        });
        this.actor.add_actor(icon);

        this.menu.box.get_children().forEach(function(c) {
            c.destroy()
        });

        let section = new PopupMenu.PopupMenuSection('Fedmsg');
        this._toggle_switch = new PopupMenu.PopupSwitchMenuItem('Fedmsg Notifications', false);
        this._toggle_switch.connect('toggled', Lang.bind(this, this._toggle));
        section.addMenuItem(this._toggle_switch);
        this.menu.addMenuItem(section);
    },

    _toggle: function(){
        let NotificationProxy = DBus.makeProxyClass(FedmsgNotificationObjectInterface);
        let notify = new NotificationProxy(DBus.session, FEDMSG_NOTIFY_BUS,
                                          '/org/fedoraproject/fedmsg/notify');

        if (this._toggle_switch.state) {
            notify.DisableRemote();
        } else {
            notify.EnableRemote();
        }
    },
}

function init() {}

let indicator;
let event=null;

function enable() {
    indicator = new Fedmsg();
    Main.panel.addToStatusArea('fedmsg', indicator);
}

function disable() {
    indicator.destroy();
    Mainloop.source_remove(event);
    indicator = null;
}
