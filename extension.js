/*
** This program is free software: you can redistribute it and/or modify
** it under the terms of the GNU General Public License as published by
** the Free Software Foundation, either version 3 of the License, or
** (at your option) any later version.
**
** This program is distributed in the hope that it will be useful,
** but WITHOUT ANY WARRANTY; without even the implied warranty of
** MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
** GNU General Public License for more details.
**
** You should have received a copy of the GNU General Public License
** along with this program.  If not, see <http://www.gnu.org/licenses/>.
**
** Copyright (C) 2012 Red Hat, Inc.
**
** Author: Luke Macken <lmacken@redhat.com>
*/
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

        this._settings = new Gio.Settings({ schema: FEDMSG_NOTIFY_BUS });
        this._connect_signal_handlers();
        this._toggle_switch.setToggleState(this._settings.get_boolean('enabled'));
        this._toggle();
    },

    _connect_signal_handlers: function() {
        this._switch_conn = this._toggle_switch.connect('toggled', Lang.bind(this, this._toggle));
        this._settings_conn = this._settings.connect('changed::enabled',
                Lang.bind(this, this._settings_changed));
    },

    _disconnect_signal_handlers: function() {
        this._toggle_switch.disconnect(this._switch_conn);
        this._settings.disconnect(this._settings_conn);
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

        this._disconnect_signal_handlers();
        if (this._toggle_switch.state) {
            log('Enabling fedmsg-notify-daemon');
            proxy.call('Enable', null, Gio.DBusCallFlags.NONE, -1, null,
              Lang.bind(this, this._enabled), null);
        } else {
            log('Disabling fedmsg-notify-daemon');
            proxy.call('Disable', null, Gio.DBusCallFlags.NONE, -1, null,
              Lang.bind(this, this._disabled), null);
        }
        this._connect_signal_handlers();
    },

    _disabled: function(){
        log('fedmsg-notify-daemon disabled!');
        this._disconnect_signal_handlers();
        this._settings.set_boolean('enabled', false);
        this._connect_signal_handlers();
    },

    _enabled: function(){
        log('fedmsg-notify-daemon enabled!');
        this._disconnect_signal_handlers();
        this._settings.set_boolean('enabled', true);
        this._connect_signal_handlers();
    },

    _settings_changed: function() {
        log('settings_changed!');
        this._toggle_switch.setToggleState(this._settings.get_boolean('enabled'));
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
