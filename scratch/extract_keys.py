import os, re
keys = set()
for r, d, files in os.walk('src'):
    for f in files:
        if f.endswith('.tsx'):
            content = open(os.path.join(r, f), encoding='utf-8').read()
            # find all t('key') inside <th> tags
            matches = re.findall(r'<th[^>]*>\{t\([\'"]([^\'"]+)[\'"]\)(?:[\s\|\|]*\'[^\']*\')?\}</th>', content)
            keys.update(matches)
            
            # also find all t('key') inside any element that looks like a table header
            matches2 = re.findall(r'<th[^>]*>\{t\([\'"]([^\'"]+)[\'"]\)', content)
            keys.update(matches2)

print("\n".join(sorted(keys)))
