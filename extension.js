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
const FEDMSG_OBJ_PATH = '/org/fedoraproject/fedmsg/notify';

const FedmsgServerIface =
<interface name="org.fedoraproject.fedmsg.notify">
<method name="Enable"/>
<method name="Disable"/>
</interface>;

const FedmsgServerInfo = Gio.DBusInterfaceInfo.new_for_xml(FedmsgServerIface);

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

    _disabled: function(){
      log('fedmsg-notify-daemon disabled!');
    },
    _enabled: function(){
      log('fedmsg-notify-daemon enabled!');
    },

    _toggle: function(){
        let proxy = new Gio.DBusProxy({
            g_connection: Gio.DBus.session,
            g_interface_name: FedmsgServerInfo.name,
            g_interface_info: FedmsgServerInfo,
            g_name: FEDMSG_NOTIFY_BUS,
            g_object_path: FEDMSG_OBJ_PATH,
            g_flags: (Gio.DBusProxyFlags.NONE)
        });

        if (this._toggle_switch.state) {
            log('Enabling fedmsg-notify-daemon');
            proxy.call('Enable', null, Gio.DBusCallFlags.NONE, -1, null,
              Lang.bind(this, this._enabled), null);
        } else {
            log('Disabling fedmsg-notify-daemon');
            proxy.call('Disable', null, Gio.DBusCallFlags.NONE, -1, null,
              Lang.bind(this, this._disabled), null);
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
