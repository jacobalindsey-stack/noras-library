import os
src='georgiabuns-src'; parts=[open(f'{src}/head.html').read()]
for f in ['a_art.js','b_world.js','c_audio.js','g1_cast.js','g2_levels.js','h_drive.js','i_hub.js','d_game.js','e_render.js','f_ui.js']:
    parts.append(open(f'{src}/{f}').read())
parts.append("</script>\n</body>\n</html>\n")
open('georgiabuns.html','w').write('\n'.join(parts))
print('built', os.path.getsize('georgiabuns.html'))
