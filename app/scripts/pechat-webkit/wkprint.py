"""Печать страницы движком WebKit (WebKitGTK) в PDF — как «Печать» в Safari.
python3 wkprint.py URL OUT.pdf PAPER(a4|letter) MARGIN_MM [WAIT_S] [CSS]

MARGIN_MM — поля со всех сторон («6.35») или «бок,верх,низ» («3,5,17»).
Запуск под xvfb-run; вызывает scripts/check-pechat-webkit.mjs."""
import sys, gi
gi.require_version('Gtk', '3.0'); gi.require_version('WebKit2', '4.1')
from gi.repository import Gtk, WebKit2, GLib
url, out, paper, _m = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
wait = float(sys.argv[5]) if len(sys.argv) > 5 else 6
win = Gtk.OffscreenWindow(); view = WebKit2.WebView(); win.add(view); win.set_default_size(1200, 900); win.show_all()
view.get_settings().set_enable_javascript(True)
# window.print() самой страницы не открывает диалог.
mgr = view.get_user_content_manager()
extra = sys.argv[6] if len(sys.argv) > 6 else ''
if extra:
    mgr.add_style_sheet(WebKit2.UserStyleSheet.new(extra, WebKit2.UserContentInjectedFrames.TOP_FRAME, WebKit2.UserStyleLevel.AUTHOR, None, None))
mgr.add_script(WebKit2.UserScript.new('window.print=function(){window.__printed=1}', WebKit2.UserContentInjectedFrames.TOP_FRAME, WebKit2.UserScriptInjectionTime.START, None, None))
def do_print():
    ps = Gtk.PrintSettings()
    ps.set(Gtk.PRINT_SETTINGS_OUTPUT_URI, 'file://' + out)
    ps.set(Gtk.PRINT_SETTINGS_OUTPUT_FILE_FORMAT, 'pdf')
    ps.set_printer('Print to File')
    setup = Gtk.PageSetup()
    setup.set_paper_size(Gtk.PaperSize.new(Gtk.PAPER_NAME_A4 if paper == 'a4' else Gtk.PAPER_NAME_LETTER))
    # Поля: «m» — со всех сторон; «бок/верх/низ» — через запятую.
    ms = [float(x) for x in sys.argv[4].split(',')]
    side, top, bottom = (ms * 3)[:3] if len(ms) == 1 else ms
    setup.set_left_margin(side, Gtk.Unit.MM); setup.set_right_margin(side, Gtk.Unit.MM)
    setup.set_top_margin(top, Gtk.Unit.MM); setup.set_bottom_margin(bottom, Gtk.Unit.MM)
    op = WebKit2.PrintOperation.new(view)
    op.set_print_settings(ps); op.set_page_setup(setup)
    op.connect('finished', lambda *_: Gtk.main_quit())
    op.connect('failed', lambda o, e: (print('FAILED', e), Gtk.main_quit()))
    op.print_()
    return False
def loaded(v, ev):
    if ev == WebKit2.LoadEvent.FINISHED:
        GLib.timeout_add(int(wait * 1000), do_print)
view.connect('load-changed', loaded)
view.load_uri(url)
GLib.timeout_add(120000, lambda: (print('TIMEOUT'), Gtk.main_quit()))
Gtk.main()
