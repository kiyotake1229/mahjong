# 麻雀 4人打ち 社内説明資料（9枚）の生成。アプリ index.html の配色・書体をそのまま使う
# Python 3.9 のため f-string を入れ子にしない（部品を先に変数へ）
# 使い方: python3 資料/プレゼン資料/gen.py  → このフォルダに Main.dc.html / S02〜.dc.html / canvas.json / deck.html / PDF
import json, os
OUT = os.path.dirname(os.path.abspath(__file__))
PDF_NAME = '麻雀_社内説明.pdf'
APP, DATE, N = '麻雀 4人打ち', '2026-09-15', 9

BG, BG1, BG2, FELT = '#111713', '#18211c', '#212d26', '#234535'
GOLD, GOLDH, GOLDD, TEAL, SHU = '#c9a961', '#e3cd97', '#8a7440', '#4fbfa8', '#b8524a'
INK, MUTED, LINE, LINE2 = '#e8e6e0', '#a2a89f', 'rgba(255,255,255,.11)', 'rgba(201,169,97,.34)'
MAN, PIN, SOU, IVORY = '#b8392e', '#2a63a8', '#2b7d52', '#f4efe2'

HEAD = '''<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@600;700&family=Noto+Sans+JP:wght@400;700&display=swap">
  <style>
    body { margin: 0; background: #111713; color: #e8e6e0; font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic Medium", "Noto Sans JP", Meiryo, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
    a { color: #c9a961; } a:hover { color: #e3cd97; }
    .fd { font-family: "Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif; }
    .fm { font-family: "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Noto Sans JP", sans-serif; font-variant-numeric: tabular-nums; letter-spacing: .08em; }
    .ico { width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex: none; }
  </style>
</helmet>
'''
TAIL = '''</x-dc>
</body>
</html>
'''

ICON = {
 'book': '<svg class="ico" viewBox="0 0 24 24"><path d="M5 4h14v16l-3-2-4 2-4-2-3 2z"/><path d="M9 9h6M9 13h4"/></svg>',
 'users': '<svg class="ico" viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0"/><circle cx="17" cy="9" r="3"/><path d="M15.5 14.5a5 5 0 0 1 5.5 5.5"/></svg>',
 'alert': '<svg class="ico" viewBox="0 0 24 24"><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/></svg>',
 'check': '<svg class="ico" viewBox="0 0 24 24"><path d="M5 12l4 4L19 7"/></svg>',
 'story': '<svg class="ico" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-4 4z"/><path d="M8 9h8M8 12h5"/></svg>',
 'table': '<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16M12 4v16"/></svg>',
 'tour': '<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
 'hand': '<svg class="ico" viewBox="0 0 24 24"><path d="M7 11V6a1.5 1.5 0 0 1 3 0v5M10 10V5a1.5 1.5 0 0 1 3 0v6M13 10V6a1.5 1.5 0 0 1 3 0v6"/><path d="M16 12l2-2a1.5 1.5 0 0 1 2 2l-4 6a5 5 0 0 1-9 0l-2-4a1.5 1.5 0 0 1 2-1l1 1"/></svg>',
 'eye': '<svg class="ico" viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
 'tap': '<svg class="ico" viewBox="0 0 24 24"><path d="M9 11V5a2 2 0 0 1 4 0v6"/><path d="M13 10a2 2 0 0 1 4 0v2a2 2 0 0 1 4 0v3a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L5 13a1.7 1.7 0 0 1 3-1.5l1 1.5"/></svg>',
 'heart': '<svg class="ico" viewBox="0 0 24 24"><path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z"/></svg>',
 'spark': '<svg class="ico" viewBox="0 0 24 24"><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></svg>',
 'music': '<svg class="ico" viewBox="0 0 24 24"><path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/></svg>',
 'motion': '<svg class="ico" viewBox="0 0 24 24"><path d="M4 12h9M9 7l5 5-5 5"/><path d="M17 5v14"/></svg>',
 'phone': '<svg class="ico" viewBox="0 0 24 24"><rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/></svg>',
 'flag': '<svg class="ico" viewBox="0 0 24 24"><path d="M5 21V4h12l-2 4 2 4H5"/></svg>',
}

def tile(label, color, w=40, h=56, fs=20):
    return ('<div style="width:%dpx;height:%dpx;border-radius:5px;background:%s;color:%s;display:grid;place-items:center;font-size:%dpx;font-weight:700;box-shadow:0 2px 0 #cfc7b3,0 4px 8px rgba(0,0,0,.45);flex:none" class="fd">%s</div>'
            % (w, h, IVORY, color, fs, label))

MOTIF = '<div style="display:flex;gap:5px">%s%s%s</div>' % (tile('萬', MAN, 16, 22, 10), tile('筒', PIN, 16, 22, 10), tile('索', SOU, 16, 22, 10))

def slide(n, body, eyebrow, title, title_size=44):
    foot = ('<div style="position:absolute;left:64px;bottom:30px;display:flex;align-items:center;gap:14px">'
            '<span class="fm" style="font-size:13px;color:%s">No. %02d / %02d</span>'
            '<span style="width:1px;height:14px;background:%s"></span>'
            '<span class="fm" style="font-size:13px;color:%s">%s · 社内説明 · %s</span></div>'
            '<div style="position:absolute;right:64px;bottom:30px">%s</div>') % (MUTED, n, N, LINE2, MUTED, APP, DATE, MOTIF)
    head = ''
    if title:
        head = ('<div style="display:flex;flex-direction:column;gap:8px">'
                '<div class="fm" style="font-size:13px;color:%s">%s</div>'
                '<h1 class="fd" style="margin:0;font-size:%dpx;font-weight:700;line-height:1.25;letter-spacing:.01em;color:%s;text-wrap:balance">%s</h1></div>') % (GOLD, eyebrow, title_size, INK, title)
    return HEAD + ('<div style="width:1280px;height:720px;position:relative;overflow:hidden;background:%s;padding:56px 64px 72px;box-sizing:border-box;display:flex;flex-direction:column;gap:28px">'
                   '%s%s%s</div>\n') % (BG, head, body, foot) + TAIL

def paper(inner, extra=''):
    return '<div style="background:%s;color:#1b1a16;border-radius:10px;padding:24px 26px;display:flex;flex-direction:column;gap:10px;box-shadow:0 14px 34px rgba(0,0,0,.45);%s">%s</div>' % (IVORY, extra, inner)

def card(inner, extra=''):
    return '<div style="background:%s;border:1px solid %s;border-radius:10px;padding:22px 24px;display:flex;flex-direction:column;gap:10px;%s">%s</div>' % (BG1, LINE2, extra, inner)

def felt(inner, extra=''):
    return '<div style="background:%s;border:1px solid %s;border-radius:10px;padding:22px 24px;display:flex;flex-direction:column;gap:10px;%s">%s</div>' % (FELT, LINE2, extra, inner)

def tag(text, color=GOLD, bg='rgba(201,169,97,.14)'):
    return '<span class="fm" style="display:inline-flex;font-size:13px;padding:5px 9px;border-radius:4px;background:%s;color:%s">%s</span>' % (bg, color, text)

def head_row(icon, text, size=22, color=INK, icolor=GOLD):
    return '<div style="display:flex;align-items:center;gap:10px;color:%s">%s<span class="fd" style="font-size:%dpx;font-weight:700;color:%s">%s</span></div>' % (icolor, icon, size, color, text)

def p(text, size=16, color=MUTED, lh=1.8):
    return '<p style="margin:0;font-size:%spx;line-height:%s;color:%s">%s</p>' % (size, lh, color, text)

def grid(cols, items, gap=18):
    return '<div style="display:grid;grid-template-columns:repeat(%d,minmax(0,1fr));gap:%dpx;flex:1;align-content:start">%s</div>' % (cols, gap, ''.join(items))

def check_line(text, size=16):
    return '<div style="display:flex;gap:10px;align-items:flex-start;font-size:%dpx;line-height:1.7;color:%s"><span style="color:%s;margin-top:2px">%s</span><span>%s</span></div>' % (size, INK, TEAL, ICON['check'], text)

files = {}

# ---------- 01 表紙 ----------
stack = '<div style="display:flex;flex-direction:column;gap:10px;align-items:center;justify-content:center;flex:none;width:200px;border-right:1px solid %s">%s%s%s</div>' % (
    LINE2, tile('東', '#1b1a16', 64, 88, 34), tile('五', MAN, 64, 88, 34), tile('中', SHU, 64, 88, 34))
cover_body = ('<div style="flex:1;padding:40px 52px;display:flex;flex-direction:column;gap:14px;min-width:0">'
              '<div class="fm" style="font-size:15px;color:%s">社内説明 · アプリ開発 · %s</div>'
              '<div class="fd" style="font-size:92px;font-weight:700;line-height:1.05;letter-spacing:.02em;color:%s">麻雀 4人打ち</div>'
              '<div class="fd" style="font-size:26px;font-weight:700;line-height:1.5;color:%s">「雀荘 翠」で覚える、初心者から遊べる本格麻雀</div>'
              '<div class="fm" style="display:flex;gap:28px;font-size:14px;color:%s;border-top:1px solid %s;padding-top:16px;margin-top:6px">'
              '<span>SINGLE HTML · ひとり用はオフライン</span><span>PWA 対応</span><span>kiyotake1229.github.io/mahjong</span></div></div>') % (GOLD, DATE, GOLDH, INK, MUTED, LINE2)
cover = ('<div style="display:flex;align-items:center;justify-content:center;flex:1">'
         '<div style="display:flex;width:1060px;background:%s;border:1px solid %s;border-radius:14px;box-shadow:0 30px 70px rgba(0,0,0,.6);overflow:hidden">'
         '%s%s</div></div>') % (FELT, LINE2, stack, cover_body)
files['Main.dc.html'] = slide(1, cover, '', '')

# ---------- 02 ねらい ----------
pains = [
 ('book', 'ルールが多い', '役・符計算・フリテン・鳴き。覚えることが多く、入門書を読んでも卓に着くと手が止まる。'),
 ('users', '相手がいない', '4人揃わないと打てない。雀荘は初心者には敷居が高く、練習の場が身近にない。'),
 ('alert', '既存アプリは上級者向け', '説明なしで対局が始まり、広告と課金が多い。「なぜその牌を切るか」は教えてくれない。'),
]
items = [paper(head_row(ICON[i], t, 26, '#1b1a16', GOLDD) + p(d, 17, '#3b3a34', 1.85), 'min-height:250px') for i, t, d in pains]
body = grid(3, items, 22) + '<div style="font-size:18px;color:%s;line-height:1.7">遊びたい人は多いのに、「覚えるまで」で脱落する。物語と対局を往復しながら覚える一本にした。</div>' % MUTED
files['S02.dc.html'] = slide(2, body, '01 · ねらい', '麻雀は「覚えるまで」が一番の壁')

# ---------- 03 全体像 ----------
doors = [
 ('book', '道場', '8レッスン。牌のきほん／初あがり／リーチとロン／鳴きと守り／役とドラ／上級（フリテン・点数・七対子）。クイズとクリア称号つき。', '初めての人はここから'),
 ('story', 'ストーリー「雀荘 翠」', '店主と常連に教わりながら、会話で学び、対局で試す。全6章。出自で難易度が変わり、結末は4つ。', '遊びながら覚える本体'),
 ('table', '自由対局・みんなで対戦', 'CPU3人と半荘（強さは4段階）。「みんなで対戦」なら1台を回して、またはオンラインで友だちと最大4人。空いた席にはCPUが入る。', '覚えたら腕試し'),
]
items = [felt(head_row(ICON[i], t, 26) + p(d, 16, INK, 1.8) + '<div style="margin-top:auto">%s</div>' % tag(k), 'min-height:300px') for i, t, d, k in doors]
body = grid(3, items, 22) + ('<div style="display:flex;align-items:center;gap:16px;background:%s;color:#1b1a16;border-radius:10px;padding:18px 26px">'
                             '<span class="fd" style="font-size:24px;font-weight:700">どこから入っても、同じ卓に戻る。</span>'
                             '<span style="font-size:17px;color:#5e5c54">初心者モード・おたすけモード・画面の見方ツアーが3つの入口すべてを支える。</span></div>') % IVORY
files['S03.dc.html'] = slide(3, body, '02 · 全体像', '道場・物語・自由対局／対戦、3つの入口')

# ---------- 04 物語 ----------
chapters = [
 ('序章', '名前と出自を選ぶ', '出自が難易度。元ギャンブラー＝難しい／学生＝標準／新人＝やさしい', '難易度'),
 ('第一章', '翠の教え（全8節）', '牌のきほんから押し引きまで。節の後に「1局だけ実戦」を選べる', 'レッスン'),
 ('第二章', '腕試し（3戦）', 'ハヤト→シズカ→ゲン。賭けを受けると相手が最強に。流儀を制すとスキルを託される', 'ボス戦'),
 ('第三章', '岐路', 'チェーン店の買収。「翠を守る」か「新しい翠」かで分岐', '分岐'),
 ('第四章', '最後の一局', 'マスター戦。結末は4つ。真エンドは出自で締めが変わる', '結末'),
 ('第五章 / 第六章', '黒い手 / 白い塔', 'イカサマをする地上げ屋、手読みをする黒幕。クリア後に解放される追加章', '追加章'),
]
rows = ''
for c, t, d, k in chapters:
    rows += ('<div style="display:grid;grid-template-columns:120px minmax(0,1fr) 84px;gap:14px;align-items:center;padding:10px 0;border-bottom:1px solid %s">'
             '<span class="fd" style="font-size:16px;font-weight:700;color:%s">%s</span>'
             '<span style="font-size:15px;line-height:1.55;color:%s"><b style="color:%s">%s</b>　%s</span>%s</div>') % (LINE, GOLD, c, MUTED, INK, t, d, tag(k, TEAL, 'rgba(79,191,168,.14)'))
left = card('<div style="display:flex;flex-direction:column">%s</div>' % rows, 'padding:8px 24px 6px')
vn = felt(head_row(ICON['eye'], 'ビジュアルノベル風の会話', 21) + p('場所ごとの背景（店内・閉店後・路地・白い塔・黒牌）をSVGで描画。立ち絵と名前札、一文字ずつ出るテキスト、選択肢。対局のときだけ雀卓に戻る。', 15, INK, 1.75), 'flex:1')
note = felt(head_row(ICON['heart'], '翠ノート', 21) + p('出自・秘密・結末を集める収集ページ（16ページ）。「物語を最初から」で主人公を変えて、別の結末を見に行ける。', 15, INK, 1.75), 'flex:1')
right = '<div style="display:flex;flex-direction:column;gap:16px">%s%s</div>' % (vn, note)
body = '<div style="display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:28px;flex:1;align-content:stretch">%s%s</div>' % (left, right)
files['S04.dc.html'] = slide(4, body, '03 · 物語', '雀荘 翠 ── 会話で学び、対局で試す')

# ---------- 05 初心者の助け ----------
helps = [
 ('tour', '画面の見方ツアー', '10ステップ。手牌・河・名札・山・ドラ・ゲージ・ボタンを順に光らせて説明。第二節の冒頭で一度だけ自動、以後はメニューから'),
 ('hand', '手番ガイドとおすすめ牌', '初心者モードでは自分の番に案内が出る。相手のリーチ中は「現物」に切り替わり、押し引きを説明'),
 ('eye', 'いまの手を見る', '何シャンテン・待ち・フリテン、できている組、狙える役とその理由、おすすめの捨て牌と理由'),
 ('tap', '役名をタップで説明', '和了画面で役名を押すと解説。「なぜ上がれたか」がその場でわかる'),
 ('book', 'ルールブック', 'はじめに／役（牌の例つき）／鳴きと守り／点数／用語のタブ式。対局の途中でも開ける'),
 ('heart', 'おたすけモード', '物語の相手が1段階弱くなり、スキルゲージが1.5倍溜まる。対局中に切り替えても反映'),
]
items = [card(head_row(ICON[i], t, 21) + p(d, 15, MUTED, 1.7), 'min-height:170px') for i, t, d in helps]
files['S05.dc.html'] = slide(5, grid(3, items), '04 · 初心者の助け', '見て、聞いて、試せる')

# ---------- 06 本格ルール ----------
hand = [('二', MAN), ('三', MAN), ('四', MAN), ('二', PIN), ('三', PIN), ('四', PIN), ('二', SOU), ('三', SOU), ('四', SOU), ('五', SOU), ('六', SOU), ('七', SOU), ('九', MAN)]
tiles = ''.join(tile(l, c, 36, 52, 19) for l, c in hand)
tsumo = tile('九', MAN, 36, 52, 19)
hand_html = ('<div style="display:flex;flex-direction:column;gap:14px;align-items:flex-start">'
             '<div style="display:flex;gap:3px;align-items:flex-end">%s<div style="width:10px"></div>%s</div>'
             '<div style="display:flex;gap:8px;flex-wrap:wrap">%s%s%s</div>'
             '<div style="font-size:14px;color:%s;line-height:1.7">牌はすべてCSSで描画。画像ファイルは使っていない。</div></div>') % (tiles, tsumo, tag('三色同順'), tag('平和'), tag('門前清自摸和'), MUTED)
felt_hand = felt(head_row(ICON['table'], '例：三色同順・平和・ツモ', 20) + hand_html, 'padding:22px 24px 18px')
rules = [
 '半荘（東場〜南場）。ツモ／ロン、立直（一発・裏ドラ）、ダブル立直',
 'ポン・チー・カン（暗槓・加槓・大明槓）、槍槓、ダブロン、赤ドラ（ON/OFF）',
 '符計算と点数、本場・供託、フリテン（鳴かれた捨て牌も判定）',
 '対応役 30種以上。国士無双・四暗刻・大三元・字一色・清老頭まで',
 'CPUに性格3種と強さ4段階（やさしい〜鬼）、対局速度3段階',
 '物語のボスだけ特別なAI。人間の待ちを読んで振り込まない、配牌を積み込む（千里眼で封じる）',
]
right = '<div style="display:flex;flex-direction:column;gap:10px">' + ''.join(check_line(r, 15.5) for r in rules) + '</div>'
body = '<div style="display:grid;grid-template-columns:minmax(0,1fr) 460px;gap:36px;flex:1;align-content:start">%s%s</div>' % (felt_hand, right)
files['S06.dc.html'] = slide(6, body, '05 · 本格ルール', 'ルールは本物。省略しない')

# ---------- 07 演出と音 ----------
fx = [
 ('spark', '和了演出', '手牌が1枚ずつめくれ、役が順に出て、点数がカウントアップ。満貫以上は大きく表示。タップで省略できる。'),
 ('motion', '打牌と宣言', '切った牌が河へ飛んで着地する。リーチ宣言と「○○ 戦」はカットイン。点数変動が浮き上がる。'),
 ('music', '音はすべて生成', 'BGMと効果音はWeb Audioで合成。場面ごとのBGM（店内・閉店後・路地・白い塔・黒牌）、ボス戦は緊張感のあるループ。音源ファイルは0。'),
]
items = [paper(head_row(ICON[i], t, 28, '#1b1a16', GOLDD) + p(d, 16.5, '#3b3a34', 1.85), 'min-height:250px') for i, t, d in fx]
body = grid(3, items, 20) + ('<div style="display:flex;gap:24px;align-items:center">'
    '<div style="flex:1;font-size:18px;color:%s;line-height:1.7">これらすべてが <b style="color:%s">1つのHTML（約380KB）</b> に入っている。画像・音源ファイルは0。ひとりで遊ぶ間は通信も0。</div>'
    '<div style="font-size:14px;color:%s;line-height:1.7;max-width:420px;border-left:1px solid %s;padding-left:20px">背景・立ち絵・牌はSVGとCSSで描画。差し替えも追加もテキストの編集だけで済む。</div></div>') % (MUTED, INK, MUTED, LINE2)
files['S07.dc.html'] = slide(7, body, '06 · 演出と音', '手応えは、音と動きで作る')

# ---------- 08 現状 ----------
done = ['Web版 完成・公開中（GitHub Pages）', 'PWA対応。ホーム画面に追加すればアプリとして起動、オフラインで動く', '進捗・設定は端末内（localStorage）のみ。ひとり用は通信なし', 'みんなで対戦：1台で交代（2〜4人）／オンライン（部屋コードで最大4人。端末どうしで直接通信、部屋主が抜けても続行）', '道場8レッスン、物語6章、自由対局、翠ノート16ページ', '初心者向け：ツアー・おたすけモード・いまの手を見る・ルールブック', 'スマホ幅（375px）で14枚の手牌が収まるよう調整済み', 'プレイテストで見つかった点数・フリテン・符の不具合を修正済み']
left = '<div style="display:flex;flex-direction:column;gap:9px">' + ''.join(check_line(d) for d in done) + '</div>'
right = paper('<div class="fm" style="font-size:13px;color:#5e5c54">いま触れる</div>'
              '<div class="fd" style="font-size:22px;font-weight:700;line-height:1.3">kiyotake1229.github.io/mahjong/</div>'
              '<div style="font-size:15px;line-height:1.8;color:#3b3a34">iPhone の Safari で開き、共有メニューから「ホーム画面に追加」。はじめての人は道場かストーリーの序章から。</div>'
              '<div class="fm" style="display:flex;flex-wrap:wrap;gap:8px;border-top:1px dashed #cfc7b3;padding-top:14px;font-size:13px;color:#5e5c54"><span>単一 HTML</span><span>·</span><span>ひとり用は通信なし</span><span>·</span><span>端末内保存</span><span>·</span><span>約 380KB</span></div>', 'min-height:300px;justify-content:center')
body = '<div style="display:grid;grid-template-columns:minmax(0,1fr) 440px;gap:40px;flex:1;align-content:start">%s%s</div>' % (left, right)
files['S08.dc.html'] = slide(8, body, '07 · 現状', 'Web版は完成。いま触れる')

# ---------- 09 次のステップ ----------
road = [
 ('1', 'iOS 化', 'Capacitor で包む。コツコツの ios-app を雛形にすれば構築は半日。触覚フィードバックを追加', '半日'),
 ('2', '実機確認', '対局の速度、音、ホーム画面からの起動、データの永続化。スマホ幅での表示', '1〜2日'),
 ('3', '申請', '年齢制限 4+、カテゴリ「ゲーム／カード」、プライバシー欄（オンライン対戦で仲介サーバーと相手にIPアドレスが渡る点を踏まえて選ぶ）、スクリーンショット3サイズ。申請文面はコツコツと同じ形で下書き', '—'),
]
items = [card('<div class="fd" style="font-size:44px;font-weight:700;line-height:1;color:%s">%s</div><div class="fd" style="font-size:22px;font-weight:700">%s</div>%s<div class="fm" style="font-size:13px;color:%s;border-top:1px solid %s;padding-top:10px">目安 %s</div>' % (GOLD, n, t, p(d, 15, MUTED, 1.75).replace('<p style="', '<p style="flex:1;'), MUTED, LINE, w), 'min-height:270px') for n, t, d, w in road]
cost = paper('<div class="fm" style="font-size:12px;color:#5e5c54">費用</div><div style="display:flex;align-items:baseline;gap:10px"><span class="fd" style="font-size:36px;font-weight:700">¥12,800</span><span style="font-size:15px;color:#5e5c54">/ 年 · Apple Developer Program のみ</span></div><div style="font-size:14px;color:#3b3a34">自前のサーバーなし。他の維持費は0（中継サーバーを契約する時だけ別途）</div>', 'flex:1;padding:18px 24px;gap:6px')
decide = felt('<div class="fm" style="font-size:12px;color:%s">今日決めたいこと</div><div style="font-size:18px;font-weight:700;line-height:1.6">コツコツの次に、麻雀を iOS 化するか。PWA対応済みで、いちばん早く申請に進められる。</div>' % GOLD, 'flex:1;padding:18px 24px;gap:6px;justify-content:center')
body = grid(3, items) + '<div style="display:flex;gap:20px">%s%s</div>' % (cost, decide)
files['S09.dc.html'] = slide(9, body, '08 · 次のステップ', 'iOS 化は半日。今日決めたいこと')

# ---------- 書き出し ----------
for name, src in files.items():
    open(os.path.join(OUT, name), 'w', encoding='utf-8').write(src)

names = ['Main.dc.html'] + ['S%02d.dc.html' % i for i in range(2, N + 1)]
W, H, GX, GY = 1280, 720, 80, 140
boards = []
for i, f in enumerate(names):
    r, c = divmod(i, 5)
    boards.append({'file': f, 'x': c * (W + GX), 'y': r * (H + GY), 'w': W, 'h': H, 'title': '%02d' % (i + 1)})
json.dump({'artboards': boards, 'launch': {'view': 'focused', 'file': 'Main.dc.html'}}, open(os.path.join(OUT, 'canvas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# PDF 用（全スライドを1ページずつ並べたHTML。Chrome で印刷して PDF にする）
helmet = HEAD.split('<helmet>')[1].split('</helmet>')[0]
pages = ''.join('<div style="width:1280px;height:720px;page-break-after:always;overflow:hidden">%s</div>' % files[f].split('</helmet>\n')[1].split('</x-dc>')[0] for f in names)
deck = '<!doctype html><html><head><meta charset="utf-8"><title>%s 社内説明</title>%s<style>@page{size:1280px 720px;margin:0}html,body{margin:0}</style></head><body>%s</body></html>' % (APP, helmet, pages)
open(os.path.join(OUT, 'deck.html'), 'w', encoding='utf-8').write(deck)
print('written', len(files))

# PDF（このフォルダに書き出す。Chrome が無い環境ではスキップ）
import subprocess
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
PDF = os.path.join(OUT, PDF_NAME)
if os.path.exists(CHROME):
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--no-pdf-header-footer', '--virtual-time-budget=8000',
                    '--print-to-pdf=' + PDF, 'file://' + os.path.join(OUT, 'deck.html')],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
    print('pdf', PDF)
else:
    print('Chrome が見つからないため PDF は作っていません')
