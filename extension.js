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

        this.actor.get_children().forEach(function(c) { c.destroy() });
        this.menu.box.get_children().forEach(function(c) { c.destroy() });

        let icon = new St.Icon({
            icon_size: Main.panel.actor.height - 3,
            icon_name: 'fedora-logo-icon'
        });
        this.actor.add_actor(icon);

        let section = new PopupMenu.PopupMenuSection('Fedmsg');
        this._toggle_switch =
            new PopupMenu.PopupSwitchMenuItem('Fedmsg Notifications', false);
        section.addMenuItem(this._toggle_switch);
        section.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        section.addSettingsAction('Fedmsg Settings',
            'fedmsg-notify-config.desktop');
        this.menu.addMenuItem(section);

        this.settings = new Gio.Settings({ schema: FEDMSG_NOTIFY_BUS });
        this._toggle_switch.setToggleState(this.settings.get_boolean('enabled'));
        this._toggle();
        this._toggle_switch.connect('toggled', Lang.bind(this, this._toggle));
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

    _disabled: function(){
        log('fedmsg-notify-daemon disabled!');
        this.settings.set_boolean('enabled', false);
    },

    _enabled: function(){
        log('fedmsg-notify-daemon enabled!');
        this.settings.set_boolean('enabled', true);
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

// vim: ts=4 sw=4 ai expandtab
